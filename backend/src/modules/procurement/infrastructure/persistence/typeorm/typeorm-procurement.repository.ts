import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, In, type EntityManager } from 'typeorm'
import {
  PurchaseOrderAlreadyReceivedError,
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
    return this.dataSource.transaction(async (manager) => {
      const productsRepository = manager.getRepository(ProductEntity)
      const productIds = input.items.map((item) => item.productId)
      const products = await productsRepository.findBy({ id: In(productIds), active: true })
      const productsById = new Map(products.map((product) => [product.id, product]))
      if (productsById.size !== productIds.length) throw new PurchaseOrderUpdateError('Every purchase order line must use an existing product.')

      const orderRepository = manager.getRepository(CompanyOrderEntity)
      const itemsRepository = manager.getRepository(CompanyOrderItemEntity)
      return orderRepository.save(orderRepository.create({
        poNumber: input.poNumber,
        supplierName: input.supplierName,
        supplierContact: input.supplierContact,
        shippingCompany: input.shippingCompany,
        expectedArrival: input.expectedArrival,
        shippingCost: String(input.shippingCost),
        otherCharges: String(input.otherCharges),
        totalAmount: String(input.totalAmount),
        notes: input.notes,
        items: input.items.map((item) => {
          const product = productsById.get(item.productId)!
          return itemsRepository.create({
            productId: product.id,
            productName: product.name,
            category: product.category,
            unitPrice: String(item.unitPrice),
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            totalPrice: String(item.totalPrice),
            addedToStock: false,
          })
        }),
      }))
    })
  }

  async update(id: string, values: UpdateCompanyOrderInput) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(CompanyOrderEntity)
      const order = await orderRepository.createQueryBuilder('po')
        .setLock('pessimistic_write')
        .where('po.id = :id', { id })
        .getOne()
      if (!order) return null
      if (order.status === 'RECEIVED' && values.status !== undefined && values.status !== 'RECEIVED') {
        throw new PurchaseOrderUpdateError('This purchase order has already been received.')
      }
      const itemsRepository = manager.getRepository(CompanyOrderItemEntity)
      const existingItems = values.items
        ? await itemsRepository.createQueryBuilder('item')
          .setLock('pessimistic_write')
          .where('item.orderId = :id', { id })
          .getMany()
        : []

      if (order.status === 'RECEIVED' && values.items) {
        const existingById = new Map(existingItems.map((item) => [item.id, item]))
        const itemsUnchanged = values.items.length === existingItems.length && values.items.every((input) => {
          const existing = input.id ? existingById.get(input.id) : undefined
          return existing && input.productId === existing.productId && input.unitPrice === Number(existing.unitPrice) && input.quantityOrdered === existing.quantityOrdered
        })
        if (!itemsUnchanged) throw new PurchaseOrderUpdateError('Items on a received purchase order cannot be changed.')
      }

      if (values.items) {
        const productIds = values.items.map((item) => item.productId)
        if (new Set(productIds).size !== productIds.length) {
          throw new PurchaseOrderUpdateError('A product can only appear once on a purchase order.')
        }
        const products = await manager.getRepository(ProductEntity).findBy({ id: In(productIds) })
        const productsById = new Map(products.map((product) => [product.id, product]))
        if (productsById.size !== productIds.length) {
          throw new PurchaseOrderUpdateError('Every purchase order line must use an existing product.')
        }
        const existingById = new Map(existingItems.map((item) => [item.id, item]))
        const retainedIds = new Set<string>()
        const updatedItems = values.items.map((input) => {
          const existing = input.id ? existingById.get(input.id) : undefined
          if (input.id && !existing) {
            throw new PurchaseOrderUpdateError('An item does not belong to this purchase order.')
          }
          if (existing) {
            if (existing.quantityReceived > 0 && input.productId !== existing.productId) {
              throw new PurchaseOrderUpdateError(`The product on ${existing.productName} cannot change after items have been received.`)
            }
            if (input.quantityOrdered < existing.quantityReceived) {
              throw new PurchaseOrderUpdateError(`Quantity for ${existing.productName} cannot be less than the quantity already received.`)
            }
            retainedIds.add(existing.id)
          }
          const product = productsById.get(input.productId)!
          const unitPriceCents = amountInCents(input.unitPrice)
          return itemsRepository.create({
            ...(existing ?? {}),
            orderId: id,
            productId: product.id,
            productName: product.name,
            category: product.category,
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
        await receiveAllRemainingItems(manager, order)
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

  receive(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(CompanyOrderEntity)
      const order = await orderRepository.createQueryBuilder('po')
        .setLock('pessimistic_write')
        .where('po.id = :id', { id })
        .getOne()
      if (!order) return null
      order.items = await manager.getRepository(CompanyOrderItemEntity).findBy({ orderId: id })
      if (order.status === 'RECEIVED') throw new PurchaseOrderAlreadyReceivedError('This purchase order has already been received.')

      const addedCount = await receiveAllRemainingItems(manager, order)
      order.status = 'RECEIVED'
      await manager.getRepository(CompanyOrderItemEntity).save(order.items)
      const saved = await orderRepository.save(order)
      return { order: saved, addedCount }
    })
  }
}

async function receiveAllRemainingItems(manager: EntityManager, order: CompanyOrderEntity): Promise<number> {
  const productsRepository = manager.getRepository(ProductEntity)
  const movementsRepository = manager.getRepository(StockMovementEntity)
  const receivedAt = new Date()
  let addedCount = 0

  for (const item of order.items) {
    const quantityReceived = item.quantityOrdered - item.quantityReceived
    if (quantityReceived <= 0) continue
    if (!item.productId) throw new PurchaseOrderUpdateError(`Product for ${item.productName} is no longer available.`)

    const product = await productsRepository.createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id = :id', { id: item.productId })
      .getOne()
    if (!product) throw new PurchaseOrderUpdateError(`Product for ${item.productName} is no longer available.`)

    product.quantity += quantityReceived
    product.unitCost = String(item.unitPrice)
    await productsRepository.save(product)
    item.quantityReceived += quantityReceived
    item.addedToStock = true
    addedCount += quantityReceived

    await movementsRepository.insert({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: quantityReceived,
      movementType: 'PURCHASE_RECEIPT',
      reason: `Company Purchase Order Received – ${order.poNumber}`,
      referenceId: order.id,
      createdAt: receivedAt,
    })
  }

  return addedCount
}

function amountInCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100)
}
