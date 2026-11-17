import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { AdminOrderQuery, CreateAdminOrderInput, CreateCustomerOrderInput, OrderRepository, OrderUpdates } from '../domain/order.repository'
import { ORDER_REPOSITORY } from '../domain/order.repository'
import { OrderEventsService } from './order-events.service'
import { ProductService } from '../../products/application/product.service'
import { SettingsService } from '../../settings/application/settings.service'
import type { OrderEntity } from '../infrastructure/persistence/typeorm/order.entity'
import type { OrderItemEntity } from '../infrastructure/persistence/typeorm/order-item.entity'

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly events: OrderEventsService,
    private readonly products: ProductService,
    private readonly settings: SettingsService,
  ) {}

  async createCustomerOrder(body: any) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Order details are required.')
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const address = isRecord(body.deliveryAddress) ? body.deliveryAddress : null
    if (!customerName || !phone || !email || !address) {
      throw new BadRequestException('Customer name, phone, email, and delivery address are required.')
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('An order must contain at least 1 product.')
    }

    const items = body.items.flatMap((item: any) => {
      if (!item || typeof item !== 'object' || typeof item.sku !== 'string') return []
      const quantity = Number(item.quantity)
      if (!Number.isInteger(quantity) || quantity <= 0 || !item.sku.trim()) return []
      return [{ sku: item.sku.trim(), quantity }]
    })
    if (!items.length) throw new BadRequestException('One or more order items are invalid.')

    let requestedDeliveryTime: Date | null = null
    if (typeof body.requestedDeliveryTime === 'string' && body.requestedDeliveryTime) {
      requestedDeliveryTime = new Date(body.requestedDeliveryTime)
      if (Number.isNaN(requestedDeliveryTime.getTime())) throw new BadRequestException('Requested delivery time is invalid.')
    }
    const instructions = typeof body.customerInstructions === 'string'
      ? body.customerInstructions
      : typeof address.instructions === 'string' ? address.instructions : null

    const input: CreateCustomerOrderInput = {
      customerName,
      phone,
      email,
      deliveryAddress: address,
      paymentMethod: body.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
      requestedDeliveryTime,
      customerInstructions: instructions,
      channel: body.channel === 'whatsapp' ? 'whatsapp' : 'web',
      items,
    }

    try {
      const order = await this.orders.createCustomerOrder(input)
      this.events.emitCreated()
      return {
        orderId: String(order.id),
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.totalAmount),
        channel: order.channel,
        createdAt: order.createdAt,
      }
    } catch (error) {
      if (error instanceof Error && (error.message.includes('unavailable') || error.message.includes('insufficient stock'))) {
        throw new ConflictException(error.message)
      }
      throw error
    }
  }

  async createWhatsAppOrder(body: any) {
    const { customerName, items, deliveryAddress, phone } = body ?? {}
    if (!Array.isArray(items) || items.length === 0) throw new BadRequestException('No items provided')
    const skuItems = items.filter((item: any) => item && typeof item.sku === 'string' && item.sku)
    const products = await this.products.findActiveBySkus([...new Set(skuItems.map((item: any) => item.sku))])
    const productsBySku = new Map(products.map((product) => [product.sku, product]))
    let subtotal = 0
    const lines: string[] = []
    for (const item of skuItems) {
      const product = productsBySku.get(item.sku)
      if (!product) continue
      const quantity = Number(item.quantity) || 1
      const lineTotal = Number(product.price) * quantity
      subtotal += lineTotal
      lines.push(`• ${product.name} (x${quantity}) - RWF ${lineTotal.toLocaleString()}`)
    }
    const { shopName, whatsappNumber } = await this.settings.getWhatsAppDetails()
    const orderId = `WA-${Date.now().toString(36).toUpperCase()}`
    const deliveryFee = 10000
    const total = subtotal + deliveryFee
    const addressText = deliveryAddress
      ? `${deliveryAddress.district || ''}, ${deliveryAddress.sector || ''}, ${deliveryAddress.street || ''}`
      : 'Kigali'
    const messageText = `Hello ${shopName}! I would like to place an order:\n\nOrder Ref: ${orderId}\nCustomer: ${customerName || ''}\nPhone: ${phone || 'N/A'}\nDelivery Address: ${addressText}\n\nItems:\n${lines.join('\n')}\n\nSubtotal: RWF ${subtotal.toLocaleString()}\nDelivery: RWF ${deliveryFee.toLocaleString()}\nTotal: RWF ${total.toLocaleString()}\n\nPlease confirm availability and payment details.`
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '')
    return {
      success: true,
      orderId,
      whatsappUrl: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`,
      messageText,
    }
  }

  async listAdminOrders(query: Record<string, string | undefined>) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1)
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10) || 20))
    const filters: AdminOrderQuery = {
      page,
      pageSize,
      search: query.search || '',
      status: query.status || '',
      paymentStatus: query.paymentStatus || '',
      channel: query.channel || '',
    }
    const { rows, totalOrders } = await this.orders.listAdminOrders(filters)
    const totalPages = Math.ceil(totalOrders / pageSize) || 1
    return {
      orders: rows.map(serializeAdminOrderListItem),
      page,
      pageSize,
      totalOrders,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  }

  async createAdminOrder(body: any) {
    if (!body || !body.customerName || !body.phone || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Customer name, phone, and items are required')
    }
    const items = body.items.map((item: any) => ({
      productName: String(item.productName || 'Item'),
      category: String(item.category || 'General'),
      sku: String(item.sku || ''),
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
    }))
    if (items.some((item: CreateAdminOrderInput['items'][number]) => !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      throw new BadRequestException('Order items must have a valid quantity and unit price.')
    }
    const deliveryFee = Number(body.deliveryFee) || 10000
    const order = await this.orders.createAdminOrder({
      customerName: String(body.customerName),
      phone: String(body.phone),
      email: String(body.email || 'guest@dubazaarmart.rw'),
      deliveryAddress: isRecord(body.deliveryAddress) ? body.deliveryAddress : {},
      paymentMethod: String(body.paymentMethod || 'mtn'),
      status: String(body.status || 'PENDING_PAYMENT'),
      paymentStatus: String(body.paymentStatus || 'PENDING'),
      deliveryFee,
      items,
    })
    this.events.emitCreated()
    return { success: true, orderId: order.id, order: serializeOrder(order) }
  }

  async updateStatus(id: string, body: any) {
    const { status, paymentStatus } = body ?? {}
    if (!status && !paymentStatus) throw new BadRequestException('Status or paymentStatus is required')
    const data: OrderUpdates = {}
    if (status) data.status = String(status)
    if (paymentStatus) data.paymentStatus = String(paymentStatus)
    const order = await this.orders.update(id, data)
    if (!order) throw new NotFoundException('Order not found')
    return { success: true, order: serializeOrder(order) }
  }

  async recordPayment(id: string) {
    const current = await this.orders.findById(id)
    if (!current) throw new NotFoundException('Order not found')
    const order = await this.orders.update(id, {
      paymentStatus: 'PAID',
      status: current.status === 'PENDING_PAYMENT' ? 'PROCESSING' : current.status,
    })
    if (!order) throw new NotFoundException('Order not found')
    return { success: true, order: serializeOrder(order) }
  }

  async cancel(id: string, reason?: string) {
    const order = await this.orders.update(id, {
      status: 'CANCELLED',
      paymentStatus: 'CANCELLED',
      cancelReason: reason || 'Cancelled by admin',
    })
    if (!order) throw new NotFoundException('Order not found')
    return { success: true, order: serializeOrder(order) }
  }

  async remove(id: string) {
    if (!(await this.orders.delete(id))) throw new NotFoundException('Order not found')
    return { success: true, message: 'Order deleted successfully' }
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function serializeAdminOrderListItem(row: OrderEntity) {
  return {
    id: String(row.id),
    customerName: row.customerName,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.deliveryFee),
    total: Number(row.totalAmount),
    createdAt: row.createdAt,
    requestedDeliveryTime: row.requestedDeliveryTime,
    channel: row.channel,
    cancelReason: row.cancelReason,
    customerInstructions: row.customerInstructions,
    items: (row.items ?? []).map((item) => ({
      productName: item.productName,
      category: item.category,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  }
}

function serializeOrder(order: OrderEntity) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    totalAmount: Number(order.totalAmount),
    items: (order.items ?? []).map((item: OrderItemEntity) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  }
}
