import { useState } from 'react'
import { products } from '../data/products'

interface Props {
  setPage: (p: string) => void
}

const mockOrders = [
  { id: 'DBZ-847291', date: '2026-08-17', status: 'PAID', total: 1_450_000, items: ['Samsung Galaxy S24 Ultra'] },
  { id: 'DBZ-847271', date: '2026-08-14', status: 'DELIVERED', total: 380_000, items: ['Sony WH-1000XM5'] },
  { id: 'DBZ-831045', date: '2026-07-28', status: 'DELIVERED', total: 320_000, items: ['Apple AirPods Pro'] },
]

const STATUS_COLORS: Record<string, string> = {
  PAID: '#FFB800',
  PROCESSING: '#FFB800',
  SHIPPED: '#FFB800',
  DELIVERED: '#17D719',
  CANCELLED: '#FF6A00',
}

type Tab = 'dashboard' | 'orders' | 'profile' | 'wishlist'

export default function AccountPage({ setPage }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [isLoggedIn] = useState(true)

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-sm w-full p-8 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
          <h1 className="text-2xl font-bold text-[#111111] mb-6 text-center">Sign In</h1>
          <div className="space-y-4">
            <input type="email" placeholder="Email address" className="w-full px-4 py-3 rounded-xl text-sm" />
            <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl text-sm" />
            <button className="w-full py-3 rounded-xl font-bold btn-gold">Sign In</button>
            <button className="w-full py-3 rounded-xl font-medium btn-ghost text-sm">Create Account</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="badge mb-1 pt-6" style={{ color: '#FF6A00' }}>ACCOUNT</div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.3)' }}>
            CU
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111111]">Claudine Uwimana</h1>
            <p className="text-sm" style={{ color: '#0B5B24' }}>claudine@email.com · Member since Feb 2026</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: '#FFF7E8' }}>
          {(['dashboard', 'orders', 'profile', 'wishlist'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={tab === t ? { background: '#FF6A00', color: '#000' } : { color: '#111111' }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                ['3', 'Total Orders'],
                ['2', 'Completed'],
                ['1', 'Pending'],
                ['RWF 2.15M', 'Total Spent'],
              ].map(([val, label]) => (
                <div key={label} className="p-5 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FF6A00' }}>{val}</div>
                  <div className="text-xs" style={{ color: '#0B5B24' }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
              <h3 className="font-bold text-[#111111] mb-5">Recent Orders</h3>
              <div className="space-y-3">
                {mockOrders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #F1FFF0' }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs mb-1" style={{ color: '#FF6A00' }}>{order.id}</div>
                      <div className="text-sm text-[#111111] truncate">{order.items.join(', ')}</div>
                      <div className="text-xs" style={{ color: '#0B5B24' }}>{order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-[#111111] mb-1">{formatPrice(order.total)}</div>
                      <span className="badge px-2 py-1 rounded-md" style={{ background: `${STATUS_COLORS[order.status] || '#0B5B24'}22`, color: STATUS_COLORS[order.status] || '#0B5B24' }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {mockOrders.map(order => (
              <div key={order.id} className="p-5 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-sm" style={{ color: '#FF6A00' }}>{order.id}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#0B5B24' }}>{order.date}</div>
                  </div>
                  <span className="badge px-2 py-1 rounded-md" style={{ background: `${STATUS_COLORS[order.status] || '#0B5B24'}22`, color: STATUS_COLORS[order.status] || '#0B5B24' }}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-[#111111] mb-3">{order.items.join(', ')}</div>
                <div className="flex items-center justify-between">
                  <div className="font-bold" style={{ color: '#FF6A00' }}>{formatPrice(order.total)}</div>
                  <button className="text-sm btn-ghost px-3 py-1.5 rounded-lg">Track Order</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        {tab === 'profile' && (
          <div className="max-w-lg">
            <div className="p-6 rounded-2xl space-y-4" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
              <h3 className="font-bold text-[#111111]">Personal Information</h3>
              {[['Full Name', 'Claudine Uwimana'], ['Email', 'claudine@email.com'], ['Phone', '+250 788 234 567']].map(([label, val]) => (
                <div key={label}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#0B5B24' }}>{label}</label>
                  <input defaultValue={val} className="w-full px-4 py-3 rounded-xl text-sm" />
                </div>
              ))}
              <button className="btn-gold px-6 py-2.5 rounded-xl font-semibold text-sm">Save Changes</button>
            </div>
          </div>
        )}

        {/* Wishlist */}
        {tab === 'wishlist' && (
          <div>
            {products.slice(0, 3).length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.slice(0, 3).map(p => (
                  <div key={p.id} className="p-4 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 product-img-wrap">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-sm font-semibold text-[#111111] mb-1 line-clamp-2">{p.name}</div>
                    <div className="font-bold text-sm mb-3" style={{ color: '#FF6A00' }}>RWF {p.price.toLocaleString()}</div>
                    <button onClick={() => setPage('shop')} className="w-full py-2 rounded-lg text-sm btn-gold font-semibold">View Product</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16" style={{ color: '#0B5B24' }}>
                <div className="text-5xl mb-4">♡</div>
                <div className="text-lg font-medium text-[#111111] mb-2">Wishlist is empty</div>
                <button onClick={() => setPage('shop')} className="btn-gold px-6 py-2.5 rounded-xl font-semibold mt-4">Browse Products</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
