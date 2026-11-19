import type { CompanyOrderEntity } from '../infrastructure/persistence/typeorm/company-order.entity'

export const PROCUREMENT_REPOSITORY = Symbol('PROCUREMENT_REPOSITORY')

export interface CompanyOrderQuery {
  search?: string
  status?: string
}

export interface CreateCompanyOrderInput {
  poNumber: string
  supplierName: string
  supplierContact: string
  shippingCompany: string
  expectedArrival: Date
  shippingCost: number
  otherCharges: number
  totalAmount: number
  notes: string
  items: Array<{ productName: string; category: string; unitPrice: number; quantityOrdered: number; totalPrice: number }>
}

export interface UpdateCompanyOrderInput {
  supplierName?: string
  supplierContact?: string
  shippingCompany?: string
  expectedArrival?: Date
  shippingCost?: number
  otherCharges?: number
  status?: string
  paymentStatus?: string
  notes?: string
  items?: Array<{
    id?: string
    productName: string
    category: string
    unitPrice: number
    quantityOrdered: number
  }>
}

export class PurchaseOrderUpdateError extends Error {}

export interface ProcurementRepository {
  list(query: CompanyOrderQuery): Promise<CompanyOrderEntity[]>
  create(input: CreateCompanyOrderInput): Promise<CompanyOrderEntity>
  update(id: string, values: UpdateCompanyOrderInput): Promise<CompanyOrderEntity | null>
  archive(id: string): Promise<boolean>
  receive(id: string, receivedItems: Array<{ itemId: string; quantityReceived: number }>): Promise<{ order: CompanyOrderEntity; addedCount: number } | null>
}
