import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import {
  PurchaseOrderUpdateError,
  type CompanyOrderQuery,
  type CreateCompanyOrderInput,
  type ProcurementRepository,
  type UpdateCompanyOrderInput,
} from '../../../domain/procurement.repository'
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

  async update(id: string, values: UpdateCompanyOrderInput) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(CompanyOrderEntity)
      const order = await orderRepository.createQueryBuilder('po')
        .setLock('pessimistic_write')
        .where('po.id = :id', { id })
        .getOne()
      if (!order) return null

      const itemsRepository = manager.getRepository(CompanyOrderItemEntity)
      const existingItems = values.items
        ? await itemsRepository.createQueryBuilder('item')
          .setLock('pessimistic_write')
          .where('item.orderId = :id', { id })
          .getMany()
        : []

      if (values.items) {
        const existingById = new Map(existingItems.map((item) => [item.id, item]))
        const retainedIds = new Set<string>()
        const updatedItems = values.items.map((input) => {
          const existing = input.id ? existingById.get(input.id) : undefined
          if (input.id && !existing) {
            throw new PurchaseOrderUpdateError('An item does not belong to this purchase order.')
          }
          if (existing) {
            if (input.quantityOrdered < existing.quantityReceived) {
              throw new PurchaseOrderUpdateError(`Quantity for ${existing.productName} cannot be less than the quantity already received.`)
            }
            if (existing.quantityReceived > 0 && input.productName !== existing.productName) {
              throw new PurchaseOrderUpdateError(`The name of ${existing.productName} cannot change after items have been received.`)
            }
            retainedIds.add(existing.id)
          }
          const unitPriceCents = amountInCents(input.unitPrice)
          return itemsRepository.create({
            ...(existing ?? {}),
            orderId: id,
            productName: input.productName,
            category: input.category,
            unitPrice: (unitPriceCents / 100).toFixed(2),
            quantityOrdered: input.quantityOrdered,
            quantityReceived: existing?.quantityReceived ?? 0,
            totalPrice: (unitPriceCents * input.quantityOrdered / 100).toFixed(2),
            addedToStock: existing?.addedToStock ?? false,
          })
        })
        const removedItems = existingItems.filter((item) => !retainedIds.has(item.id))
        const receivedItem = removedItems.find((item) => item.quantityReceived > 0)
        if (receivedItem) {
          throw new PurchaseOrderUpdateError(`Received item ${receivedItem.productName} cannot be removed from a purchase order.`)
        }
        if (removedItems.length > 0) await itemsRepository.delete(removedItems.map((item) => item.id))
        order.items = await itemsRepository.save(updatedItems)
      } else {
        order.items = await itemsRepository.findBy({ orderId: id })
      }

      if (values.status === 'RECEIVED' && order.status !== 'RECEIVED') {
        const productsRepository = manager.getRepository(ProductEntity)
        const movementsRepository = manager.getRepository(StockMovementEntity)
        for (const item of order.items) {
          const quantityReceived = item.quantityOrdered - item.quantityReceived
          if (quantityReceived <= 0) continue

          const product = await productsRepository.createQueryBuilder('product')
            .setLock('pessimistic_write')
            .where('LOWER(product.name) = LOWER(:name)', { name: item.productName })
            .getOne()
          if (product) {
            product.quantity += quantityReceived
            await productsRepository.save(product)
          }
          item.quantityReceived += quantityReceived
          item.addedToStock = true
          await movementsRepository.insert({
            productId: product?.id ?? item.id,
            productName: item.productName,
            sku: product?.sku || '',
            quantity: quantityReceived,
            movementType: 'PURCHASE_RECEIPT',
            reason: `Company Purchase Order Received – ${order.poNumber}`,
            referenceId: id,
          })
        }
        await itemsRepository.save(order.items)
      }

      if (values.supplierName !== undefined) order.supplierName = values.supplierName
      if (values.supplierContact !== undefined) order.supplierContact = values.supplierContact
      if (values.shippingCompany !== undefined) order.shippingCompany = values.shippingCompany
      if (values.expectedArrival !== undefined) order.expectedArrival = values.expectedArrival
      if (values.status !== undefined) order.status = values.status
      if (values.paymentStatus !== undefined) order.paymentStatus = values.paymentStatus
      if (values.notes !== undefined) order.notes = values.notes

      const shippingCostCents = amountInCents(values.shippingCost ?? Number(order.shippingCost))
      const otherChargesCents = amountInCents(values.otherCharges ?? Number(order.otherCharges))
      order.shippingCost = (shippingCostCents / 100).toFixed(2)
      order.otherCharges = (otherChargesCents / 100).toFixed(2)
      const itemsTotalCents = order.items.reduce(
        (sum, item) => sum + amountInCents(Number(item.unitPrice)) * item.quantityOrdered,
        0,
      )
      order.totalAmount = ((itemsTotalCents + shippingCostCents + otherChargesCents) / 100).toFixed(2)

      return orderRepository.save(order)
    })
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
          reason: `Company Purchase Order Received – ${order.poNumber}`,
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

function amountInCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100)
}
