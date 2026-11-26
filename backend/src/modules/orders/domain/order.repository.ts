import type { OrderEntity } from '../infrastructure/persistence/typeorm/order.entity'
import type { OrderMessageEntity } from '../infrastructure/persistence/typeorm/order-message.entity'
import type { OrderQuotationEntity } from '../infrastructure/persistence/typeorm/order-quotation.entity'

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY')

export interface CustomerOrderLine {
  sku: string
  quantity: number
}

export interface CreateCustomerOrderInput {
  customerName: string
  phone: string
  email: string
  deliveryAddress: Record<string, unknown>
  paymentMethod: 'mtn' | 'airtel' | string
  orderType?: 'wholesale' | 'shopping' | 'sourcing' | 'shipping'
  mtnTransactionId?: string | null
  status?: string
  paymentStatus?: string
  requestedDeliveryTime?: Date | null
  customerInstructions?: string | null
  channel: 'web' | 'whatsapp'
  items: CustomerOrderLine[]
}

export interface AdminOrderQuery {
  page: number
  pageSize: number
  search?: string
  status?: string
  paymentStatus?: string
  channel?: string
  orderType?: string
}

export type OrderUpdates = Partial<Pick<OrderEntity, 'status' | 'paymentStatus' | 'paymentMethod' | 'cancelReason' | 'mtnTransactionId' | 'orderType' | 'paymentApprovedAt' | 'paymentApprovedBy' | 'paymentRejectionReason' | 'subtotal' | 'deliveryFee' | 'totalAmount' | 'requestDetails'>>
export type AdminOrderUpdates = OrderUpdates & Pick<OrderEntity, 'deliveryAddress' | 'adminNotes'>

export class OrderStateConflictError extends Error {}

export interface CreateAdminOrderInput {
  customerName: string
  phone: string
  email: string
  deliveryAddress: Record<string, unknown>
  paymentMethod: string
  orderType?: 'wholesale' | 'shopping' | 'sourcing' | 'shipping'
  mtnTransactionId?: string | null
  status: string
  paymentStatus: string
  deliveryFee: number
  items: Array<{ productName: string; category: string; sku: string; quantity: number; unitPrice: number }>
}

export interface CreateQuotationOrderInput {
  customerName: string
  phone: string
  email: string
  deliveryAddress: Record<string, unknown>
  quotationRef: string
  orderType: 'sourcing' | 'shipping'
  amount: number
  mtnTransactionId: string
  description?: string
}

export interface CreateSourcingOrderInput {
  productName: string
  photoOrLink?: string
  specifications?: string
  quantity: number
  targetBudget?: number
  freightType: 'Sea' | 'Air'
  customerName: string
  phone: string
  email: string
  deliveryAddress: Record<string, unknown>
}

export interface CreateShippingOrderInput {
  cargoDescription: string
  weightOrSize: string
  pickupAddress: string
  deliveryAddress: Record<string, unknown>
  freightType: 'Sea' | 'Air'
  customerName: string
  phone: string
  email: string
}

export interface AddOrderMessageInput {
  orderId: string
  senderType: 'customer' | 'staff' | 'system'
  senderName: string
  senderId?: string | null
  message: string
  attachments?: string[]
}

export interface CreateOrderQuotationInput {
  orderId: string
  productCost: number
  sourcingFee: number
  shippingCost: number
  notes?: string
  createdBy: string
  createdByUserId?: string | null
}

export interface OrderRepository {
  createCustomerOrder(input: CreateCustomerOrderInput): Promise<OrderEntity>
  createQuotationOrder(input: CreateQuotationOrderInput): Promise<OrderEntity>
  createSourcingOrder(input: CreateSourcingOrderInput): Promise<OrderEntity>
  createShippingOrder(input: CreateShippingOrderInput): Promise<OrderEntity>
  createAdminOrder(input: CreateAdminOrderInput): Promise<OrderEntity>
  listAdminOrders(query: AdminOrderQuery): Promise<{ rows: OrderEntity[]; totalOrders: number }>
  listPendingPaymentApprovals(): Promise<OrderEntity[]>
  findById(id: string): Promise<OrderEntity | null>
  findOrderWithThread(orderId: string): Promise<{ order: OrderEntity; messages: OrderMessageEntity[]; quotations: OrderQuotationEntity[] } | null>
  addOrderMessage(input: AddOrderMessageInput): Promise<OrderMessageEntity>
  createOrderQuotation(input: CreateOrderQuotationInput): Promise<OrderQuotationEntity>
  acceptOrderQuotation(orderId: string, mtnTransactionId: string): Promise<{ order: OrderEntity; quotation: OrderQuotationEntity }>
  update(id: string, values: OrderUpdates): Promise<OrderEntity | null>
  updateAdminOrder(id: string, values: AdminOrderUpdates): Promise<OrderEntity | null>
  cancel(id: string, reason: string): Promise<OrderEntity | null>
  archive(id: string): Promise<boolean>
}
