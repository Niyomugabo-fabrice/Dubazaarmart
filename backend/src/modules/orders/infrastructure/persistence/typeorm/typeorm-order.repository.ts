import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, EntityManager, IsNull } from 'typeorm'
import { OrderStateConflictError } from '../../../domain/order.repository'
import type {
  AdminOrderQuery,
  AdminOrderUpdates,
  CreateAdminOrderInput,
  CreateCustomerOrderInput,
  CreateQuotationOrderInput,
  CreateSourcingOrderInput,
  CreateShippingOrderInput,
  AddOrderMessageInput,
  CreateOrderQuotationInput,
  OrderRepository,
  OrderUpdates,
} from '../../../domain/order.repository'
import { OrderEntity } from './order.entity'
import { OrderItemEntity } from './order-item.entity'
import { OrderMessageEntity } from './order-message.entity'
import { OrderQuotationEntity } from './order-quotation.entity'
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

      const lines = input.items.map((line) => {
        const product = productsBySku.get(line.sku)!
        const totalQuantityForSku = aggregated.get(line.sku) ?? line.quantity
        const moq = Math.max(1, product.moq ?? 1)
        const appliesWholesale = Boolean(
          product.wholesalePrice &&
          Number(product.wholesalePrice) > 0 &&
          totalQuantityForSku >= moq,
        )
        const unitPrice = appliesWholesale ? Number(product.wholesalePrice) : Number(product.price)
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
      const isMtn = input.paymentMethod === 'mtn'
      const status = input.status || (isMtn ? 'WAITING_APPROVAL' : 'PENDING_PAYMENT')
      const paymentStatus = input.paymentStatus || (isMtn ? 'WAITING_APPROVAL' : 'PENDING')

      const order = orderRepository.create({
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        deliveryAddress: input.deliveryAddress,
        orderType: input.orderType || 'shopping',
        mtnTransactionId: input.mtnTransactionId || null,
        status,
        paymentStatus,
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
    if (query.orderType && query.orderType !== 'ALL') builder.andWhere('order.orderType = :orderType', { orderType: query.orderType.toLowerCase() })
    const totalOrders = await builder.clone().getCount()
    const rows = await builder.skip((query.page - 1) * query.pageSize).take(query.pageSize).getMany()
    return { rows, totalOrders }
  }

  async listPendingPaymentApprovals(): Promise<OrderEntity[]> {
    return this.dataSource.getRepository(OrderEntity).createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.paymentStatus = :ps OR order.status = :st', {
        ps: 'WAITING_APPROVAL',
        st: 'WAITING_APPROVAL',
      })
      .orderBy('order.createdAt', 'DESC')
      .getMany()
  }

  async createQuotationOrder(input: CreateQuotationOrderInput): Promise<OrderEntity> {
    const repository = this.dataSource.getRepository(OrderEntity)
    const order = repository.create({
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      deliveryAddress: input.deliveryAddress,
      orderType: input.orderType,
      mtnTransactionId: input.mtnTransactionId,
      status: 'WAITING_APPROVAL',
      paymentStatus: 'WAITING_APPROVAL',
      paymentMethod: 'mtn',
      subtotal: String(input.amount),
      deliveryFee: '0',
      totalAmount: String(input.amount),
      channel: 'web',
      customerInstructions: `Quotation Ref: ${input.quotationRef}${input.description ? ' - ' + input.description : ''}`,
      items: [
        this.dataSource.getRepository(OrderItemEntity).create({
          productName: `${input.orderType === 'sourcing' ? 'Sourcing Service' : 'Shipping Logistics'} - Ref: ${input.quotationRef}`,
          category: input.orderType,
          sku: `QUOTE-${input.quotationRef}`,
          quantity: 1,
          unitPrice: String(input.amount),
          lineTotal: String(input.amount),
        }),
      ],
    })
    return repository.save(order)
  }

  async createSourcingOrder(input: CreateSourcingOrderInput): Promise<OrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(OrderEntity)
      const messageRepository = manager.getRepository(OrderMessageEntity)
      const orderItemRepository = manager.getRepository(OrderItemEntity)

      const targetBudget = input.targetBudget && Number(input.targetBudget) > 0 ? Number(input.targetBudget) : 0
      const order = orderRepository.create({
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        deliveryAddress: input.deliveryAddress,
        orderType: 'sourcing',
        status: 'RECEIVED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'mtn',
        subtotal: '0',
        deliveryFee: '0',
        totalAmount: String(targetBudget),
        channel: 'web',
        customerInstructions: input.specifications || null,
        requestDetails: {
          productName: input.productName,
          photoOrLink: input.photoOrLink || null,
          specifications: input.specifications || null,
          quantity: input.quantity,
          targetBudget: targetBudget || null,
          freightType: input.freightType,
        },
        items: [
          orderItemRepository.create({
            productName: input.productName,
            category: 'sourcing',
            sku: `SRC-${Date.now().toString(36).toUpperCase()}`,
            quantity: input.quantity,
            unitPrice: '0',
            lineTotal: '0',
          }),
        ],
      })

      const savedOrder = await orderRepository.save(order)

      await messageRepository.save(
        messageRepository.create({
          orderId: savedOrder.id,
          senderType: 'system',
          senderName: 'Dubazaar Sourcing Desk',
          message: `Sourcing request received for "${input.productName}" (${input.quantity} units, ${input.freightType} freight). Our sourcing specialists are reviewing verified suppliers and will send you a quotation.`,
          attachments: input.photoOrLink ? [input.photoOrLink] : [],
        }),
      )

      return savedOrder
    })
  }

  async createShippingOrder(input: CreateShippingOrderInput): Promise<OrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(OrderEntity)
      const messageRepository = manager.getRepository(OrderMessageEntity)
      const orderItemRepository = manager.getRepository(OrderItemEntity)

      const order = orderRepository.create({
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        deliveryAddress: input.deliveryAddress,
        orderType: 'shipping',
        status: 'RECEIVED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'mtn',
        subtotal: '0',
        deliveryFee: '0',
        totalAmount: '0',
        channel: 'web',
        customerInstructions: `Pickup: ${input.pickupAddress} | Weight/Size: ${input.weightOrSize}`,
        requestDetails: {
          cargoDescription: input.cargoDescription,
          weightOrSize: input.weightOrSize,
          pickupAddress: input.pickupAddress,
          freightType: input.freightType,
        },
        items: [
          orderItemRepository.create({
            productName: input.cargoDescription,
            category: 'shipping',
            sku: `SHP-${Date.now().toString(36).toUpperCase()}`,
            quantity: 1,
            unitPrice: '0',
            lineTotal: '0',
          }),
        ],
      })

      const savedOrder = await orderRepository.save(order)

      await messageRepository.save(
        messageRepository.create({
          orderId: savedOrder.id,
          senderType: 'system',
          senderName: 'Dubazaar Logistics Desk',
          message: `Shipping request received for "${input.cargoDescription}" (${input.freightType} freight, pickup: ${input.pickupAddress}, weight/size: ${input.weightOrSize}). Our logistics desk will calculate your freight quotation.`,
          attachments: [],
        }),
      )

      return savedOrder
    })
  }

  async findOrderWithThread(orderId: string): Promise<{ order: OrderEntity; messages: OrderMessageEntity[]; quotations: OrderQuotationEntity[] } | null> {
    const order = await this.dataSource.getRepository(OrderEntity).findOne({
      where: { id: orderId },
      relations: { items: true },
    })
    if (!order) return null

    const messages = await this.dataSource.getRepository(OrderMessageEntity).find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    })

    const quotations = await this.dataSource.getRepository(OrderQuotationEntity).find({
      where: { orderId },
      order: { version: 'ASC' },
    })

    return { order, messages, quotations }
  }

  async addOrderMessage(input: AddOrderMessageInput): Promise<OrderMessageEntity> {
    const messageRepo = this.dataSource.getRepository(OrderMessageEntity)
    const orderRepo = this.dataSource.getRepository(OrderEntity)

    const msg = messageRepo.create({
      orderId: input.orderId,
      senderType: input.senderType,
      senderName: input.senderName,
      senderId: input.senderId || null,
      message: input.message,
      attachments: input.attachments || [],
    })
    const saved = await messageRepo.save(msg)

    // If staff responds and order was just 'RECEIVED', transition to 'UNDER_NEGOTIATION'
    if (input.senderType === 'staff') {
      const order = await orderRepo.findOneBy({ id: input.orderId })
      if (order && order.status === 'RECEIVED') {
        order.status = 'UNDER_NEGOTIATION'
        await orderRepo.save(order)
      }
    }

    return saved
  }

  async createOrderQuotation(input: CreateOrderQuotationInput): Promise<OrderQuotationEntity> {
    return this.dataSource.transaction(async (manager) => {
      const quotationRepo = manager.getRepository(OrderQuotationEntity)
      const orderRepo = manager.getRepository(OrderEntity)
      const messageRepo = manager.getRepository(OrderMessageEntity)

      const order = await orderRepo.findOneBy({ id: input.orderId })
      if (!order) throw new Error('Order not found')

      const existingQuotations = await quotationRepo.findBy({ orderId: input.orderId })
      const nextVersion = (existingQuotations.length ? Math.max(...existingQuotations.map((q) => q.version)) : 0) + 1

      // Supersede previous pending quotations
      for (const q of existingQuotations) {
        if (q.status === 'PENDING') {
          q.status = 'SUPERSEDED'
          await quotationRepo.save(q)
        }
      }

      const totalAmount = Number((input.productCost + input.sourcingFee + input.shippingCost).toFixed(2))

      const quotation = quotationRepo.create({
        orderId: input.orderId,
        version: nextVersion,
        productCost: String(input.productCost),
        sourcingFee: String(input.sourcingFee),
        shippingCost: String(input.shippingCost),
        totalAmount: String(totalAmount),
        notes: input.notes || null,
        status: 'PENDING',
        createdBy: input.createdBy,
        createdByUserId: input.createdByUserId || null,
      })
      const savedQuotation = await quotationRepo.save(quotation)

      // Update order to 'QUOTATION_SENT' and update financial amounts
      order.status = 'QUOTATION_SENT'
      order.subtotal = String(input.productCost + input.sourcingFee)
      order.deliveryFee = String(input.shippingCost)
      order.totalAmount = String(totalAmount)
      await orderRepo.save(order)

      // Post in message thread
      await messageRepo.save(
        messageRepo.create({
          orderId: input.orderId,
          senderType: 'staff',
          senderName: input.createdBy,
          senderId: input.createdByUserId || null,
          message: `Official Quotation v${nextVersion} prepared: Total ${totalAmount.toLocaleString()} RWF (Product: ${input.productCost.toLocaleString()} RWF, Sourcing Fee: ${input.sourcingFee.toLocaleString()} RWF, Shipping: ${input.shippingCost.toLocaleString()} RWF)${input.notes ? ' | Notes: ' + input.notes : ''}. You can review and accept this quotation to proceed.`,
        }),
      )

      return savedQuotation
    })
  }

  async acceptOrderQuotation(orderId: string, mtnTransactionId: string): Promise<{ order: OrderEntity; quotation: OrderQuotationEntity }> {
    return this.dataSource.transaction(async (manager) => {
      const quotationRepo = manager.getRepository(OrderQuotationEntity)
      const orderRepo = manager.getRepository(OrderEntity)
      const messageRepo = manager.getRepository(OrderMessageEntity)

      const order = await orderRepo.findOneBy({ id: orderId })
      if (!order) throw new Error('Order not found')

      const quotations = await quotationRepo.find({
        where: { orderId },
        order: { version: 'DESC' },
      })
      const latestQuotation = quotations.find((q) => q.status === 'PENDING') || quotations[0]
      if (!latestQuotation) throw new Error('No quotation found for this order')

      latestQuotation.status = 'ACCEPTED'
      await quotationRepo.save(latestQuotation)

      order.status = 'WAITING_APPROVAL'
      order.paymentStatus = 'WAITING_APPROVAL'
      order.paymentMethod = 'mtn'
      order.mtnTransactionId = mtnTransactionId
      order.paymentRejectionReason = null
      const savedOrder = await orderRepo.save(order)

      await messageRepo.save(
        messageRepo.create({
          orderId,
          senderType: 'customer',
          senderName: order.customerName,
          message: `Quotation v${latestQuotation.version} accepted. Submitted MTN Mobile Money payment (Transaction ID: ${mtnTransactionId}). Status changed to "Waiting for payment approval".`,
        }),
      )

      return { order: savedOrder, quotation: latestQuotation }
    })
  }

  findById(id: string): Promise<OrderEntity | null> {
    return this.dataSource.getRepository(OrderEntity).findOne({ where: { id }, relations: { items: true } })
  }

  async update(id: string, values: OrderUpdates): Promise<OrderEntity | null> {
    const repository = this.dataSource.getRepository(OrderEntity)
    const result = await repository.update({ id, deletedAt: IsNull() }, values as any)
    return result.affected ? this.findById(id) : null
  }

  async updateAdminOrder(id: string, values: AdminOrderUpdates): Promise<OrderEntity | null> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(OrderEntity)
      const order = await orderRepository.createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.id = :id', { id })
        .andWhere('order.deletedAt IS NULL')
        .getOne()
      if (!order) return null

      const items = await manager.getRepository(OrderItemEntity).findBy({ orderId: id })
      if (order.status === 'CANCELLED' && values.status && values.status !== 'CANCELLED') {
        throw new OrderStateConflictError('Cancelled orders cannot be reopened.')
      }
      if (values.status === 'CANCELLED' && order.status !== 'CANCELLED') {
        await this.restoreOrderStock(manager, id, items)
        order.cancelReason = order.cancelReason || 'Cancelled by admin'
      }

      Object.assign(order, values)
      if (values.status === 'CANCELLED') order.paymentStatus = 'CANCELLED'
      order.items = items
      return orderRepository.save(order)
    })
  }

  cancel(id: string, reason: string): Promise<OrderEntity | null> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(OrderEntity)
      const order = await orderRepository.createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.id = :id', { id })
        .getOne()
      if (!order) return null

      const items = await manager.getRepository(OrderItemEntity).findBy({ orderId: id })
      if (order.status !== 'CANCELLED') {
        await this.restoreOrderStock(manager, id, items)

        order.status = 'CANCELLED'
        order.paymentStatus = 'CANCELLED'
        order.cancelReason = reason
        await orderRepository.save(order)
      }

      order.items = items
      return order
    })
  }

  private async restoreOrderStock(manager: EntityManager, orderId: string, items: OrderItemEntity[]) {
    const restockQuantities = new Map<string, number>()
    for (const item of items) {
      if (item.productId) {
        restockQuantities.set(item.productId, (restockQuantities.get(item.productId) ?? 0) + item.quantity)
      }
    }

    const productRepository = manager.getRepository(ProductEntity)
    for (const [productId, quantity] of restockQuantities) {
      const product = await productRepository.createQueryBuilder('product')
        .setLock('pessimistic_write')
        .where('product.id = :productId', { productId })
        .getOne()
      if (!product) continue

      product.quantity += quantity
      await productRepository.save(product)
      await manager.getRepository(StockMovementEntity).insert({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        movementType: 'ADJUSTMENT',
        reason: 'Order cancelled and stock restored',
        referenceId: orderId,
      })
    }
  }

  async archive(id: string): Promise<boolean> {
    const result = await this.dataSource.getRepository(OrderEntity).softDelete({ id })
    return Boolean(result.affected)
  }
}
