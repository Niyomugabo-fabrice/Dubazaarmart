import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { OrderStateConflictError } from '../domain/order.repository'
import type { AdminOrderQuery, AdminOrderUpdates, CreateAdminOrderInput, CreateCustomerOrderInput, OrderRepository, OrderUpdates } from '../domain/order.repository'
import { ORDER_REPOSITORY } from '../domain/order.repository'
import { OrderEventsService } from './order-events.service'
import { ProductService } from '../../products/application/product.service'
import { SettingsService } from '../../settings/application/settings.service'
import { AuditService } from '../../audit/application/audit.service'
import type { OrderEntity } from '../infrastructure/persistence/typeorm/order.entity'
import type { OrderItemEntity } from '../infrastructure/persistence/typeorm/order-item.entity'
import type { UserIdentity } from '../../auth/domain/user-account'

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly events: OrderEventsService,
    private readonly products: ProductService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
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

    const paymentMethod = typeof body.paymentMethod === 'string' && body.paymentMethod === 'airtel' ? 'airtel' : 'mtn'
    const mtnTransactionId = typeof body.mtnTransactionId === 'string' && body.mtnTransactionId.trim()
      ? body.mtnTransactionId.trim()
      : null
    const orderType = typeof body.orderType === 'string' && ['wholesale', 'shopping', 'sourcing', 'shipping'].includes(body.orderType.toLowerCase())
      ? (body.orderType.toLowerCase() as 'wholesale' | 'shopping' | 'sourcing' | 'shipping')
      : 'shopping'

    const isMtn = paymentMethod === 'mtn'
    const status = isMtn ? 'WAITING_APPROVAL' : 'PENDING_PAYMENT'
    const paymentStatus = isMtn ? 'WAITING_APPROVAL' : 'PENDING'

    const input: CreateCustomerOrderInput = {
      customerName,
      phone,
      email,
      deliveryAddress: address,
      paymentMethod,
      orderType,
      mtnTransactionId,
      status,
      paymentStatus,
      requestedDeliveryTime: typeof body.requestedDeliveryTime === 'string' ? new Date(body.requestedDeliveryTime) : null,
      channel: 'web',
      items,
      customerInstructions: typeof body.customerInstructions === 'string' ? body.customerInstructions : null,
    }

    try {
      const order = await this.orders.createCustomerOrder(input)
      this.events.emitCreated()

      await this.audit.record({
        action: 'orders.created',
        targetResource: 'orders',
        targetId: String(order.id),
        recordNumber: String(order.id),
        newValues: {
          customerName: order.customerName,
          phone: order.phone,
          email: order.email,
          total: Number(order.totalAmount),
          channel: 'web',
          paymentMethod: order.paymentMethod,
          orderType: order.orderType,
          mtnTransactionId: order.mtnTransactionId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          itemCount: order.items?.length || 0,
        },
        metadata: {
          channel: 'web',
          paymentMethod: order.paymentMethod,
          orderType: order.orderType,
          mtnTransactionId: order.mtnTransactionId,
        },
      })

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
      const moq = Math.max(1, product.moq ?? 1)
      const appliesWholesale = Boolean(
        product.wholesalePrice &&
        Number(product.wholesalePrice) > 0 &&
        quantity >= moq,
      )
      const unitPrice = appliesWholesale ? Number(product.wholesalePrice) : Number(product.price)
      const lineTotal = unitPrice * quantity
      subtotal += lineTotal
      lines.push(`• ${product.name} (x${quantity}) - RWF ${lineTotal.toLocaleString()}${appliesWholesale ? ' [Wholesale Price Applied]' : ''}`)
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

    await this.audit.record({
      action: 'orders.created_whatsapp',
      targetResource: 'orders',
      targetId: orderId,
      recordNumber: orderId,
      newValues: {
        customerName: customerName || null,
        phone: phone || null,
        total,
        channel: 'whatsapp',
        itemCount: skuItems.length,
      },
      metadata: { channel: 'whatsapp' },
    })

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
      orderType: query.orderType || '',
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

  async createAdminOrder(body: any, actor?: UserIdentity) {
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

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Admin',
      action: 'orders.created_admin',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      newValues: {
        customerName: order.customerName,
        phone: order.phone,
        total: Number(order.totalAmount),
        status: order.status,
        paymentStatus: order.paymentStatus,
        channel: 'admin',
      },
      metadata: { channel: 'admin' },
    })

    return { success: true, orderId: order.id, order: serializeOrder(order) }
  }

  async updateStatus(id: string, body: any, actor?: UserIdentity) {
    const { status, paymentStatus } = body ?? {}
    if (!status && !paymentStatus) throw new BadRequestException('Status or paymentStatus is required')
    const current = await this.orders.findById(id)
    if (!current) throw new NotFoundException('Order not found')

    const data: OrderUpdates = {}
    if (status) data.status = String(status)
    if (paymentStatus) data.paymentStatus = String(paymentStatus)
    const order = await this.orders.update(id, data)
    if (!order) throw new NotFoundException('Order not found')

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'orders.status_changed',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      oldValues: {
        status: current.status,
        paymentStatus: current.paymentStatus,
      },
      newValues: {
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    })

    return { success: true, order: serializeOrder(order) }
  }

  async updateAdminOrder(id: string, body: unknown, actor?: UserIdentity) {
    if (!isRecord(body)) throw new BadRequestException('Order changes are required.')

    const editableStatuses = new Set([
      'RECEIVED',
      'UNDER_NEGOTIATION',
      'QUOTATION_SENT',
      'PENDING',
      'PENDING_PAYMENT',
      'WAITING_APPROVAL',
      'PAYMENT_REJECTED',
      'PAID',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ])
    const paymentStatuses = new Set(['UNPAID', 'PENDING', 'WAITING_APPROVAL', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED', 'CANCELLED', 'REFUNDED'])
    if (typeof body.status !== 'string' || !editableStatuses.has(body.status)) {
      throw new BadRequestException('Order status is invalid.')
    }
    if (typeof body.paymentStatus !== 'string' || !paymentStatuses.has(body.paymentStatus)) {
      throw new BadRequestException('Payment status is invalid.')
    }
    if (!isRecord(body.deliveryAddress)) {
      throw new BadRequestException('A shipping address is required.')
    }
    if (typeof body.adminNotes !== 'string' || body.adminNotes.length > 5000) {
      throw new BadRequestException('Admin notes must be 5000 characters or fewer.')
    }

    const deliveryAddress = Object.create(null) as Record<string, string>
    for (const [key, value] of Object.entries(body.deliveryAddress)) {
      if (!key.trim() || typeof value !== 'string' || value.length > 500) {
        throw new BadRequestException('Shipping address fields must be text with 500 characters or fewer.')
      }
      deliveryAddress[key] = value.trim()
    }

    const current = await this.orders.findById(id)
    if (!current) throw new NotFoundException('Order not found')
    if (current.status === 'CANCELLED' && body.status !== 'CANCELLED') {
      throw new BadRequestException('Cancelled orders cannot be reopened.')
    }

    const updates: AdminOrderUpdates = {
      status: body.status,
      paymentStatus: body.status === 'CANCELLED' ? 'CANCELLED' : body.paymentStatus,
      deliveryAddress,
      adminNotes: body.adminNotes.trim(),
    }

    try {
      const order = await this.orders.updateAdminOrder(id, updates)
      if (!order) throw new NotFoundException('Order not found')

      await this.audit.record({
        actorUserId: actor?.id ?? null,
        actorName: actor?.name ?? 'Staff',
        action: 'orders.updated',
        targetResource: 'orders',
        targetId: String(order.id),
        recordNumber: String(order.id),
        oldValues: {
          status: current.status,
          paymentStatus: current.paymentStatus,
          adminNotes: current.adminNotes,
        },
        newValues: {
          status: order.status,
          paymentStatus: order.paymentStatus,
          adminNotes: order.adminNotes,
        },
      })

      return { success: true, order: serializeAdminOrderListItem(order) }
    } catch (error) {
      if (error instanceof OrderStateConflictError) {
        throw new ConflictException(error.message)
      }
      throw error
    }
  }

  async findById(id: string) {
    const order = await this.orders.findById(id)
    if (!order) throw new NotFoundException('Order not found')
    return serializeOrder(order)
  }

  async submitPayment(id: string, body: any) {
    const mtnTransactionId = typeof body?.mtnTransactionId === 'string' ? body.mtnTransactionId.trim() : ''
    if (!mtnTransactionId) {
      throw new BadRequestException('MTN transaction ID is required.')
    }
    const current = await this.orders.findById(id)
    if (!current) throw new NotFoundException('Order not found')

    const order = await this.orders.update(id, {
      mtnTransactionId,
      paymentMethod: 'mtn',
      status: 'WAITING_APPROVAL',
      paymentStatus: 'WAITING_APPROVAL',
      paymentRejectionReason: null,
    })
    if (!order) throw new NotFoundException('Order not found')

    this.events.emitCreated()

    await this.audit.record({
      action: 'payments.submitted',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      oldValues: {
        status: current.status,
        paymentStatus: current.paymentStatus,
        mtnTransactionId: current.mtnTransactionId,
      },
      newValues: {
        status: order.status,
        paymentStatus: order.paymentStatus,
        mtnTransactionId: order.mtnTransactionId,
      },
      metadata: {
        amount: Number(order.totalAmount),
        phone: order.phone,
        customerName: order.customerName,
      },
    })

    return { success: true, order: serializeOrder(order) }
  }

  async acceptQuotation(body: any) {
    if (!isRecord(body)) throw new BadRequestException('Quotation acceptance details are required.')
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const quotationRef = typeof body.quotationRef === 'string' ? body.quotationRef.trim() : `QT-${Date.now().toString(36).toUpperCase()}`
    const orderType = body.orderType === 'shipping' ? 'shipping' : 'sourcing'
    const amount = Number(body.amount)
    const mtnTransactionId = typeof body.mtnTransactionId === 'string' ? body.mtnTransactionId.trim() : ''
    const address = isRecord(body.deliveryAddress) ? body.deliveryAddress : { city: 'Kigali', address: 'Rwanda' }

    if (!customerName || !phone || !email) {
      throw new BadRequestException('Customer name, phone, and email are required.')
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('A valid quotation amount is required.')
    }
    if (!mtnTransactionId) {
      throw new BadRequestException('MTN transaction ID is required.')
    }

    const order = await this.orders.createQuotationOrder({
      customerName,
      phone,
      email,
      deliveryAddress: address,
      quotationRef,
      orderType,
      amount,
      mtnTransactionId,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
    })

    this.events.emitCreated()

    await this.audit.record({
      action: 'quotations.accepted',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: quotationRef,
      newValues: {
        customerName,
        phone,
        quotationRef,
        orderType,
        totalAmount: amount,
        mtnTransactionId,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      metadata: { orderType, quotationRef },
    })

    return { success: true, orderId: String(order.id), order: serializeOrder(order) }
  }

  async listPendingPaymentApprovals() {
    const orders = await this.orders.listPendingPaymentApprovals()
    return {
      count: orders.length,
      approvals: orders.map(serializeAdminOrderListItem),
    }
  }

  async approvePayment(id: string, actor?: UserIdentity) {
    const current = await this.orders.findById(id)
    if (!current) throw new NotFoundException('Order not found')

    const order = await this.orders.update(id, {
      paymentStatus: 'PAID',
      status: 'PENDING',
      paymentApprovedAt: new Date(),
      paymentApprovedBy: actor?.name || 'Staff',
      paymentRejectionReason: null,
    })
    if (!order) throw new NotFoundException('Order not found')

    this.events.emitCreated()

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'payments.approved',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      oldValues: {
        status: current.status,
        paymentStatus: current.paymentStatus,
      },
      newValues: {
        status: 'PENDING',
        paymentStatus: 'PAID',
        approvedBy: actor?.name || 'Staff',
      },
      metadata: {
        total: Number(order.totalAmount),
        mtnTransactionId: order.mtnTransactionId,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
      },
    })

    return { success: true, order: serializeAdminOrderListItem(order) }
  }

  async rejectPayment(id: string, body: any, actor?: UserIdentity) {
    const reason = typeof body?.reason === 'string' && body.reason.trim()
      ? body.reason.trim()
      : 'Payment could not be verified on MTN MoMo statement.'
    const current = await this.orders.findById(id)
    if (!current) throw new NotFoundException('Order not found')

    const order = await this.orders.update(id, {
      paymentStatus: 'REJECTED',
      status: 'PAYMENT_REJECTED',
      paymentRejectionReason: reason,
    })
    if (!order) throw new NotFoundException('Order not found')

    this.events.emitCreated()

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'payments.rejected',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      oldValues: {
        status: current.status,
        paymentStatus: current.paymentStatus,
      },
      newValues: {
        status: 'PAYMENT_REJECTED',
        paymentStatus: 'REJECTED',
        reason,
      },
      metadata: {
        total: Number(order.totalAmount),
        mtnTransactionId: order.mtnTransactionId,
        orderType: order.orderType,
        reason,
      },
    })

    return { success: true, order: serializeAdminOrderListItem(order) }
  }

  async recordPayment(id: string, actor?: UserIdentity) {
    return this.approvePayment(id, actor)
  }

  async cancel(id: string, reason?: string, actor?: UserIdentity) {
    const current = await this.orders.findById(id)
    const order = await this.orders.cancel(id, reason || 'Cancelled by admin')
    if (!order) throw new NotFoundException('Order not found')

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'orders.cancelled',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      oldValues: {
        status: current?.status ?? 'UNKNOWN',
        paymentStatus: current?.paymentStatus ?? 'UNKNOWN',
      },
      newValues: {
        status: 'CANCELLED',
        reason: reason || 'Cancelled by admin',
      },
    })

    return { success: true, order: serializeOrder(order) }
  }

  async remove(id: string, actor?: UserIdentity) {
    if (!(await this.orders.archive(id))) throw new NotFoundException('Order not found')

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'orders.deleted',
      targetResource: 'orders',
      targetId: id,
      recordNumber: id,
    })

    return { success: true, message: 'Order archived successfully' }
  }

  async createSourcingOrder(body: any) {
    if (!isRecord(body)) throw new BadRequestException('Sourcing details are required.')
    const productName = typeof body.productName === 'string' ? body.productName.trim() : ''
    const quantity = Number(body.quantity)
    const customerName = typeof body.customerName === 'string'
      ? body.customerName.trim()
      : typeof body.fullName === 'string'
        ? body.fullName.trim()
        : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const deliveryAddress = isRecord(body.deliveryAddress)
      ? body.deliveryAddress
      : { address: typeof body.deliveryAddress === 'string' ? body.deliveryAddress.trim() : 'Kigali, Rwanda' }
    const freightType = body.freightType === 'Air' ? 'Air' : 'Sea'
    const targetBudget = body.targetBudget ? Number(body.targetBudget) : undefined

    if (!productName) throw new BadRequestException('Product name or description is required.')
    if (!Number.isInteger(quantity) || quantity < 1) throw new BadRequestException('Quantity must be a positive whole number.')
    if (!customerName || !phone) throw new BadRequestException('Customer contact details (name and phone) are required.')

    const order = await this.orders.createSourcingOrder({
      productName,
      photoOrLink: typeof body.photoOrLink === 'string' ? body.photoOrLink.trim() : undefined,
      specifications: typeof body.specifications === 'string' ? body.specifications.trim() : undefined,
      quantity,
      targetBudget,
      freightType,
      customerName,
      phone,
      email,
      deliveryAddress,
    })

    this.events.emitCreated()

    await this.audit.record({
      action: 'orders.sourcing_requested',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      newValues: {
        productName,
        quantity,
        freightType,
        customerName,
        phone,
        status: 'RECEIVED',
        paymentStatus: 'UNPAID',
      },
      metadata: { orderType: 'sourcing', freightType },
    })

    return {
      success: true,
      orderId: String(order.id),
      order: serializeOrder(order),
      message: 'Sourcing request received. Our team will review suppliers and send you a quotation.',
    }
  }

  async createShippingOrder(body: any) {
    if (!isRecord(body)) throw new BadRequestException('Shipping request details are required.')
    const cargoDescription = typeof body.cargoDescription === 'string' ? body.cargoDescription.trim() : ''
    const weightOrSize = typeof body.weightOrSize === 'string' ? body.weightOrSize.trim() : ''
    const pickupAddress = typeof body.pickupAddress === 'string' ? body.pickupAddress.trim() : ''
    const deliveryAddress = isRecord(body.deliveryAddress)
      ? body.deliveryAddress
      : { address: typeof body.deliveryAddress === 'string' ? body.deliveryAddress.trim() : 'Kigali, Rwanda' }
    const freightType = body.freightType === 'Air' ? 'Air' : 'Sea'
    const customerName = typeof body.customerName === 'string'
      ? body.customerName.trim()
      : typeof body.fullName === 'string'
        ? body.fullName.trim()
        : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!cargoDescription) throw new BadRequestException('Cargo description is required.')
    if (!pickupAddress) throw new BadRequestException('Pickup address is required.')
    if (!customerName || !phone) throw new BadRequestException('Customer contact details (name and phone) are required.')

    const order = await this.orders.createShippingOrder({
      cargoDescription,
      weightOrSize,
      pickupAddress,
      deliveryAddress,
      freightType,
      customerName,
      phone,
      email,
    })

    this.events.emitCreated()

    await this.audit.record({
      action: 'orders.shipping_requested',
      targetResource: 'orders',
      targetId: String(order.id),
      recordNumber: String(order.id),
      newValues: {
        cargoDescription,
        weightOrSize,
        pickupAddress,
        freightType,
        customerName,
        phone,
        status: 'RECEIVED',
        paymentStatus: 'UNPAID',
      },
      metadata: { orderType: 'shipping', freightType },
    })

    return {
      success: true,
      orderId: String(order.id),
      order: serializeOrder(order),
      message: 'Shipping request received. Our logistics desk will calculate your freight quotation.',
    }
  }

  async getOrderThread(orderId: string) {
    const thread = await this.orders.findOrderWithThread(orderId)
    if (!thread) throw new NotFoundException('Order not found.')

    return {
      order: serializeOrder(thread.order),
      messages: thread.messages.map((m) => ({
        id: m.id,
        orderId: m.orderId,
        senderType: m.senderType,
        senderName: m.senderName,
        senderId: m.senderId,
        message: m.message,
        attachments: m.attachments || [],
        createdAt: m.createdAt,
      })),
      quotations: thread.quotations.map((q) => ({
        id: q.id,
        orderId: q.orderId,
        version: q.version,
        productCost: Number(q.productCost),
        sourcingFee: Number(q.sourcingFee),
        shippingCost: Number(q.shippingCost),
        totalAmount: Number(q.totalAmount),
        notes: q.notes,
        status: q.status,
        createdBy: q.createdBy,
        createdAt: q.createdAt,
      })),
    }
  }

  async addOrderMessage(orderId: string, body: any, actor?: UserIdentity) {
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    if (!message) throw new BadRequestException('Message text is required.')

    const senderType = actor ? 'staff' : (body?.senderType === 'customer' ? 'customer' : 'staff')
    const senderName = actor?.name || (typeof body?.senderName === 'string' && body.senderName.trim()) || (senderType === 'customer' ? 'Customer' : 'Staff')

    const msg = await this.orders.addOrderMessage({
      orderId,
      senderType,
      senderName,
      senderId: actor?.id || null,
      message,
      attachments: Array.isArray(body?.attachments) ? body.attachments : [],
    })

    this.events.emitCreated()

    return { success: true, message: msg }
  }

  async createOrderQuotation(orderId: string, body: any, actor?: UserIdentity) {
    if (!isRecord(body)) throw new BadRequestException('Quotation breakdown is required.')
    const productCost = Number(body.productCost || 0)
    const sourcingFee = Number(body.sourcingFee || 0)
    const shippingCost = Number(body.shippingCost || 0)
    const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined

    if (productCost < 0 || sourcingFee < 0 || shippingCost < 0) {
      throw new BadRequestException('Quotation costs cannot be negative.')
    }
    const total = productCost + sourcingFee + shippingCost
    if (total <= 0) {
      throw new BadRequestException('Total quotation amount must be greater than zero.')
    }

    const quotation = await this.orders.createOrderQuotation({
      orderId,
      productCost,
      sourcingFee,
      shippingCost,
      notes,
      createdBy: actor?.name || 'Staff',
      createdByUserId: actor?.id || null,
    })

    this.events.emitCreated()

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'quotations.created',
      targetResource: 'orders',
      targetId: orderId,
      recordNumber: `v${quotation.version}`,
      newValues: {
        version: quotation.version,
        productCost,
        sourcingFee,
        shippingCost,
        totalAmount: total,
        status: 'QUOTATION_SENT',
      },
      metadata: { orderId, version: quotation.version },
    })

    return {
      success: true,
      quotation: {
        id: quotation.id,
        orderId: quotation.orderId,
        version: quotation.version,
        productCost: Number(quotation.productCost),
        sourcingFee: Number(quotation.sourcingFee),
        shippingCost: Number(quotation.shippingCost),
        totalAmount: Number(quotation.totalAmount),
        notes: quotation.notes,
        status: quotation.status,
        createdBy: quotation.createdBy,
        createdAt: quotation.createdAt,
      },
    }
  }

  async acceptOrderQuotation(orderId: string, body: any) {
    const mtnTransactionId = typeof body?.mtnTransactionId === 'string' ? body.mtnTransactionId.trim() : ''
    if (!mtnTransactionId) {
      throw new BadRequestException('MTN transaction ID is required to accept the quotation.')
    }

    const { order, quotation } = await this.orders.acceptOrderQuotation(orderId, mtnTransactionId)

    this.events.emitCreated()

    await this.audit.record({
      action: 'quotations.accepted',
      targetResource: 'orders',
      targetId: orderId,
      recordNumber: `v${quotation.version}`,
      newValues: {
        version: quotation.version,
        totalAmount: Number(order.totalAmount),
        mtnTransactionId,
        status: 'WAITING_APPROVAL',
        paymentStatus: 'WAITING_APPROVAL',
      },
      metadata: { orderId, version: quotation.version, mtnTransactionId },
    })

    return {
      success: true,
      order: serializeOrder(order),
      quotation,
      message: 'Quotation accepted and payment submitted. Waiting for payment approval.',
    }
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function serializeAdminOrderListItem(row: OrderEntity) {
  return {
    id: String(row.id),
    customerName: row.customerName,
    phone: row.phone,
    email: row.email,
    deliveryAddress: row.deliveryAddress,
    adminNotes: row.adminNotes,
    orderType: row.orderType || 'shopping',
    mtnTransactionId: row.mtnTransactionId || null,
    paymentApprovedAt: row.paymentApprovedAt || null,
    paymentApprovedBy: row.paymentApprovedBy || null,
    paymentRejectionReason: row.paymentRejectionReason || null,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    subtotal: row.subtotal ? Number(row.subtotal) : null,
    deliveryFee: row.deliveryFee ? Number(row.deliveryFee) : null,
    total: Number(row.totalAmount),
    createdAt: row.createdAt,
    requestedDeliveryTime: row.requestedDeliveryTime,
    channel: row.channel,
    cancelReason: row.cancelReason,
    customerInstructions: row.customerInstructions,
    requestDetails: row.requestDetails || {},
    items: row.items ? row.items.map(serializeOrderItem) : [],
  }
}

function serializeOrderItem(item: OrderItemEntity) {
  return {
    productName: item.productName,
    category: item.category,
    quantity: item.quantity,
    unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    lineTotal: item.lineTotal ? Number(item.lineTotal) : null,
  }
}

function serializeOrder(order: OrderEntity) {
  return {
    id: String(order.id),
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    deliveryAddress: order.deliveryAddress,
    orderType: order.orderType || 'shopping',
    mtnTransactionId: order.mtnTransactionId || null,
    paymentApprovedAt: order.paymentApprovedAt || null,
    paymentApprovedBy: order.paymentApprovedBy || null,
    paymentRejectionReason: order.paymentRejectionReason || null,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal ? Number(order.subtotal) : null,
    deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : null,
    total: Number(order.totalAmount),
    createdAt: order.createdAt,
    requestDetails: order.requestDetails || {},
    items: order.items ? order.items.map(serializeOrderItem) : [],
  }
}
