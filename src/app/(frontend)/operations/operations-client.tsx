'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  createSupplierBundle,
  confirmShipmentReceipt,
  getCustomerOrders,
  getShipmentDetails,
  getShipmentDashboard,
  updateShipmentStatus,
  type OrderQuery,
  type ShipmentQuery,
  type SupplierBundleInput,
} from '../actions'

type OrderResult = Awaited<ReturnType<typeof getCustomerOrders>>
type ShipmentResult = Awaited<ReturnType<typeof getShipmentDashboard>>
type Section = 'overview' | 'customer-orders' | 'shipments' | 'new-supplier-order'

const statusLabels: Record<string, string> = {
  'order-placed': 'Order Placed with Supplier',
  'supplier-processing': 'Supplier Processing Order',
  'ready-for-dispatch': 'Products Ready for Dispatch',
  shipped: 'Shipped from China/Dubai',
  'in-transit': 'In Transit',
  'at-transit-hub': 'Arrived at Transit Hub',
  'customs-clearance': 'Customs Clearance',
  'departed-for-rwanda': 'Departed for Rwanda',
  'arrived-kigali': 'Arrived in Kigali',
  'received-warehouse': 'Received at Warehouse',
  completed: 'Completed',
}

const statusSteps = Object.keys(statusLabels)
const inputClass =
  'w-full rounded-xl border border-[#2a2a30] bg-[#18181c] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d4a843]'

function formatRwf(value: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-RW', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kigali',
  }).format(new Date(value))
}

function Countdown({ eta, receivedAt }: { eta: string | null; receivedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  if (receivedAt) return <span className="text-emerald-400">Received</span>
  if (!eta) return <span className="text-[#777781]">Arrival date not set</span>
  const remaining = new Date(eta).getTime() - now
  if (remaining <= 0) return <span className="text-red-400">Delayed · Expected to Arrive</span>
  const days = Math.floor(remaining / 86400000)
  const hours = Math.floor((remaining % 86400000) / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return (
    <span className={remaining < 86400000 ? 'text-amber-300' : 'text-white'}>
      {remaining < 86400000 ? 'Arriving Today · ' : ''}
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  )
}

function StatCard({
  label,
  value,
  tone = 'gold',
}: {
  label: string
  value: number
  tone?: 'gold' | 'red' | 'green'
}) {
  const colors =
    tone === 'red' ? 'text-red-400' : tone === 'green' ? 'text-emerald-400' : 'text-[#d4a843]'
  return (
    <div className="rounded-2xl border border-[#26262b] bg-[#111114] p-5">
      <div className={`text-2xl font-bold ${colors}`}>{value.toLocaleString()}</div>
      <div className="mt-1 text-xs text-[#777781]">{label}</div>
    </div>
  )
}

export default function OperationsClient({
  initialOrders,
  initialShipments,
}: {
  initialOrders: OrderResult
  initialShipments: ShipmentResult
}) {
  const [section, setSection] = useState<Section>('overview')
  const [orders, setOrders] = useState(initialOrders)
  const [shipments, setShipments] = useState(initialShipments)
  const [orderQuery, setOrderQuery] = useState<OrderQuery>({ page: 1, limit: 10 })
  const [shipmentQuery, setShipmentQuery] = useState<ShipmentQuery>({
    page: 1,
    limit: 10,
    sort: 'newest',
  })
  const [expandedOrders, setExpandedOrders] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ShipmentResult['docs'][number] | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const orderQueryRef = useRef(orderQuery)
  const shipmentQueryRef = useRef(shipmentQuery)

  const loadOrders = useCallback((next: OrderQuery, append = false) => {
    startTransition(async () => {
      const result = await getCustomerOrders(next)
      setOrders((current) =>
        append
          ? {
              ...result,
              docs: [
                ...current.docs,
                ...result.docs.filter(
                  (doc) => !current.docs.some((existing) => existing.id === doc.id),
                ),
              ],
            }
          : result,
      )
      setOrderQuery(next)
    })
  }, [])

  const loadShipments = useCallback((next: ShipmentQuery) => {
    startTransition(async () => {
      setShipments(await getShipmentDashboard(next))
      setShipmentQuery(next)
    })
  }, [])

  useEffect(() => {
    orderQueryRef.current = orderQuery
  }, [orderQuery])

  useEffect(() => {
    shipmentQueryRef.current = shipmentQuery
  }, [shipmentQuery])

  useEffect(() => {
    const events = new EventSource('/operations/events')
    let initialized = false
    events.addEventListener('operations', () => {
      if (!initialized) {
        initialized = true
        return
      }
      loadOrders(orderQueryRef.current)
      loadShipments(shipmentQueryRef.current)
    })
    return () => events.close()
  }, [loadOrders, loadShipments])

  function updateOrderFilter(key: keyof OrderQuery, value: string | number) {
    const next = { ...orderQuery, [key]: value, page: 1 }
    setExpandedOrders(false)
    loadOrders(next)
  }

  function showMoreOrders() {
    const next = { ...orderQuery, page: (orderQuery.page || 1) + 1 }
    setExpandedOrders(true)
    loadOrders(next, true)
  }

  function showLessOrders() {
    const next = { ...orderQuery, page: 1, limit: 10 }
    setExpandedOrders(false)
    loadOrders(next)
  }

  const nav = [
    { id: 'overview' as const, label: 'Overview', mark: '01' },
    { id: 'customer-orders' as const, label: 'Customer Orders', mark: '02' },
    { id: 'shipments' as const, label: 'Supplier Orders & Shipment Tracking', mark: '03' },
    { id: 'new-supplier-order' as const, label: 'Create Supplier Order', mark: '04' },
  ]

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#222228] bg-[#09090b]/95 px-4 backdrop-blur md:px-7">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a843] font-black text-black">
            D
          </span>
          <div>
            <strong className="block text-sm">DubazaarMart</strong>
            <span className="badge text-[#666670]">OPERATIONS CONTROL</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {shipments.stats.unread > 0 && (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
              {shipments.stats.unread} notifications
            </span>
          )}
          <Link href="/" className="btn-ghost rounded-lg px-3 py-2 text-xs">
            Storefront
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-[#2a2a30] px-3 py-2 text-xs text-[#aaaab2]"
          >
            CMS
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-[#222228] p-5 lg:block">
          <p className="badge mb-4 text-[#555560]">WORKSPACES</p>
          <nav className="space-y-2">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${section === item.id ? 'bg-[#d4a843]/12 text-[#e5bd60]' : 'text-[#888892] hover:bg-white/5 hover:text-white'}`}
              >
                <span className="font-mono text-[10px] text-[#555560]">{item.mark}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-[#d4a843]/20 bg-[#d4a843]/5 p-4">
            <div className="text-xs font-semibold text-[#e5bd60]">Kigali time</div>
            <div className="mt-1 text-xs text-[#777781]">
              All arrival estimates use Africa/Kigali (CAT).
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-7 md:px-8 lg:px-10">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs ${section === item.id ? 'bg-[#d4a843] text-black' : 'bg-[#18181c] text-[#aaaab2]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {message && (
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}
          {isPending && (
            <div className="fixed inset-x-0 top-16 z-40 h-0.5 animate-pulse bg-[#d4a843]" />
          )}

          {section === 'overview' && (
            <section>
              <div className="mb-8">
                <p className="badge text-[#d4a843]">LIVE OPERATIONS</p>
                <h1 className="mt-2 font-serif text-4xl md:text-5xl">
                  International logistics overview
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777781]">
                  Supplier procurement and estimated international arrivals are tracked separately
                  from customer purchases.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Supplier purchase orders" value={shipments.stats.purchaseOrders} />
                <StatCard label="Active shipments" value={shipments.stats.active} />
                <StatCard label="Currently in transit" value={shipments.stats.transit} />
                <StatCard label="Arriving within 7 days" value={shipments.stats.arrivingWeek} />
                <StatCard label="Arriving today" value={shipments.stats.arrivingToday} />
                <StatCard label="Delayed shipments" value={shipments.stats.delayed} tone="red" />
                <StatCard
                  label="Received in Kigali"
                  value={shipments.stats.received}
                  tone="green"
                />
                <StatCard label="Customer orders" value={orders.totalDocs} />
              </div>
              <div className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-[#26262b] bg-[#111114] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-semibold">Arrival outlook</h2>
                    <span className="badge text-[#555560]">ESTIMATED</span>
                  </div>
                  <div className="space-y-4">
                    {shipments.docs.slice(0, 5).map((shipment) => (
                      <button
                        key={shipment.id}
                        onClick={() => setSelectedShipment(shipment)}
                        className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#222228] bg-[#0d0d10] p-4 text-left"
                      >
                        <div>
                          <div className="font-mono text-xs text-[#d4a843]">
                            {shipment.shipmentId}
                          </div>
                          <div className="mt-1 text-sm">{shipment.supplier}</div>
                        </div>
                        <div className="text-right text-xs">
                          <Countdown
                            eta={shipment.estimatedArrival}
                            receivedAt={shipment.receivedAt}
                          />
                          <div className="mt-1 text-[#666670]">
                            {formatDate(shipment.estimatedArrival)}
                          </div>
                        </div>
                      </button>
                    ))}
                    {!shipments.docs.length && (
                      <p className="py-10 text-center text-sm text-[#666670]">
                        No supplier shipments yet.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl border border-[#26262b] bg-[#111114] p-6">
                  <h2 className="font-semibold">Shipment pulse</h2>
                  <div className="mt-8 flex h-44 items-end gap-3">
                    {[
                      ['In transit', shipments.stats.transit, '#d4a843'],
                      ['7 days', shipments.stats.arrivingWeek, '#e8c875'],
                      ['Today', shipments.stats.arrivingToday, '#f59e0b'],
                      ['Delayed', shipments.stats.delayed, '#ef4444'],
                      ['Received', shipments.stats.received, '#22c55e'],
                    ].map(([label, value, color]) => (
                      <div key={String(label)} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-lg"
                          style={{
                            height: `${Math.max(8, Math.min(100, Number(value) * 14))}%`,
                            background: String(color),
                          }}
                        />
                        <span className="text-center text-[10px] text-[#666670]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === 'customer-orders' && (
            <section>
              <p className="badge text-[#d4a843]">CUSTOMER SALES</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif text-4xl">Customer Orders</h1>
                  <p className="mt-2 text-sm text-[#777781]">
                    Newest orders appear first. New arrivals never reset your active filters or
                    page.
                  </p>
                </div>
                <span className="text-sm text-[#777781]">{orders.totalDocs} total orders</span>
              </div>
              <div className="mt-6 grid gap-3 rounded-2xl border border-[#26262b] bg-[#111114] p-4 md:grid-cols-3 xl:grid-cols-6">
                <input
                  className={`${inputClass} xl:col-span-2`}
                  placeholder="Name, phone, email, order or product"
                  value={orderQuery.search || ''}
                  onChange={(event) => updateOrderFilter('search', event.target.value)}
                />
                <select
                  className={inputClass}
                  value={orderQuery.orderStatus || ''}
                  onChange={(event) => updateOrderFilter('orderStatus', event.target.value)}
                >
                  <option value="">All order statuses</option>
                  {[
                    'pending',
                    'processing',
                    'packed',
                    'shipped',
                    'delivered',
                    'cancelled',
                    'returned',
                  ].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={orderQuery.paymentStatus || ''}
                  onChange={(event) => updateOrderFilter('paymentStatus', event.target.value)}
                >
                  <option value="">All payments</option>
                  {['pending', 'paid', 'failed', 'refunded'].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  type="date"
                  value={orderQuery.from || ''}
                  onChange={(event) => updateOrderFilter('from', event.target.value)}
                />
                <input
                  className={inputClass}
                  type="date"
                  value={orderQuery.to || ''}
                  onChange={(event) => updateOrderFilter('to', event.target.value)}
                />
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#26262b]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-[#151518] text-xs text-[#666670]">
                      <tr>
                        {[
                          'Order',
                          'Customer',
                          'Products',
                          'Items',
                          'Total',
                          'Payment',
                          'Status',
                          'Placed',
                        ].map((label) => (
                          <th key={label} className="px-4 py-3 font-medium">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.docs.map((order) => (
                        <tr
                          key={order.id}
                          className={`${order.isNew ? 'bg-[#d4a843]/5' : 'bg-[#0d0d10]'} border-t border-[#222228]`}
                        >
                          <td className="px-4 py-4 font-mono text-xs text-[#d4a843]">
                            {order.orderId}
                            {order.isNew && (
                              <span className="ml-2 rounded bg-[#d4a843] px-1.5 py-0.5 text-[9px] text-black">
                                NEW
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div>{order.customerName}</div>
                            <div className="text-xs text-[#666670]">{order.phone}</div>
                          </td>
                          <td className="max-w-56 truncate px-4 py-4 text-[#aaaab2]">
                            {order.products}
                          </td>
                          <td className="px-4 py-4">{order.items}</td>
                          <td className="px-4 py-4 font-semibold">{formatRwf(order.total)}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-[#777781]">
                            {formatDate(order.placedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!orders.docs.length && (
                  <p className="py-16 text-center text-sm text-[#666670]">
                    No orders match these filters.
                  </p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666670]">Rows</span>
                  <select
                    className="rounded-lg border border-[#2a2a30] bg-[#18181c] px-2 py-2 text-xs"
                    value={orderQuery.limit || 10}
                    onChange={(event) => updateOrderFilter('limit', Number(event.target.value))}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-xs text-[#777781]">
                    Page {orders.page} of {orders.totalPages || 1}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!orders.hasPrevPage || expandedOrders}
                    onClick={() =>
                      loadOrders({ ...orderQuery, page: Math.max(1, (orders.page || 1) - 1) })
                    }
                    className="btn-ghost rounded-lg px-3 py-2 text-xs disabled:opacity-30"
                  >
                    Previous
                  </button>
                  {expandedOrders ? (
                    <button
                      onClick={showLessOrders}
                      className="btn-gold rounded-lg px-4 py-2 text-xs"
                    >
                      Show Less
                    </button>
                  ) : (
                    orders.hasNextPage && (
                      <button
                        onClick={showMoreOrders}
                        className="btn-gold rounded-lg px-4 py-2 text-xs"
                      >
                        Show More Orders
                      </button>
                    )
                  )}
                  <button
                    disabled={!orders.hasNextPage || expandedOrders}
                    onClick={() => loadOrders({ ...orderQuery, page: (orders.page || 1) + 1 })}
                    className="btn-ghost rounded-lg px-3 py-2 text-xs disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}

          {section === 'shipments' && (
            <section>
              <p className="badge text-[#d4a843]">INTERNATIONAL LOGISTICS</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-serif text-4xl">Supplier Orders & Shipment Tracking</h1>
                  <p className="mt-2 text-sm text-[#777781]">
                    Manual tracking uses saved provider facts only—never invented live locations.
                  </p>
                </div>
                <button
                  onClick={() => setSection('new-supplier-order')}
                  className="btn-gold rounded-xl px-4 py-3 text-sm"
                >
                  New supplier order
                </button>
              </div>
              <div className="mt-6 grid gap-3 rounded-2xl border border-[#26262b] bg-[#111114] p-4 md:grid-cols-5">
                <input
                  className={`${inputClass} md:col-span-2`}
                  placeholder="Shipment, supplier, tracking number"
                  value={shipmentQuery.search || ''}
                  onChange={(event) =>
                    loadShipments({ ...shipmentQuery, search: event.target.value, page: 1 })
                  }
                />
                <select
                  className={inputClass}
                  value={shipmentQuery.origin || ''}
                  onChange={(event) =>
                    loadShipments({ ...shipmentQuery, origin: event.target.value, page: 1 })
                  }
                >
                  <option value="">All origins</option>
                  <option value="china">China</option>
                  <option value="uae">Dubai / UAE</option>
                  <option value="other">Other</option>
                </select>
                <select
                  className={inputClass}
                  value={shipmentQuery.status || ''}
                  onChange={(event) =>
                    loadShipments({ ...shipmentQuery, status: event.target.value, page: 1 })
                  }
                >
                  <option value="">All statuses</option>
                  {statusSteps.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={shipmentQuery.sort || 'newest'}
                  onChange={(event) =>
                    loadShipments({
                      ...shipmentQuery,
                      sort: event.target.value as ShipmentQuery['sort'],
                      page: 1,
                    })
                  }
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="eta">Estimated arrival</option>
                </select>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#26262b]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-left text-sm">
                    <thead className="bg-[#151518] text-xs text-[#666670]">
                      <tr>
                        {[
                          'Shipment ID',
                          'Supplier',
                          'Origin',
                          'Tracking',
                          'Method',
                          'Estimated arrival',
                          'Countdown',
                          'Status',
                          'Action',
                        ].map((label) => (
                          <th key={label} className="px-4 py-3 font-medium">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.docs.map((shipment) => (
                        <tr key={shipment.id} className="border-t border-[#222228] bg-[#0d0d10]">
                          <td className="px-4 py-4 font-mono text-xs text-[#d4a843]">
                            {shipment.shipmentId}
                          </td>
                          <td className="px-4 py-4">{shipment.supplier}</td>
                          <td className="px-4 py-4 uppercase text-[#aaaab2]">{shipment.origin}</td>
                          <td className="px-4 py-4 font-mono text-xs text-[#aaaab2]">
                            {shipment.trackingNumber || 'Not set'}
                          </td>
                          <td className="px-4 py-4 text-[#aaaab2]">
                            {shipment.shippingMethod.replace('-', ' ')}
                          </td>
                          <td className="px-4 py-4 text-xs">
                            {formatDate(shipment.estimatedArrival)}
                          </td>
                          <td className="px-4 py-4 text-xs">
                            <Countdown
                              eta={shipment.estimatedArrival}
                              receivedAt={shipment.receivedAt}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-[#d4a843]/10 px-2 py-1 text-xs text-[#e5bd60]">
                              {statusLabels[shipment.status] || shipment.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setSelectedShipment(shipment)}
                              className="btn-ghost rounded-lg px-3 py-1.5 text-xs"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!shipments.docs.length && (
                  <p className="py-16 text-center text-sm text-[#666670]">
                    No shipments match these filters.
                  </p>
                )}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-[#2a2a30] bg-[#18181c] px-2 py-2 text-xs"
                    value={shipmentQuery.limit || 10}
                    onChange={(event) =>
                      loadShipments({
                        ...shipmentQuery,
                        limit: Number(event.target.value),
                        page: 1,
                      })
                    }
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-xs text-[#777781]">
                    Page {shipments.page} of {shipments.totalPages || 1} · {shipments.totalDocs}{' '}
                    records
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!shipments.hasPrevPage}
                    onClick={() =>
                      loadShipments({ ...shipmentQuery, page: Math.max(1, shipments.page - 1) })
                    }
                    className="btn-ghost rounded-lg px-3 py-2 text-xs disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!shipments.hasNextPage}
                    onClick={() => loadShipments({ ...shipmentQuery, page: shipments.page + 1 })}
                    className="btn-ghost rounded-lg px-3 py-2 text-xs disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}

          {section === 'new-supplier-order' && (
            <SupplierOrderForm
              onDone={(result) => {
                setMessage(
                  `Created ${result.purchaseOrderId}${result.shipmentId ? ` with shipment ${result.shipmentId}` : ''}.`,
                )
                setSection('shipments')
                loadShipments({ page: 1, limit: 10, sort: 'newest' })
              }}
            />
          )}
        </main>
      </div>

      {selectedShipment && (
        <ShipmentPanel
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onUpdated={() => {
            setSelectedShipment(null)
            loadShipments(shipmentQuery)
            setMessage('Shipment status and history updated.')
          }}
        />
      )}
    </div>
  )
}

function SupplierOrderForm({
  onDone,
}: {
  onDone: (result: { purchaseOrderId?: string; shipmentId?: string }) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [items, setItems] = useState([
    { productName: '', category: '', brand: '', quantity: 1, unitPurchasePrice: 0 },
  ])
  const [form, setForm] = useState({
    supplierName: '',
    country: 'china',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    purchaseOrderDate: new Date().toISOString().slice(0, 10),
    currency: 'USD',
    paymentStatus: 'unpaid',
    notes: '',
    shippingCompany: '',
    shippingMethod: 'air-freight',
    trackingNumber: '',
    dispatchDate: '',
    estimatedArrival: '',
    shippingCost: 0,
  })
  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPurchasePrice), 0),
    [items],
  )
  function setField(key: string, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }))
  }
  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const input: SupplierBundleInput = {
        supplier: {
          name: form.supplierName,
          country: form.country as 'china',
          contactPerson: form.contactPerson,
          phone: form.phone,
          email: form.email,
          address: form.address,
        },
        order: {
          purchaseOrderDate: form.purchaseOrderDate,
          currency: form.currency as 'USD',
          paymentStatus: form.paymentStatus as 'unpaid',
          notes: form.notes,
        },
        items,
        shipment: form.shippingCompany
          ? {
              origin: form.country as 'china',
              shippingCompany: form.shippingCompany,
              shippingMethod: form.shippingMethod as 'air-freight',
              trackingNumber: form.trackingNumber,
              dispatchDate: form.dispatchDate || undefined,
              estimatedArrival: form.estimatedArrival || undefined,
              shippingCost: Number(form.shippingCost),
            }
          : undefined,
      }
      const result = await createSupplierBundle(input)
      if (result.ok)
        onDone({
          purchaseOrderId: result.purchaseOrderId || undefined,
          shipmentId: result.shipmentId,
        })
      else setError(result.error)
    })
  }
  return (
    <section>
      <p className="badge text-[#d4a843]">PROCUREMENT</p>
      <h1 className="mt-2 font-serif text-4xl">Create supplier purchase order</h1>
      <p className="mt-2 text-sm text-[#777781]">
        Products are not added to available inventory until warehouse receipt is confirmed.
      </p>
      <form onSubmit={submit} className="mt-7 space-y-6">
        <fieldset className="rounded-3xl border border-[#26262b] bg-[#111114] p-5">
          <legend className="px-2 font-semibold">Supplier information</legend>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              required
              className={inputClass}
              placeholder="Company name"
              value={form.supplierName}
              onChange={(e) => setField('supplierName', e.target.value)}
            />
            <select
              className={inputClass}
              value={form.country}
              onChange={(e) => setField('country', e.target.value)}
            >
              <option value="china">China</option>
              <option value="uae">Dubai / UAE</option>
              <option value="other">Other</option>
            </select>
            <input
              className={inputClass}
              placeholder="Contact person"
              value={form.contactPerson}
              onChange={(e) => setField('contactPerson', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Address"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
            />
          </div>
        </fieldset>
        <fieldset className="rounded-3xl border border-[#26262b] bg-[#111114] p-5">
          <legend className="px-2 font-semibold">Purchase order</legend>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              required
              className={inputClass}
              type="date"
              value={form.purchaseOrderDate}
              onChange={(e) => setField('purchaseOrderDate', e.target.value)}
            />
            <select
              className={inputClass}
              value={form.currency}
              onChange={(e) => setField('currency', e.target.value)}
            >
              {['USD', 'AED', 'CNY', 'RWF', 'OTHER'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={form.paymentStatus}
              onChange={(e) => setField('paymentStatus', e.target.value)}
            >
              {['unpaid', 'partially-paid', 'paid', 'refunded'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-[#242429] bg-[#0d0d10] p-4 md:grid-cols-5"
              >
                <input
                  required
                  className={inputClass}
                  placeholder="Product name"
                  value={item.productName}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((line, i) =>
                        i === index ? { ...line, productName: e.target.value } : line,
                      ),
                    )
                  }
                />
                <input
                  required
                  className={inputClass}
                  placeholder="Category"
                  value={item.category}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((line, i) =>
                        i === index ? { ...line, category: e.target.value } : line,
                      ),
                    )
                  }
                />
                <input
                  required
                  className={inputClass}
                  placeholder="Brand"
                  value={item.brand}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((line, i) =>
                        i === index ? { ...line, brand: e.target.value } : line,
                      ),
                    )
                  }
                />
                <input
                  required
                  className={inputClass}
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((current) =>
                      current.map((line, i) =>
                        i === index ? { ...line, quantity: Number(e.target.value) } : line,
                      ),
                    )
                  }
                />
                <div className="flex gap-2">
                  <input
                    required
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit price"
                    value={item.unitPurchasePrice}
                    onChange={(e) =>
                      setItems((current) =>
                        current.map((line, i) =>
                          i === index
                            ? { ...line, unitPurchasePrice: Number(e.target.value) }
                            : line,
                        ),
                      )
                    }
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                      className="rounded-lg border border-red-500/20 px-3 text-red-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  { productName: '', category: '', brand: '', quantity: 1, unitPurchasePrice: 0 },
                ])
              }
              className="btn-ghost rounded-lg px-3 py-2 text-xs"
            >
              Add product line
            </button>
            <strong className="text-[#d4a843]">
              Total: {form.currency} {total.toLocaleString()}
            </strong>
          </div>
        </fieldset>
        <fieldset className="rounded-3xl border border-[#26262b] bg-[#111114] p-5">
          <legend className="px-2 font-semibold">
            Initial shipment <span className="font-normal text-[#666670]">(optional)</span>
          </legend>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              className={inputClass}
              placeholder="Logistics provider"
              value={form.shippingCompany}
              onChange={(e) => setField('shippingCompany', e.target.value)}
            />
            <select
              className={inputClass}
              value={form.shippingMethod}
              onChange={(e) => setField('shippingMethod', e.target.value)}
            >
              <option value="air-freight">Air Freight</option>
              <option value="sea-freight">Sea Freight</option>
              <option value="other">Other</option>
            </select>
            <input
              className={inputClass}
              placeholder="Tracking number"
              value={form.trackingNumber}
              onChange={(e) => setField('trackingNumber', e.target.value)}
            />
            <label className="text-xs text-[#777781]">
              Dispatch date
              <input
                className={`${inputClass} mt-1`}
                type="datetime-local"
                value={form.dispatchDate}
                onChange={(e) => setField('dispatchDate', e.target.value)}
              />
            </label>
            <label className="text-xs text-[#777781]">
              Estimated Kigali arrival
              <input
                className={`${inputClass} mt-1`}
                type="datetime-local"
                value={form.estimatedArrival}
                onChange={(e) => setField('estimatedArrival', e.target.value)}
              />
            </label>
            <label className="text-xs text-[#777781]">
              Shipping cost
              <input
                className={`${inputClass} mt-1`}
                type="number"
                min="0"
                value={form.shippingCost}
                onChange={(e) => setField('shippingCost', Number(e.target.value))}
              />
            </label>
          </div>
        </fieldset>
        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button
          disabled={pending}
          className="btn-gold rounded-xl px-6 py-3 text-sm disabled:opacity-50"
        >
          {pending ? 'Creating records...' : 'Create supplier order'}
        </button>
      </form>
    </section>
  )
}

function ShipmentPanel({
  shipment,
  onClose,
  onUpdated,
}: {
  shipment: ShipmentResult['docs'][number]
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus] = useState<string>(shipment.status)
  const [eta, setEta] = useState(
    shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toISOString().slice(0, 16) : '',
  )
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [details, setDetails] = useState<Awaited<ReturnType<typeof getShipmentDetails>> | null>(
    null,
  )
  const [received, setReceived] = useState<Record<string, number>>({})
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    startTransition(async () => {
      const result = await getShipmentDetails(shipment.id)
      setDetails(result)
      setReceived(Object.fromEntries(result.items.map((item) => [item.id, 0])))
    })
  }, [shipment.id])
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-[#2a2a30] bg-[#101013] p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-[#d4a843]">{shipment.shipmentId}</p>
            <h2 className="mt-2 font-serif text-3xl">Shipment details</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[#2a2a30] px-3 py-2 text-[#aaaab2]"
          >
            Close
          </button>
        </div>
        <div className="mt-7 rounded-2xl border border-[#d4a843]/20 bg-[#d4a843]/5 p-5">
          <div className="badge text-[#d4a843]">ESTIMATED ARRIVAL IN KIGALI</div>
          <div className="mt-2 text-lg">{formatDate(shipment.estimatedArrival)}</div>
          <div className="mt-2 text-sm">
            <Countdown eta={shipment.estimatedArrival} receivedAt={shipment.receivedAt} />
          </div>
          <p className="mt-3 text-xs text-[#777781]">
            This is an estimate, not a guaranteed arrival time.
          </p>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-[#26262b] bg-[#151518] p-5 text-sm">
          {[
            ['Supplier', shipment.supplier],
            ['Origin', shipment.origin.toUpperCase()],
            ['Provider', shipment.shippingCompany],
            ['Method', shipment.shippingMethod.replace('-', ' ')],
            ['Tracking', shipment.trackingNumber || 'Not set'],
            ['Shipping cost', shipment.shippingCost.toLocaleString()],
          ].map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs text-[#666670]">{key}</dt>
              <dd className="mt-1 text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-7">
          <h3 className="font-semibold">Products in shipment</h3>
          <div className="mt-4 space-y-2">
            {details?.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#242429] bg-[#0d0d10] p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">{item.productName}</div>
                    <div className="mt-1 text-xs text-[#666670]">
                      {item.brand} · {item.category}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div>{item.quantity} units</div>
                    <div className="mt-1 text-[#777781]">{item.receivedQuantity} received</div>
                  </div>
                </div>
                {item.receivedQuantity < item.quantity && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-[#777781]">Receive now</label>
                    <input
                      className="w-24 rounded-lg px-2 py-1 text-sm"
                      type="number"
                      min="0"
                      max={item.quantity - item.receivedQuantity}
                      value={received[item.id] || 0}
                      onChange={(e) =>
                        setReceived((current) => ({
                          ...current,
                          [item.id]: Number(e.target.value),
                        }))
                      }
                    />
                    {!item.productId && (
                      <span className="text-[10px] text-amber-300">
                        Link inventory product in CMS first
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!details && <p className="text-sm text-[#666670]">Loading shipment items…</p>}
            {!!details?.items.length && (
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await confirmShipmentReceipt({
                      shipmentId: shipment.id,
                      quantities: Object.entries(received).map(([shipmentItemId, quantity]) => ({
                        shipmentItemId,
                        quantity,
                      })),
                      note,
                    })
                    if (result.ok) onUpdated()
                    else setError(result.error)
                  })
                }
                className="btn-ghost mt-2 w-full rounded-xl py-3 text-sm disabled:opacity-50"
              >
                Confirm received quantities
              </button>
            )}
          </div>
        </div>
        <div className="mt-7">
          <h3 className="font-semibold">Update tracking</h3>
          <div className="mt-4 space-y-4">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusSteps.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
            <label className="block text-xs text-[#777781]">
              Estimated arrival in Kigali
              <input
                className={`${inputClass} mt-1`}
                type="datetime-local"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
              />
            </label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="Tracking note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await updateShipmentStatus({
                    shipmentId: shipment.id,
                    status,
                    note,
                    estimatedArrival: eta || undefined,
                  })
                  if (result.ok) onUpdated()
                  else setError(result.error)
                })
              }
              className="btn-gold w-full rounded-xl py-3 text-sm disabled:opacity-50"
            >
              {pending ? 'Saving...' : 'Save status update'}
            </button>
          </div>
        </div>
        <div className="mt-8 border-t border-[#26262b] pt-6">
          <h3 className="font-semibold">Shipment history</h3>
          <div className="mt-4 space-y-4">
            {details?.history.map((entry) => (
              <div key={entry.id} className="relative border-l border-[#d4a843]/30 pl-4">
                <div className="text-sm">{statusLabels[entry.newStatus] || entry.newStatus}</div>
                <div className="mt-1 text-xs text-[#666670]">
                  {formatDate(entry.changedAt)} · {entry.changedBy}
                </div>
                {entry.note && <p className="mt-1 text-xs text-[#888892]">{entry.note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-[#777781]">
            {details?.documents.length || 0} uploaded documents. Upload invoices and shipping files
            in the secure CMS record.
          </p>
          <Link href="/admin" className="btn-ghost mt-4 inline-block rounded-lg px-4 py-2 text-xs">
            Open full admin record
          </Link>
        </div>
      </div>
    </div>
  )
}
