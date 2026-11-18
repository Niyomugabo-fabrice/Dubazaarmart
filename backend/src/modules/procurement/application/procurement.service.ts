import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { ProcurementRepository } from '../domain/procurement.repository'
import { PROCUREMENT_REPOSITORY } from '../domain/procurement.repository'
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
    const values: Partial<CompanyOrderEntity> = {}
    if (body.status) values.status = String(body.status)
    if (body.paymentStatus) values.paymentStatus = String(body.paymentStatus)
    if (body.shippingCompany) values.shippingCompany = String(body.shippingCompany)
    if (body.expectedArrival) {
      const date = new Date(body.expectedArrival)
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Expected arrival date is invalid.')
      values.expectedArrival = date
    }
    if (!Object.keys(values).length) throw new BadRequestException('No fields to update')
    const order = await this.procurement.update(id, values)
    if (!order) throw new NotFoundException('Company order not found')
    return { success: true, companyOrder: serializeCompanyOrder(order) }
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
