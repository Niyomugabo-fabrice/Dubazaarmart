import { useState } from 'react'
import { products, categories } from '../data/products'

interface Props {
  setPage: (p: string) => void
}

const stats = [
  { label: 'Total Revenue', value: 'RWF 84.2M', change: '+18.4%', icon: '💰', up: true },
  { label: "Today's Revenue", value: 'RWF 2.1M', change: '+7.2%', icon: '📈', up: true },
  { label: 'Total Orders', value: '3,847', change: '+12.1%', icon: '📦', up: true },
  { label: 'Pending Orders', value: '142', change: '-4.3%', icon: '⏳', up: false },
  { label: 'Total Customers', value: '18,294', change: '+9.7%', icon: '👥', up: true },
  { label: 'Low Stock Items', value: '23', change: '+6', icon: '⚠️', up: false },
]

const recentOrders = [
  {
    id: 'DBZ-847291',
    customer: 'Claudine Uwimana',
    amount: 1_450_000,
    status: 'PAID',
    date: '2026-08-17',
    items: 1,
  },
  {
    id: 'DBZ-847286',
    customer: 'Jean-Paul Hakizimana',
    amount: 2_850_000,
    status: 'SHIPPED',
    date: '2026-08-17',
    items: 1,
  },
  {
    id: 'DBZ-847271',
    customer: 'Amina Kabanda',
    amount: 380_000,
    status: 'DELIVERED',
    date: '2026-08-16',
    items: 2,
  },
  {
    id: 'DBZ-847259',
    customer: 'Eric Nzeyimana',
    amount: 320_000,
    status: 'PROCESSING',
    date: '2026-08-16',
    items: 1,
  },
  {
    id: 'DBZ-847245',
    customer: 'Diane Ishimwe',
    amount: 680_000,
    status: 'PENDING_PAYMENT',
    date: '2026-08-15',
    items: 3,
  },
  {
    id: 'DBZ-847231',
    customer: 'Patrick Mugabo',
    amount: 1_130_000,
    status: 'CANCELLED',
    date: '2026-08-15',
    items: 2,
  },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: '#f59e0b',
  PAID: '#3b82f6',
  PROCESSING: '#8b5cf6',
  PACKED: '#6366f1',
  SHIPPED: '#06b6d4',
  OUT_FOR_DELIVERY: '#f97316',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
  RETURNED: '#6b7280',
}

type AdminSection = 'overview' | 'orders' | 'products' | 'customers' | 'inventory' | 'settings'

export default function AdminPage({ setPage }: Props) {
  const [section, setSection] = useState<AdminSection>('overview')
  const [productSearch, setProductSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState('ALL')

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  const navItems: { id: AdminSection; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'products', label: 'Products', icon: '🏷️' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'inventory', label: 'Inventory', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()),
  )

  const filteredOrders = recentOrders.filter(
    (o) =>
      (orderFilter === 'ALL' || o.status === orderFilter) &&
      (o.id.includes(orderSearch) || o.customer.toLowerCase().includes(orderSearch.toLowerCase())),
  )

  return (
    <div className="min-h-screen pt-16 flex" style={{ background: '#0A0A0B' }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 fixed top-16 bottom-0 left-0 overflow-y-auto"
        style={{ background: '#111114', borderRight: '1px solid #1A1A1E' }}
      >
        <div className="p-4">
          <div className="badge mb-4 mt-2" style={{ color: '#D4A843' }}>
            ADMIN PANEL
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={
                  section === item.id
                    ? {
                        background: 'rgba(212,168,67,0.15)',
                        color: '#D4A843',
                        border: '1px solid rgba(212,168,67,0.2)',
                      }
                    : { color: '#A0A0A8' }
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="section-divider my-4" />
          <button
            onClick={() => setPage('home')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
            style={{ color: '#555560' }}
          >
            <span>←</span> Back to Store
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 p-6 lg:p-8">
        {/* Overview */}
        {section === 'overview' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="badge mb-1" style={{ color: '#D4A843' }}>
                  DASHBOARD
                </div>
                <h1 className="text-3xl font-bold text-white">Overview</h1>
              </div>
              <div className="text-sm font-mono" style={{ color: '#555560' }}>
                Aug 17, 2026
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="p-5 rounded-2xl"
                  style={{ background: '#111114', border: '1px solid #2A2A30' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span
                      className="badge px-2 py-1 rounded-lg"
                      style={{
                        background: s.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: s.up ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {s.change}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-xs" style={{ color: '#555560' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Sales chart placeholder */}
            <div
              className="p-6 rounded-2xl mb-6"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              <h3 className="font-bold text-white mb-6">Revenue — Last 7 Days</h3>
              <div className="flex items-end gap-3 h-32">
                {[62, 45, 78, 55, 90, 83, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg"
                      style={{
                        height: `${h}%`,
                        background: i === 6 ? '#D4A843' : 'rgba(212,168,67,0.25)',
                      }}
                    />
                    <div className="text-xs" style={{ color: '#555560' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white">Recent Orders</h3>
                <button
                  onClick={() => setSection('orders')}
                  className="text-sm btn-ghost px-3 py-1.5 rounded-lg"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A2A30' }}>
                      {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                        <th
                          key={h}
                          className="text-left pb-3 pr-4 font-medium"
                          style={{ color: '#555560' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #1A1A1E' }}>
                        <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#D4A843' }}>
                          {order.id}
                        </td>
                        <td className="py-3 pr-4 text-white">{order.customer}</td>
                        <td className="py-3 pr-4 font-medium text-white">
                          {formatPrice(order.amount)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className="badge px-2 py-1 rounded-md"
                            style={{
                              background: `${STATUS_COLORS[order.status]}22`,
                              color: STATUS_COLORS[order.status],
                            }}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3" style={{ color: '#555560' }}>
                          {order.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {section === 'orders' && (
          <div>
            <div className="badge mb-1" style={{ color: '#D4A843' }}>
              MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Orders</h1>

            <div className="flex gap-3 mb-6 flex-wrap">
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order ID or customer..."
                className="flex-1 min-w-48 px-4 py-2.5 rounded-xl text-sm"
              />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm"
              >
                <option value="ALL">All Statuses</option>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2A30' }}>
              <table className="w-full text-sm">
                <thead style={{ background: '#111114' }}>
                  <tr>
                    {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Action'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-medium"
                          style={{ color: '#555560', borderBottom: '1px solid #2A2A30' }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: '1px solid #1A1A1E', background: '#0A0A0B' }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#D4A843' }}>
                        {order.id}
                      </td>
                      <td className="px-4 py-3 text-white">{order.customer}</td>
                      <td className="px-4 py-3" style={{ color: '#A0A0A8' }}>
                        {order.items}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="badge px-2 py-1 rounded-md"
                          style={{
                            background: `${STATUS_COLORS[order.status]}22`,
                            color: STATUS_COLORS[order.status],
                          }}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#555560' }}>
                        {order.date}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-xs px-3 py-1.5 rounded-lg btn-ghost">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products */}
        {section === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="badge mb-1" style={{ color: '#D4A843' }}>
                  MANAGEMENT
                </div>
                <h1 className="text-3xl font-bold text-white">Products</h1>
              </div>
              <button className="btn-gold px-5 py-2.5 rounded-xl font-semibold text-sm">
                + Add Product
              </button>
            </div>

            <div className="flex gap-3 mb-6">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: '#111114', border: '1px solid #2A2A30' }}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 product-img-wrap">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{p.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#555560' }}>
                      {p.brand} · {p.sku}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="font-bold text-sm" style={{ color: '#D4A843' }}>
                      {formatPrice(p.price)}
                    </div>
                    <div className="text-xs" style={{ color: '#555560' }}>
                      Stock: {p.quantity}
                    </div>
                  </div>
                  <div>
                    <span
                      className="badge px-2 py-1 rounded-md text-xs"
                      style={{
                        background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: p.active ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs btn-ghost">Edit</button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customers */}
        {section === 'customers' && (
          <div>
            <div className="badge mb-1" style={{ color: '#D4A843' }}>
              MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Customers</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                ['18,294', 'Total Customers'],
                ['3,847', 'Orders Placed'],
                ['RWF 84.2M', 'Total Revenue'],
                ['4.8★', 'Avg Rating'],
              ].map(([v, l]) => (
                <div
                  key={l}
                  className="p-5 rounded-2xl"
                  style={{ background: '#111114', border: '1px solid #2A2A30' }}
                >
                  <div className="text-xl font-bold text-white mb-1">{v}</div>
                  <div className="text-xs" style={{ color: '#555560' }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="p-6 rounded-2xl"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              <h3 className="font-bold text-white mb-4">Recent Customers</h3>
              <div className="space-y-3">
                {[
                  {
                    name: 'Claudine Uwimana',
                    email: 'claudine@email.com',
                    orders: 4,
                    total: 3_420_000,
                    joined: '2026-02-14',
                  },
                  {
                    name: 'Jean-Paul Hakizimana',
                    email: 'jeanpaul@email.com',
                    orders: 2,
                    total: 2_850_000,
                    joined: '2026-04-08',
                  },
                  {
                    name: 'Amina Kabanda',
                    email: 'amina@email.com',
                    orders: 7,
                    total: 1_840_000,
                    joined: '2025-11-22',
                  },
                  {
                    name: 'Eric Nzeyimana',
                    email: 'eric@email.com',
                    orders: 1,
                    total: 320_000,
                    joined: '2026-08-10',
                  },
                ].map((c) => (
                  <div
                    key={c.email}
                    className="flex items-center gap-4 py-3"
                    style={{ borderBottom: '1px solid #1A1A1E' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}
                    >
                      {c.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{c.name}</div>
                      <div className="text-xs" style={{ color: '#555560' }}>
                        {c.email}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-white">{formatPrice(c.total)}</div>
                      <div className="text-xs" style={{ color: '#555560' }}>
                        {c.orders} orders
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: '#555560' }}>
                      {c.joined}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory */}
        {section === 'inventory' && (
          <div>
            <div className="badge mb-1" style={{ color: '#D4A843' }}>
              MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Inventory</h1>
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: '#111114', border: '1px solid #2A2A30' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{p.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#555560' }}>
                      {p.sku}
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#555560' }}>
                        Stock
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color:
                            p.quantity <= 5 ? '#ef4444' : p.quantity <= 15 ? '#f59e0b' : '#22c55e',
                        }}
                      >
                        {p.quantity}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#2A2A30' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (p.quantity / 60) * 100)}%`,
                          background:
                            p.quantity <= 5 ? '#ef4444' : p.quantity <= 15 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg text-xs btn-ghost flex-shrink-0">
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {section === 'settings' && (
          <div>
            <div className="badge mb-1" style={{ color: '#D4A843' }}>
              CONFIGURATION
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
            <div className="grid gap-6">
              {[
                {
                  title: 'Store Information',
                  fields: [
                    ['Store Name', 'Dubazaarmart.com'],
                    ['Contact Email', 'hello@dubazaarmart.com'],
                    ['Phone', '+250 788 123 456'],
                    ['Address', 'KG 15 Ave, Kigali, Rwanda'],
                  ],
                },
                {
                  title: 'Payment Settings',
                  fields: [
                    ['MTN MoMo API Key', '••••••••••••••••'],
                    ['Airtel Money API Key', '••••••••••••••••'],
                    ['Webhook Secret', '••••••••••••••••'],
                  ],
                },
                {
                  title: 'Delivery Settings',
                  fields: [
                    ['Standard Delivery Fee (RWF)', '10,000'],
                    ['Express Delivery Fee (RWF)', '25,000'],
                    ['Free Delivery Threshold (RWF)', '500,000'],
                  ],
                },
              ].map((group) => (
                <div
                  key={group.title}
                  className="p-6 rounded-2xl"
                  style={{ background: '#111114', border: '1px solid #2A2A30' }}
                >
                  <h3 className="font-bold text-white mb-5">{group.title}</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {group.fields.map(([label, val]) => (
                      <div key={label}>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: '#555560' }}
                        >
                          {label}
                        </label>
                        <input
                          defaultValue={val}
                          className="w-full px-3 py-2.5 rounded-xl text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 btn-gold px-5 py-2 rounded-lg text-sm font-semibold">
                    Save Changes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
