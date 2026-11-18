import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, IsNull } from 'typeorm'
import type { CompanyOrderQuery, CreateCompanyOrderInput, ProcurementRepository } from '../../../domain/procurement.repository'
import { CompanyOrderEntity } from './company-order.entity'
import { CompanyOrderItemEntity } from './company-order-item.entity'
import { ProductEntity } from '../../../../products/infrastructure/persistence/typeorm/product.entity'
import { StockMovementEntity } from '../../../../inventory/infrastructure/persistence/typeorm/stock-movement.entity'

@Injectable()
export class TypeOrmProcurementRepository implements ProcurementRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  list(query: CompanyOrderQuery) {
    const builder = this.dataSource.getRepository(CompanyOrderEntity).createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'item')
      .orderBy('po.createdAt', 'DESC')
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`
      builder.andWhere('(po.poNumber ILIKE :term OR po.supplierName ILIKE :term OR po.shippingCompany ILIKE :term)', { term })
    }
    if (query.status && query.status !== 'ALL') builder.andWhere('po.status = :status', { status: query.status })
    return builder.getMany()
  }

  create(input: CreateCompanyOrderInput) {
    const repository = this.dataSource.getRepository(CompanyOrderEntity)
    const itemsRepository = this.dataSource.getRepository(CompanyOrderItemEntity)
    return repository.save(repository.create({
      poNumber: input.poNumber,
      supplierName: input.supplierName,
      supplierContact: input.supplierContact,
      shippingCompany: input.shippingCompany,
      expectedArrival: input.expectedArrival,
      shippingCost: String(input.shippingCost),
      otherCharges: String(input.otherCharges),
      totalAmount: String(input.totalAmount),
      notes: input.notes,
      items: input.items.map((item) => itemsRepository.create({
        productName: item.productName,
        category: item.category,
        unitPrice: String(item.unitPrice),
        quantityOrdered: item.quantityOrdered,
        quantityReceived: 0,
        totalPrice: String(item.totalPrice),
        addedToStock: false,
      })),
    }))
  }

  async update(id: string, values: Partial<CompanyOrderEntity>) {
    const repository = this.dataSource.getRepository(CompanyOrderEntity)
    const result = await repository.update({ id, deletedAt: IsNull() }, values)
    return result.affected ? repository.findOne({ where: { id }, relations: { items: true } }) : null
  }

  async archive(id: string) {
    const result = await this.dataSource.getRepository(CompanyOrderEntity).softDelete({ id })
    return Boolean(result.affected)
  }

  receive(id: string, receivedItems: Array<{ itemId: string; quantityReceived: number }>) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(CompanyOrderEntity)
      const order = await orderRepository.createQueryBuilder('po')
        .setLock('pessimistic_write')
        .where('po.id = :id', { id })
        .getOne()
      if (!order) return null
      order.items = await manager.getRepository(CompanyOrderItemEntity).findBy({ orderId: id })

      let addedCount = 0
      for (const received of receivedItems) {
        const item = order.items.find((candidate) => candidate.id === received.itemId)
        if (!item || received.quantityReceived <= 0) continue
        if (item.quantityReceived + received.quantityReceived > item.quantityOrdered) {
          throw new Error(`Received quantity exceeds the remaining quantity for ${item.productName}.`)
        }
        item.quantityReceived += received.quantityReceived
        item.addedToStock = true
        addedCount += received.quantityReceived

        const product = await manager.getRepository(ProductEntity).createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('LOWER(product.name) = LOWER(:name)', { name: item.productName })
          .getOne()
        const productId = product?.id ?? item.id
        if (product) {
          product.quantity += received.quantityReceived
          await manager.getRepository(ProductEntity).save(product)
        }
        await manager.getRepository(StockMovementEntity).insert({
          productId,
          productName: item.productName,
          sku: product?.sku || '',
          quantity: received.quantityReceived,
          movementType: 'PURCHASE_RECEIPT',
          reason: 'Company Purchase Order Received',
          referenceId: id,
        })
      }

      const totalOrdered = order.items.reduce((sum, item) => sum + item.quantityOrdered, 0)
      const totalReceived = order.items.reduce((sum, item) => sum + item.quantityReceived, 0)
      order.status = totalReceived >= totalOrdered ? 'RECEIVED' : 'PARTIALLY_RECEIVED'
      await manager.getRepository(CompanyOrderItemEntity).save(order.items)
      const saved = await orderRepository.save(order)
      return { order: saved, addedCount }
    })
  }
}
