import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import type { AdminOrderQuery, CreateAdminOrderInput, CreateCustomerOrderInput, OrderRepository, OrderUpdates } from '../../../domain/order.repository'
import { CustomerEntity } from './customer.entity'
import { OrderEntity } from './order.entity'
import { OrderItemEntity } from './order-item.entity'
import { ProductEntity } from '../../../../products/infrastructure/persistence/typeorm/product.entity'
import { StockMovementEntity } from '../../../../inventory/infrastructure/persistence/typeorm/stock-movement.entity'

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  createCustomerOrder(input: CreateCustomerOrderInput): Promise<OrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(ProductEntity)
      const requestedSkus = [...new Set(input.items.map((item) => item.sku))]
      const lockedProducts = await productRepository.createQueryBuilder('product')
        .setLock('pessimistic_write')
        .where('product.sku IN (:...skus)', { skus: requestedSkus })
        .andWhere('product.active = true')
        .getMany()
      const productsBySku = new Map(lockedProducts.map((product) => [product.sku, product]))

      for (const line of input.items) {
        const product = productsBySku.get(line.sku)
        if (!product) throw new Error(`Product ${line.sku} is unavailable. Please update your cart.`)
      }

      const aggregated = new Map<string, number>()
      for (const line of input.items) aggregated.set(line.sku, (aggregated.get(line.sku) ?? 0) + line.quantity)
      for (const [sku, quantity] of aggregated) {
        const product = productsBySku.get(sku)!
        if (product.quantity < quantity) throw new Error(`Product ${sku} has insufficient stock. Please update your cart.`)
      }

      const customerRepository = manager.getRepository(CustomerEntity)
      let customer = await customerRepository.findOneBy({ email: input.email })
      if (customer) {
        customer.name = input.customerName
        customer = await customerRepository.save(customer)
      } else {
        customer = await customerRepository.save(customerRepository.create({ name: input.customerName, email: input.email }))
      }

      const lines = input.items.map((line) => {
        const product = productsBySku.get(line.sku)!
        const unitPrice = Number(product.price)
        return {
          product,
          productId: product.id,
          productName: product.name,
          category: product.category || 'Uncategorized',
          sku: product.sku,
          quantity: line.quantity,
          unitPrice,
          lineTotal: Number((unitPrice * line.quantity).toFixed(2)),
        }
      })
      const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0)
      const deliveryFee = 10000
      const orderRepository = manager.getRepository(OrderEntity)
      const order = orderRepository.create({
        customerId: customer.id,
        customer,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        deliveryAddress: input.deliveryAddress,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentMethod: input.paymentMethod,
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee),
        totalAmount: String(subtotal + deliveryFee),
        requestedDeliveryTime: input.requestedDeliveryTime ?? null,
        channel: input.channel,
        customerInstructions: input.customerInstructions ?? null,
        items: lines.map((line) => manager.getRepository(OrderItemEntity).create({
          productId: line.productId,
          product: line.product,
          productName: line.productName,
          category: line.category,
          sku: line.sku,
          quantity: line.quantity,
          unitPrice: String(line.unitPrice),
          lineTotal: String(line.lineTotal),
        })),
      })
      const savedOrder = await orderRepository.save(order)

      for (const [sku, quantity] of aggregated) {
        const product = productsBySku.get(sku)!
        product.quantity -= quantity
        await productRepository.save(product)
        await manager.getRepository(StockMovementEntity).insert({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: -quantity,
          movementType: 'SALE',
          reason: 'Customer Order Placed',
          referenceId: savedOrder.id,
        })
      }
      return savedOrder
    })
  }

  createAdminOrder(input: CreateAdminOrderInput): Promise<OrderEntity> {
    const items = input.items.map((item) => {
      const lineTotal = Number((item.unitPrice * item.quantity).toFixed(2))
      return { ...item, lineTotal }
    })
    const subtotal = items.reduce((total, item) => total + item.lineTotal, 0)
    const repository = this.dataSource.getRepository(OrderEntity)
    return repository.save(repository.create({
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      deliveryAddress: input.deliveryAddress,
      status: input.status,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      subtotal: String(subtotal),
      deliveryFee: String(input.deliveryFee),
      totalAmount: String(subtotal + input.deliveryFee),
      channel: 'web',
      items: items.map((item) => this.dataSource.getRepository(OrderItemEntity).create({
        productName: item.productName,
        category: item.category,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        lineTotal: String(item.lineTotal),
      })),
    }))
  }

  async listAdminOrders(query: AdminOrderQuery): Promise<{ rows: OrderEntity[]; totalOrders: number }> {
    const builder = this.dataSource.getRepository(OrderEntity).createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .orderBy('order.createdAt', 'DESC')
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`
      builder.andWhere('(order.customerName ILIKE :term OR order.email ILIKE :term OR order.phone ILIKE :term)', { term })
    }
    if (query.status && query.status !== 'ALL') builder.andWhere('order.status = :status', { status: query.status })
    if (query.paymentStatus && query.paymentStatus !== 'ALL') builder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: query.paymentStatus })
    if (query.channel && query.channel !== 'ALL') builder.andWhere('order.channel = :channel', { channel: query.channel })
    const totalOrders = await builder.clone().getCount()
    const rows = await builder.skip((query.page - 1) * query.pageSize).take(query.pageSize).getMany()
    return { rows, totalOrders }
  }

  findById(id: string): Promise<OrderEntity | null> {
    return this.dataSource.getRepository(OrderEntity).findOne({ where: { id }, relations: { items: true } })
  }

  async update(id: string, values: OrderUpdates): Promise<OrderEntity | null> {
    const repository = this.dataSource.getRepository(OrderEntity)
    const result = await repository.update({ id }, values)
    return result.affected ? this.findById(id) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dataSource.getRepository(OrderEntity).delete({ id })
    return Boolean(result.affected)
  }
}
