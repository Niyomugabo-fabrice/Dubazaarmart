"use client"

import { useState } from 'react'
import ProductCard from '../components/ProductCard'
import { apiFetch, apiUrl } from '../services/api-client'
import { useAppNavigation } from '../lib/navigation'
import { useCart } from '../store/cartStore'
import { useProducts } from '../store/productsStore'

interface Props {
  showSignup?: boolean
  initialTab?: Tab
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

export default function AccountPage({ showSignup = false, initialTab = 'dashboard' }: Props) {
  const { navigate } = useAppNavigation()
  const { products: catalogProducts } = useProducts()
  const { wishlist } = useCart()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [isLoggedIn] = useState(!showSignup)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signupError, setSignupError] = useState<string | null>(null)
  const [signupPending, setSignupPending] = useState(false)
  const [registeredCustomer, setRegisteredCustomer] = useState<{ name: string; email: string } | null>(null)
  const wishlistProducts = catalogProducts.filter(product => wishlist.includes(product.id))

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSignupError(null)
    if (password !== confirmPassword) {
      setSignupError('Passwords do not match.')
      return
    }

    setSignupPending(true)
    try {
      const response = await apiFetch(apiUrl('/customers/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const result = await response.json().catch(() => ({})) as {
        error?: string
        customer?: { name: string; email: string }
      }
      if (!response.ok || !result.customer) {
        throw new Error(result.error || 'We could not create your account. Please try again.')
      }
      setRegisteredCustomer(result.customer)
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : 'Network error. Please try again.')
    } finally {
      setSignupPending(false)
    }
  }

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  if (showSignup && registeredCustomer) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-md w-full p-8 rounded-2xl text-center" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00' }}>✓</div>
          <h1 className="text-2xl font-bold text-[#111111] mb-2">Account created</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#0B5B24' }}>
            Welcome, {registeredCustomer.name}. Your account is registered with {registeredCustomer.email}.
          </p>
          <button onClick={() => navigate('shop')} className="w-full py-3 rounded-xl font-bold btn-gold">
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  if (showSignup) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4" style={{ background: '#FFFFFF' }}>
        <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
          <div className="text-center mb-7">
            <div className="badge mb-2" style={{ color: '#FF6A00' }}>ACCOUNT</div>
            <h1 className="text-2xl font-bold text-[#111111]">Create your account</h1>
            <p className="text-sm mt-2" style={{ color: '#0B5B24' }}>Sign up to shop with DubazaarMart.</p>
          </div>

          {signupError && (
            <div role="alert" className="mb-5 p-3 rounded-xl text-sm" style={{ background: '#FFF0EA', border: '1px solid rgba(233,75,0,0.3)', color: '#B93A00' }}>
              {signupError}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold mb-1.5 text-[#111111]">Full name</label>
              <input
                id="signup-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={event => setName(event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold mb-1.5 text-[#111111]">Email address</label>
              <input
                id="signup-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold mb-1.5 text-[#111111]">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #FFB800', color: '#111111' }}
              />
              <p className="text-xs mt-1.5" style={{ color: '#0B5B24' }}>Use at least 8 characters.</p>
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="block text-xs font-semibold mb-1.5 text-[#111111]">Confirm password</label>
              <input
                id="signup-confirm-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
            <button
              type="submit"
              disabled={signupPending}
              className="w-full py-3 rounded-xl font-bold btn-gold disabled:opacity-60"
            >
              {signupPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    )
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
            {wishlistProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistProducts.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="text-center py-16" style={{ color: '#0B5B24' }}>
                <div className="text-5xl mb-4">♡</div>
                <div className="text-lg font-medium text-[#111111] mb-2">Wishlist is empty</div>
                <button onClick={() => navigate('shop')} className="btn-gold px-6 py-2.5 rounded-xl font-semibold mt-4">Browse Products</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
