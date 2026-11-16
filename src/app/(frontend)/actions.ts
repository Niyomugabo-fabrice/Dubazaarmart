'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import {
  commitTransaction,
  getPayload,
  initTransaction,
  killTransaction,
  type PayloadRequest,
  type Where,
} from 'payload'

const PAGE_SIZES = [10, 25, 50, 100]
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown, max = 250) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function positiveNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

async function payloadClient() {
  return getPayload({ config })
}

async function requireAdmin() {
  const payload = await payloadClient()
  const auth = await payload.auth({ headers: await headers() })
  if (!auth.user || auth.user.collection !== 'admins') {
    throw new Error('Administrator authentication required')
  }
  return { payload, user: auth.user }
}

export type CheckoutInput = {
  customerName: string
  phone: string
  email: string
  deliveryAddress: {
    province: string
    district: string
    sector: string
    cell: string
    street?: string
    instructions?: string
  }
  items: Array<{
    productName: string
    category: string
    sku: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: 'mtn' | 'airtel'
}

export async function placeCustomerOrder(input: CheckoutInput) {
  const customerName = text(input.customerName, 120)
  const phone = text(input.phone, 40)
  const email = text(input.email, 160).toLowerCase()
  const items = Array.isArray(input.items)
    ? input.items.slice(0, 50).map((item) => ({
        productName: text(item.productName, 180),
        category: text(item.category, 80),
        sku: text(item.sku, 80),
        quantity: Math.max(1, Math.floor(positiveNumber(item.quantity, 1))),
        unitPrice: positiveNumber(item.unitPrice),
      }))
    : []

  if (!customerName || !phone || !emailPattern.test(email) || items.length === 0) {
    return { ok: false as const, error: 'Please provide valid customer and order details.' }
  }
  if (items.some((item) => !item.productName || !item.category || !item.sku)) {
    return { ok: false as const, error: 'One or more cart items are invalid.' }
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const deliveryFee = positiveNumber(input.deliveryFee)
  const payload = await payloadClient()
  const order = await payload.create({
    collection: 'customer-orders',
    overrideAccess: false,
    data: {
      customerName,
      phone,
      email,
      customerKey: email,
      deliveryAddress: {
        province: text(input.deliveryAddress?.province, 80),
        district: text(input.deliveryAddress?.district, 80),
        sector: text(input.deliveryAddress?.sector, 80),
        cell: text(input.deliveryAddress?.cell, 80),
        street: text(input.deliveryAddress?.street, 160),
        instructions: text(input.deliveryAddress?.instructions, 500),
      },
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      paymentMethod: input.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
    },
  })
  return { ok: true as const, orderId: order.orderId }
}

export type OrderQuery = {
  page?: number
  limit?: number
  search?: string
  orderStatus?: string
  paymentStatus?: string
  category?: string
  customer?: string
  from?: string
  to?: string
}

export async function getCustomerOrders(query: OrderQuery = {}) {
  const { payload, user } = await requireAdmin()
  const page = Math.max(1, Math.floor(query.page || 1))
  const limit = PAGE_SIZES.includes(Number(query.limit)) ? Number(query.limit) : 10
  const and: Where[] = []
  const search = text(query.search, 120)
  if (search) {
    and.push({
      or: [
        { orderId: { contains: search } },
        { customerName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { 'items.productName': { contains: search } },
      ],
    })
  }
  if (query.orderStatus) and.push({ orderStatus: { equals: text(query.orderStatus, 40) } })
  if (query.paymentStatus) and.push({ paymentStatus: { equals: text(query.paymentStatus, 40) } })
  if (query.category) and.push({ 'items.category': { equals: text(query.category, 80) } })
  if (query.customer) and.push({ customerKey: { equals: text(query.customer, 160).toLowerCase() } })
  if (query.from) and.push({ placedAt: { greater_than_equal: query.from } })
  if (query.to) and.push({ placedAt: { less_than_equal: query.to } })

  const result = await payload.find({
    collection: 'customer-orders',
    page,
    limit,
    sort: '-placedAt',
    depth: 0,
    where: and.length ? { and } : undefined,
    overrideAccess: false,
    user,
  })

  return {
    docs: result.docs.map((order) => ({
      id: String(order.id),
      orderId: order.orderId || String(order.id),
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      items: order.items?.length || 0,
      products: order.items?.map((item) => item.productName).join(', ') || '',
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      placedAt: order.placedAt,
      isNew: order.isNew,
    })),
    page: result.page || page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  }
}

export type ShipmentQuery = {
  page?: number
  limit?: number
  search?: string
  origin?: string
  status?: string
  eta?: string
  sort?: 'newest' | 'oldest' | 'eta'
}

function relationName(value: unknown) {
  if (value && typeof value === 'object' && 'name' in value) return String(value.name)
  return 'Supplier'
}

export async function getShipmentDashboard(query: ShipmentQuery = {}) {
  const { payload, user } = await requireAdmin()
  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  const page = Math.max(1, Math.floor(query.page || 1))
  const limit = PAGE_SIZES.includes(Number(query.limit)) ? Number(query.limit) : 10
  const and: Where[] = []
  const search = text(query.search, 120)
  if (search) {
    and.push({
      or: [
        { shipmentId: { contains: search } },
        { trackingNumber: { contains: search } },
        { 'supplier.name': { contains: search } },
      ],
    })
  }
  if (query.origin) and.push({ origin: { equals: text(query.origin, 30) } })
  if (query.status) and.push({ status: { equals: text(query.status, 50) } })
  if (query.eta) {
    const start = new Date(`${query.eta}T00:00:00+02:00`)
    const end = new Date(`${query.eta}T23:59:59+02:00`)
    and.push({
      estimatedArrival: {
        greater_than_equal: start.toISOString(),
        less_than_equal: end.toISOString(),
      },
    })
  }

  const [
    result,
    totalPOs,
    active,
    transit,
    arrivingWeek,
    arrivingToday,
    delayed,
    received,
    unread,
  ] = await Promise.all([
    payload.find({
      collection: 'shipments',
      page,
      limit,
      sort:
        query.sort === 'oldest'
          ? 'createdAt'
          : query.sort === 'eta'
            ? 'estimatedArrival'
            : '-createdAt',
      depth: 2,
      where: and.length ? { and } : undefined,
      overrideAccess: false,
      user,
    }),
    payload.count({ collection: 'supplier-purchase-orders', overrideAccess: false, user }),
    payload.count({
      collection: 'shipments',
      where: { status: { not_in: ['completed', 'received-warehouse'] } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'shipments',
      where: { status: { in: ['shipped', 'in-transit', 'at-transit-hub', 'departed-for-rwanda'] } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'shipments',
      where: {
        and: [
          { estimatedArrival: { greater_than_equal: now.toISOString() } },
          { estimatedArrival: { less_than_equal: weekEnd.toISOString() } },
        ],
      },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'shipments',
      where: {
        and: [
          { estimatedArrival: { greater_than_equal: now.toISOString() } },
          { estimatedArrival: { less_than_equal: todayEnd.toISOString() } },
        ],
      },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'shipments',
      where: {
        and: [
          { estimatedArrival: { less_than: now.toISOString() } },
          { status: { not_in: ['arrived-kigali', 'received-warehouse', 'completed'] } },
        ],
      },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'shipments',
      where: { status: { in: ['arrived-kigali', 'received-warehouse', 'completed'] } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'shipment-notifications',
      where: { read: { equals: false } },
      overrideAccess: false,
      user,
    }),
  ])

  let newAlerts = 0
  await Promise.all(
    result.docs.map(async (shipment) => {
      if (
        !shipment.estimatedArrival ||
        ['arrived-kigali', 'received-warehouse', 'completed'].includes(shipment.status)
      ) {
        return
      }
      const remaining = new Date(shipment.estimatedArrival).getTime() - now.getTime()
      const alert =
        remaining <= 0
          ? {
              type: 'delayed' as const,
              key: 'delayed',
              title: 'Shipment delayed',
              message: `${shipment.shipmentId} has passed its saved estimated arrival time.`,
            }
          : remaining <= 86400000
            ? {
                type: 'arriving-24-hours' as const,
                key: 'arriving-24-hours',
                title: 'Shipment arriving within 24 hours',
                message: `${shipment.shipmentId} is estimated to arrive in Kigali within 24 hours.`,
              }
            : remaining <= 7 * 86400000
              ? {
                  type: 'arriving-7-days' as const,
                  key: 'arriving-7-days',
                  title: 'Shipment arriving within 7 days',
                  message: `${shipment.shipmentId} is estimated to arrive in Kigali within 7 days.`,
                }
              : null
      if (!alert) return
      const dedupeKey = `${shipment.id}:${alert.key}:${shipment.estimatedArrival}`
      const exists = await payload.count({
        collection: 'shipment-notifications',
        where: { dedupeKey: { equals: dedupeKey } },
        overrideAccess: false,
        user,
      })
      if (exists.totalDocs) return
      await payload.create({
        collection: 'shipment-notifications',
        data: {
          shipment: shipment.id,
          purchaseOrder:
            typeof shipment.purchaseOrder === 'object'
              ? shipment.purchaseOrder.id
              : shipment.purchaseOrder,
          type: alert.type,
          dedupeKey,
          title: alert.title,
          message: alert.message,
        },
        overrideAccess: false,
        user,
      })
      newAlerts += 1
    }),
  )

  return {
    docs: result.docs.map((shipment) => ({
      id: String(shipment.id),
      shipmentId: shipment.shipmentId || String(shipment.id),
      supplier: relationName(shipment.supplier),
      origin: shipment.origin,
      shippingMethod: shipment.shippingMethod,
      trackingNumber: shipment.trackingNumber || '',
      estimatedArrival: shipment.estimatedArrival || null,
      status: shipment.status,
      shippingCompany: shipment.shippingCompany,
      shippingCost: shipment.shippingCost,
      receivedAt: shipment.receivedAt || null,
    })),
    stats: {
      purchaseOrders: totalPOs.totalDocs,
      active: active.totalDocs,
      transit: transit.totalDocs,
      arrivingWeek: arrivingWeek.totalDocs,
      arrivingToday: arrivingToday.totalDocs,
      delayed: delayed.totalDocs,
      received: received.totalDocs,
      unread: unread.totalDocs + newAlerts,
    },
    page: result.page || page,
    totalPages: result.totalPages,
    totalDocs: result.totalDocs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  }
}

export async function getShipmentDetails(shipmentId: string) {
  const { payload, user } = await requireAdmin()
  const shipment = await payload.findByID({
    collection: 'shipments',
    id: shipmentId,
    depth: 2,
    overrideAccess: false,
    user,
  })
  const [items, history, documents] = await Promise.all([
    payload.find({
      collection: 'shipment-items',
      where: { shipment: { equals: shipment.id } },
      limit: 100,
      depth: 2,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'shipment-status-history',
      where: { shipment: { equals: shipment.id } },
      limit: 100,
      sort: 'changedAt',
      depth: 1,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'shipment-documents',
      where: { shipment: { equals: shipment.id } },
      limit: 100,
      depth: 1,
      overrideAccess: false,
      user,
    }),
  ])
  return {
    items: items.docs.map((item) => ({
      id: String(item.id),
      productId:
        item.product && typeof item.product === 'object'
          ? String(item.product.id)
          : item.product
            ? String(item.product)
            : null,
      productName: item.productName,
      category: item.category,
      brand: item.brand,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity,
      unitPurchasePrice: item.unitPurchasePrice,
    })),
    history: history.docs.map((entry) => ({
      id: String(entry.id),
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      changedAt: entry.changedAt,
      note: entry.note || '',
      changedBy:
        entry.changedBy && typeof entry.changedBy === 'object' && 'email' in entry.changedBy
          ? String(entry.changedBy.email)
          : 'Administrator',
    })),
    documents: documents.docs.map((document) => ({
      id: String(document.id),
      title: document.title,
      documentType: document.documentType,
    })),
  }
}

export type SupplierBundleInput = {
  supplier: {
    name: string
    country: 'china' | 'uae' | 'other'
    contactPerson?: string
    phone?: string
    email?: string
    address?: string
  }
  order: {
    purchaseOrderDate: string
    currency: 'USD' | 'AED' | 'CNY' | 'RWF' | 'OTHER'
    paymentStatus: 'unpaid' | 'partially-paid' | 'paid' | 'refunded'
    notes?: string
  }
  items: Array<{
    productName: string
    category: string
    brand: string
    quantity: number
    unitPurchasePrice: number
  }>
  shipment?: {
    origin: 'china' | 'uae' | 'other'
    shippingCompany: string
    shippingMethod: 'air-freight' | 'sea-freight' | 'other'
    trackingNumber?: string
    dispatchDate?: string
    estimatedArrival?: string
    shippingCost: number
    notes?: string
  }
}

export async function createSupplierBundle(input: SupplierBundleInput) {
  const { payload, user } = await requireAdmin()
  const supplierName = text(input.supplier?.name, 160)
  const items = Array.isArray(input.items)
    ? input.items.slice(0, 100).map((item) => ({
        productName: text(item.productName, 180),
        category: text(item.category, 80),
        brand: text(item.brand, 80),
        quantity: Math.max(1, Math.floor(positiveNumber(item.quantity, 1))),
        unitPurchasePrice: positiveNumber(item.unitPurchasePrice),
      }))
    : []
  if (
    !supplierName ||
    !input.order?.purchaseOrderDate ||
    items.length === 0 ||
    items.some((item) => !item.productName || !item.category || !item.brand)
  ) {
    return {
      ok: false as const,
      error: 'Supplier, order date, and valid product lines are required.',
    }
  }

  const req = { payload, user } as Partial<PayloadRequest> & { payload: typeof payload }
  const ownsTransaction = await initTransaction(req)
  try {
    const supplier = await payload.create({
      collection: 'suppliers',
      data: {
        name: supplierName,
        country: input.supplier.country,
        contactPerson: text(input.supplier.contactPerson, 120),
        phone: text(input.supplier.phone, 40),
        email: text(input.supplier.email, 160) || undefined,
        address: text(input.supplier.address, 500),
      },
      overrideAccess: false,
      user,
      req,
    })
    const totalPurchaseAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPurchasePrice,
      0,
    )
    const order = await payload.create({
      collection: 'supplier-purchase-orders',
      data: {
        supplier: supplier.id,
        purchaseOrderDate: input.order.purchaseOrderDate,
        currency: input.order.currency,
        paymentStatus: input.order.paymentStatus,
        totalPurchaseAmount,
        notes: text(input.order.notes, 1000),
      },
      overrideAccess: false,
      user,
      req,
    })
    const orderItems: Array<{
      id: string
      productId: string | null
    }> = []
    for (const item of items) {
      const productMatch = await payload.find({
        collection: 'products',
        where: { name: { equals: item.productName } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
        user,
        req,
      })
      const productId = productMatch.docs[0]?.id ? String(productMatch.docs[0].id) : null
      const orderItem = await payload.create({
        collection: 'supplier-purchase-order-items',
        data: {
          purchaseOrder: order.id,
          product: productId || undefined,
          ...item,
          totalPurchasePrice: item.quantity * item.unitPurchasePrice,
        },
        overrideAccess: false,
        user,
        req,
      })
      orderItems.push({ id: String(orderItem.id), productId })
    }

    let shipmentId: string | undefined
    if (input.shipment?.shippingCompany) {
      const shipment = await payload.create({
        collection: 'shipments',
        data: {
          purchaseOrder: order.id,
          supplier: supplier.id,
          origin: input.shipment.origin,
          shippingCompany: text(input.shipment.shippingCompany, 160),
          shippingMethod: input.shipment.shippingMethod,
          trackingNumber: text(input.shipment.trackingNumber, 120),
          dispatchDate: input.shipment.dispatchDate || undefined,
          estimatedArrival: input.shipment.estimatedArrival || undefined,
          status: input.shipment.dispatchDate ? 'shipped' : 'order-placed',
          shippingCost: positiveNumber(input.shipment.shippingCost),
          notes: text(input.shipment.notes, 1000),
        },
        overrideAccess: false,
        user,
        req,
      })
      shipmentId = shipment.shipmentId || String(shipment.id)
      for (let index = 0; index < orderItems.length; index++) {
        const item = items[index]
        await payload.create({
          collection: 'shipment-items',
          data: {
            shipment: shipment.id,
            purchaseOrderItem: orderItems[index].id,
            product: orderItems[index].productId || undefined,
            productName: item.productName,
            category: item.category,
            brand: item.brand,
            quantity: item.quantity,
            receivedQuantity: 0,
            unitPurchasePrice: item.unitPurchasePrice,
          },
          overrideAccess: false,
          user,
          req,
        })
      }
      await payload.create({
        collection: 'shipment-status-history',
        data: {
          shipment: shipment.id,
          previousStatus: 'none',
          newStatus: input.shipment.dispatchDate ? 'shipped' : 'order-placed',
          changedAt: new Date().toISOString(),
          changedBy: user.id,
          note: 'Shipment created',
        },
        overrideAccess: false,
        user,
        req,
      })
      await payload.create({
        collection: 'shipment-notifications',
        data: {
          shipment: shipment.id,
          purchaseOrder: order.id,
          type: input.shipment.dispatchDate ? 'dispatched' : 'supplier-order-created',
          dedupeKey: `${shipment.id}:created`,
          title: input.shipment.dispatchDate ? 'Shipment dispatched' : 'Shipment created',
          message: `${shipment.shipmentId} for ${supplier.name} is now being tracked.`,
        },
        overrideAccess: false,
        user,
        req,
      })
    }
    if (ownsTransaction) await commitTransaction(req)
    return { ok: true as const, purchaseOrderId: order.purchaseOrderId, shipmentId }
  } catch (error) {
    if (ownsTransaction) await killTransaction(req)
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Unable to create supplier order.',
    }
  }
}

export async function updateShipmentStatus(input: {
  shipmentId: string
  status: string
  note?: string
  estimatedArrival?: string
}) {
  const { payload, user } = await requireAdmin()
  const existing = await payload.findByID({
    collection: 'shipments',
    id: input.shipmentId,
    overrideAccess: false,
    user,
  })
  const status = text(input.status, 60)
  const allowed = [
    'order-placed',
    'supplier-processing',
    'ready-for-dispatch',
    'shipped',
    'in-transit',
    'at-transit-hub',
    'customs-clearance',
    'departed-for-rwanda',
    'arrived-kigali',
    'received-warehouse',
    'completed',
  ]
  if (!allowed.includes(status)) return { ok: false as const, error: 'Invalid shipment status.' }

  const req = { payload, user } as Partial<PayloadRequest> & { payload: typeof payload }
  const ownsTransaction = await initTransaction(req)
  try {
    await payload.update({
      collection: 'shipments',
      id: existing.id,
      data: {
        status: status as typeof existing.status,
        estimatedArrival: input.estimatedArrival || existing.estimatedArrival,
        actualArrival:
          status === 'arrived-kigali' && !existing.actualArrival
            ? new Date().toISOString()
            : existing.actualArrival,
        receivedAt:
          status === 'received-warehouse' || status === 'completed'
            ? existing.receivedAt || new Date().toISOString()
            : existing.receivedAt,
      },
      overrideAccess: false,
      user,
      req,
    })
    await payload.create({
      collection: 'shipment-status-history',
      data: {
        shipment: existing.id,
        previousStatus: existing.status,
        newStatus: status,
        changedAt: new Date().toISOString(),
        changedBy: user.id,
        note: text(input.note, 1000),
      },
      overrideAccess: false,
      user,
      req,
    })
    const type =
      status === 'arrived-kigali'
        ? 'arrived-kigali'
        : status === 'received-warehouse'
          ? 'received-warehouse'
          : status === 'shipped'
            ? 'dispatched'
            : 'status-changed'
    await payload.create({
      collection: 'shipment-notifications',
      data: {
        shipment: existing.id,
        purchaseOrder:
          typeof existing.purchaseOrder === 'object'
            ? existing.purchaseOrder.id
            : existing.purchaseOrder,
        type,
        dedupeKey: `${existing.id}:${status}:${Date.now()}`,
        title: 'Shipment status updated',
        message: `${existing.shipmentId} changed from ${existing.status} to ${status}.`,
      },
      overrideAccess: false,
      user,
      req,
    })
    if (ownsTransaction) await commitTransaction(req)
    return { ok: true as const }
  } catch (error) {
    if (ownsTransaction) await killTransaction(req)
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Unable to update shipment.',
    }
  }
}

export async function confirmShipmentReceipt(input: {
  shipmentId: string
  quantities: Array<{ shipmentItemId: string; quantity: number }>
  note?: string
}) {
  const { payload, user } = await requireAdmin()
  const shipment = await payload.findByID({
    collection: 'shipments',
    id: input.shipmentId,
    overrideAccess: false,
    user,
  })
  const shipmentItems = await payload.find({
    collection: 'shipment-items',
    where: { shipment: { equals: shipment.id } },
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user,
  })
  const requested = new Map(
    input.quantities.map((item) => [
      String(item.shipmentItemId),
      Math.max(0, Math.floor(positiveNumber(item.quantity))),
    ]),
  )
  const actionable = shipmentItems.docs
    .map((item) => ({
      item,
      quantity: requested.get(String(item.id)) || 0,
      productId: item.product
        ? typeof item.product === 'object'
          ? item.product.id
          : item.product
        : null,
    }))
    .filter(({ quantity }) => quantity > 0)

  if (!actionable.length) {
    return { ok: false as const, error: 'Enter at least one received quantity.' }
  }
  for (const { item, quantity, productId } of actionable) {
    if (!productId) {
      return {
        ok: false as const,
        error: `${item.productName} is not linked to an inventory product. Link it in the CMS before receipt.`,
      }
    }
    if (item.receivedQuantity + quantity > item.quantity) {
      return {
        ok: false as const,
        error: `Received quantity for ${item.productName} exceeds the shipped quantity.`,
      }
    }
  }

  const req = { payload, user } as Partial<PayloadRequest> & {
    payload: typeof payload
  }
  const ownsTransaction = await initTransaction(req)
  const discrepancies: string[] = []
  try {
    for (const { item, quantity, productId } of actionable) {
      const receiptKey = `${shipment.id}:${item.id}:${item.receivedQuantity + quantity}`
      const duplicate = await payload.count({
        collection: 'inventory-movements',
        where: { receiptKey: { equals: receiptKey } },
        overrideAccess: false,
        user,
        req,
      })
      if (duplicate.totalDocs) continue
      const product = await payload.findByID({
        collection: 'products',
        id: productId!,
        depth: 0,
        overrideAccess: false,
        user,
        req,
      })
      const previousQuantity = product.inventoryQuantity
      const newQuantity = previousQuantity + quantity
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { inventoryQuantity: newQuantity },
        overrideAccess: false,
        user,
        req,
      })
      await payload.update({
        collection: 'shipment-items',
        id: item.id,
        data: { receivedQuantity: item.receivedQuantity + quantity },
        overrideAccess: false,
        user,
        req,
      })
      await payload.create({
        collection: 'inventory-movements',
        data: {
          receiptKey,
          product: product.id,
          shipment: shipment.id,
          shipmentItem: item.id,
          quantity,
          previousQuantity,
          newQuantity,
          receivedBy: user.id,
          note: text(input.note, 1000),
        },
        overrideAccess: false,
        user,
        req,
      })
      if (item.receivedQuantity + quantity !== item.quantity) {
        discrepancies.push(
          `${item.productName}: ${item.receivedQuantity + quantity}/${item.quantity} received`,
        )
      }
    }
    const refreshed = await payload.find({
      collection: 'shipment-items',
      where: { shipment: { equals: shipment.id } },
      limit: 100,
      depth: 0,
      overrideAccess: false,
      user,
      req,
    })
    const fullyReceived = refreshed.docs.every((item) => item.receivedQuantity >= item.quantity)
    await payload.update({
      collection: 'shipments',
      id: shipment.id,
      data: {
        status: fullyReceived ? 'received-warehouse' : shipment.status,
        receivedAt: fullyReceived
          ? shipment.receivedAt || new Date().toISOString()
          : shipment.receivedAt,
      },
      overrideAccess: false,
      user,
      req,
    })
    if (ownsTransaction) await commitTransaction(req)
    return { ok: true as const, discrepancies, fullyReceived }
  } catch (error) {
    if (ownsTransaction) await killTransaction(req)
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Unable to confirm warehouse receipt.',
    }
  }
}
