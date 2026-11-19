import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { ProcurementRepository, UpdateCompanyOrderInput } from '../domain/procurement.repository'
import { PROCUREMENT_REPOSITORY, PurchaseOrderUpdateError } from '../domain/procurement.repository'
import type { CompanyOrderEntity } from '../infrastructure/persistence/typeorm/company-order.entity'

@Injectable()
export class ProcurementService {
  constructor(@Inject(PROCUREMENT_REPOSITORY) private readonly procurement: ProcurementRepository) {}

  async list(search?: string, status?: string) {
    const rows = await this.procurement.list({ search, status })
    return { companyOrders: rows.map(serializeCompanyOrder) }
  }

  async create(body: Record<string, any>) {
    const { supplierName, expectedArrival, items } = body
    if (!supplierName || !expectedArrival || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Supplier name, expected arrival date, and items are required')
    }
    const arrival = new Date(expectedArrival)
    if (Number.isNaN(arrival.getTime())) throw new BadRequestException('Expected arrival date is invalid.')
    const normalizedItems = items.map((item: any) => {
      const unitPrice = Number(item.unitPrice || 0)
      const quantityOrdered = Number(item.quantityOrdered || 1)
      if (!item.productName || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isInteger(quantityOrdered) || quantityOrdered <= 0) {
        throw new BadRequestException('Each purchase item needs a name, non-negative price, and positive whole quantity.')
      }
      return {
        productName: String(item.productName),
        category: String(item.category || 'electronics'),
        unitPrice,
        quantityOrdered,
        totalPrice: unitPrice * quantityOrdered,
      }
    })
    const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const shippingCost = Number(body.shippingCost) || 0
    const otherCharges = Number(body.otherCharges) || 0
    if (!Number.isFinite(shippingCost) || shippingCost < 0 || !Number.isFinite(otherCharges) || otherCharges < 0) {
      throw new BadRequestException('Shipping costs and other charges must be non-negative numbers.')
    }
    const poNumber = `PO-${Date.now().toString().slice(-6)}`
    const companyOrder = await this.procurement.create({
      poNumber,
      supplierName: String(supplierName),
      supplierContact: String(body.supplierContact || ''),
      shippingCompany: String(body.shippingCompany || ''),
      expectedArrival: arrival,
      shippingCost,
      otherCharges,
      totalAmount: itemsTotal + shippingCost + otherCharges,
      notes: String(body.notes || ''),
      items: normalizedItems,
    })
    return { success: true, companyOrder: serializeCompanyOrder(companyOrder) }
  }

  async update(id: string, body: Record<string, any>) {
    const values: UpdateCompanyOrderInput = {}
    if (body.supplierName !== undefined) values.supplierName = requireText(body.supplierName, 'Supplier name')
    if (body.supplierContact !== undefined) values.supplierContact = requireText(body.supplierContact, 'Supplier contact', true)
    if (body.shippingCompany !== undefined) values.shippingCompany = requireText(body.shippingCompany, 'Shipping company', true)
    if (body.expectedArrival !== undefined) values.expectedArrival = parseDate(body.expectedArrival)
    if (body.shippingCost !== undefined) values.shippingCost = parseNonNegativeNumber(body.shippingCost, 'Shipping cost')
    if (body.otherCharges !== undefined) values.otherCharges = parseNonNegativeNumber(body.otherCharges, 'Other charges')
    if (body.notes !== undefined) values.notes = requireText(body.notes, 'Notes', true)
    if (body.status !== undefined) {
      values.status = requireChoice(body.status, ['ORDERED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'], 'Status')
    }
    if (body.paymentStatus !== undefined) {
      values.paymentStatus = requireChoice(body.paymentStatus, ['PAID', 'PENDING', 'PARTIAL'], 'Payment status')
    }
    if (body.items !== undefined) values.items = normalizeUpdateItems(body.items)
    if (!Object.keys(values).length) throw new BadRequestException('No fields to update')
    try {
      const order = await this.procurement.update(id, values)
      if (!order) throw new NotFoundException('Company order not found')
      return { success: true, companyOrder: serializeCompanyOrder(order) }
    } catch (error) {
      if (error instanceof PurchaseOrderUpdateError) throw new BadRequestException(error.message)
      throw error
    }
  }

  async remove(id: string) {
    if (!(await this.procurement.archive(id))) throw new NotFoundException('Company order not found')
    return { success: true, message: 'Company order archived' }
  }

  async receive(id: string, body: Record<string, any>) {
    if (!Array.isArray(body.receivedItems) || body.receivedItems.length === 0) {
      throw new BadRequestException('receivedItems array is required')
    }
    const receivedItems = body.receivedItems.map((item: any) => ({
      itemId: String(item.itemId || ''),
      quantityReceived: Number(item.quantityReceived || 0),
    }))
    if (receivedItems.some((item) => !item.itemId || !Number.isInteger(item.quantityReceived) || item.quantityReceived < 0)) {
      throw new BadRequestException('Received item quantities must be non-negative whole numbers.')
    }
    try {
      const result = await this.procurement.receive(id, receivedItems)
      if (!result) throw new NotFoundException('Company order not found')
      return {
        success: true,
        po: serializeCompanyOrder(result.order),
        addedCount: result.addedCount,
        message: `Successfully received ${result.addedCount} units into stock.`,
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Received quantity exceeds')) {
        throw new BadRequestException(error.message)
      }
      throw error
    }
  }
}

function requireText(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    throw new BadRequestException(`${label} must be ${allowEmpty ? 'a string' : 'provided'}.`)
  }
  return value.trim()
}

function parseDate(value: unknown): Date {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new BadRequestException('Expected arrival date is invalid.')
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Expected arrival date is invalid.')
  return date
}

function parseNonNegativeNumber(value: unknown, label: string): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim())) {
    throw new BadRequestException(`${label} must be a non-negative number.`)
  }
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < 0) {
    throw new BadRequestException(`${label} must be a non-negative number.`)
  }
  return number
}

function requireChoice<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new BadRequestException(`${label} is invalid.`)
  }
  return value as T
}

function normalizeUpdateItems(value: unknown): NonNullable<UpdateCompanyOrderInput['items']> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('At least one purchase order item is required.')
  }
  const seenIds = new Set<string>()
  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new BadRequestException('Each purchase order item must be an object.')
    }
    const input = item as Record<string, unknown>
    const productName = requireText(input.productName, 'Product name')
    const category = input.category === undefined ? 'electronics' : requireText(input.category, 'Category', true)
    const unitPrice = parseNonNegativeNumber(input.unitPrice, 'Unit price')
    const quantityOrdered = Number(input.quantityOrdered)
    if (!Number.isInteger(quantityOrdered) || quantityOrdered <= 0) {
      throw new BadRequestException('Item quantity must be a positive whole number.')
    }
    let id: string | undefined
    if (input.id !== undefined) {
      if (typeof input.id !== 'string' || !input.id.trim() || seenIds.has(input.id)) {
        throw new BadRequestException('Purchase order item identifiers must be unique strings.')
      }
      id = input.id
      seenIds.add(id)
    }
    return { id, productName, category, unitPrice, quantityOrdered }
  })
}

function serializeCompanyOrder(row: CompanyOrderEntity) {
  return {
    id: String(row.id),
    poNumber: row.poNumber,
    supplierName: row.supplierName,
    supplierContact: row.supplierContact || '',
    shippingCompany: row.shippingCompany || '',
    orderDate: row.orderDate,
    expectedArrival: row.expectedArrival,
    currency: row.currency || 'USD',
    shippingCost: Number(row.shippingCost || 0),
    otherCharges: Number(row.otherCharges || 0),
    totalAmount: Number(row.totalAmount || 0),
    status: row.status,
    paymentStatus: row.paymentStatus,
    notes: row.notes || '',
    items: (row.items ?? []).map((item) => ({
      id: String(item.id),
      productName: item.productName,
      category: item.category,
      unitPrice: Number(item.unitPrice),
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      totalPrice: Number(item.totalPrice),
      addedToStock: item.addedToStock,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
