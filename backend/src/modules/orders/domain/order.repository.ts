import type { OrderEntity } from '../infrastructure/persistence/typeorm/order.entity'

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
  paymentMethod: 'mtn' | 'airtel'
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
}

export type OrderUpdates = Partial<Pick<OrderEntity, 'status' | 'paymentStatus' | 'cancelReason'>>

export interface CreateAdminOrderInput {
  customerName: string
  phone: string
  email: string
  deliveryAddress: Record<string, unknown>
  paymentMethod: string
  status: string
  paymentStatus: string
  deliveryFee: number
  items: Array<{ productName: string; category: string; sku: string; quantity: number; unitPrice: number }>
}

export interface OrderRepository {
  createCustomerOrder(input: CreateCustomerOrderInput): Promise<OrderEntity>
  createAdminOrder(input: CreateAdminOrderInput): Promise<OrderEntity>
  listAdminOrders(query: AdminOrderQuery): Promise<{ rows: OrderEntity[]; totalOrders: number }>
  findById(id: string): Promise<OrderEntity | null>
  update(id: string, values: OrderUpdates): Promise<OrderEntity | null>
  delete(id: string): Promise<boolean>
}
