'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cartStore, useCart } from '../store/cartStore'
import { createWhatsAppOrder } from '../lib/dashboardApi'

export default function CartPage() {
  const router = useRouter()
  const { cartItems, subtotal, delivery, total } = useCart()
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [whatsAppLoading, setWhatsAppLoading] = useState(false)
  const [whatsAppSuccess, setWhatsAppSuccess] = useState<string | null>(null)
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null)

  function formatPrice(n: number) {
    return `${n.toLocaleString()} RWF`
  }

  function handleNavigate(path: string) {
    router.push(path)
  }

  async function handleOrderViaWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) {
      setWhatsAppError('Please enter your name.')
      return
    }

    try {
      setWhatsAppLoading(true)
      setWhatsAppError(null)

      const result = await createWhatsAppOrder({
        customerName: customerName.trim(),
        phone: customerPhone.trim() || '+250789545954',
        items: cartItems.map(item => ({
          sku: item.product.sku,
          quantity: item.quantity,
        })),
      })

      setWhatsAppSuccess(`Order #${result.orderId} saved in database! Opening WhatsApp...`)

      // Open WhatsApp in new tab / app
      window.open(result.whatsappUrl, '_blank')

      setTimeout(() => {
        setIsWhatsAppModalOpen(false)
        setWhatsAppSuccess(null)
      }, 3500)
    } catch (err) {
      setWhatsAppError(err instanceof Error ? err.message : 'Could not process WhatsApp order')
    } finally {
      setWhatsAppLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-6 flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <div className="text-center">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Your cart is empty</h2>
          <p className="mb-8" style={{ color: '#0B5B24' }}>Discover electronics and products available from our China and Dubai services</p>
          <Link
            href="/shop"
            className="btn-gold px-8 py-3 rounded-xl font-bold inline-block"
          >
            Start Shopping →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-6 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-6" style={{ color: '#FF6A00' }}>CART</div>
        <h1 className="text-3xl font-bold text-[#111111] mb-8">Your Cart ({cartItems.length} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl shadow-sm" style={{ background: '#FFF7E8', border: '2px solid #FFB800' }}>
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 product-img-wrap">
                  <Image src={item.product.image} alt={item.product.name} fill sizes="80px" unoptimized={item.product.image.includes('images.unsplash.com')} className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="badge mb-1" style={{ color: '#FF6A00' }}>{item.product.brand}</div>
                  <h3 className="font-semibold text-[#111111] text-sm mb-2 line-clamp-2">{item.product.name}</h3>
                  <div className="text-sm font-bold" style={{ color: '#FF6A00' }}>Unit price: {formatPrice(item.product.price)}</div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button type="button" onClick={() => cartStore.remove(item.product.id)} className="text-xs" style={{ color: '#0B5B24' }} aria-label={`Remove ${item.product.name} from cart`}>
                    ✕ Remove
                  </button>
                  <div className="flex items-center rounded-lg overflow-hidden bg-white" style={{ border: '1px solid #FFB800' }}>
                    <button type="button" onClick={() => cartStore.updateQty(item.product.id, item.quantity - 1)} className="px-3 py-1.5 text-[#111111] hover:bg-black/5 text-sm font-bold" aria-label={`Decrease ${item.product.name} quantity`}>−</button>
                    <span className="px-3 font-mono text-[#111111] text-sm font-bold" aria-live="polite">{item.quantity}</span>
                    <button type="button" onClick={() => cartStore.updateQty(item.product.id, item.quantity + 1)} className="px-3 py-1.5 text-[#111111] hover:bg-black/5 text-sm font-bold" aria-label={`Increase ${item.product.name} quantity`}>+</button>
                  </div>
                  <div className="text-sm font-bold text-[#111111]">Total: {formatPrice(item.product.price * item.quantity)}</div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => cartStore.clear()} className="text-sm text-red-600 hover:underline">
                Clear cart
              </button>
              <Link
                href="/shop"
                className="text-sm text-[#0B5B24] hover:underline font-medium"
              >
                + Add more products
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 rounded-2xl h-fit sticky top-24 shadow-sm" style={{ background: '#FFF7E8', border: '2px solid #FFB800' }}>
            <h2 className="font-bold text-[#111111] mb-6 text-lg">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#111111' }}>Subtotal</span>
                <span className="text-[#111111] font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#111111' }}>Delivery</span>
                <span className="text-[#111111] font-semibold">{formatPrice(delivery)}</span>
              </div>
              <div className="section-divider" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-[#111111]">Grand Total</span>
                <span style={{ color: '#FF6A00' }}>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-6">
              <input aria-label="Promo code" placeholder="Promo code" className="flex-1 px-3 py-2 rounded-lg text-sm bg-white border border-[#FFB800]" />
              <button className="px-4 py-2 rounded-lg text-sm btn-ghost">Apply</button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleNavigate('/checkout')}
                className="w-full py-3.5 rounded-xl font-bold btn-gold text-base shadow-sm"
              >
                Online Checkout (MoMo / Airtel) →
              </button>

              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-sm"
                style={{ background: '#25D366' }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C16.58 3.68 20.27 7.37 20.27 11.91C20.27 16.45 16.58 20.15 12.04 20.15ZM16.56 14.33C16.31 14.21 15.09 13.61 14.86 13.52C14.63 13.44 14.47 13.4 14.3 13.65C14.13 13.9 13.66 14.46 13.51 14.63C13.37 14.8 13.22 14.82 12.97 14.7C12.72 14.58 11.93 14.32 10.99 13.48C10.26 12.83 9.77 12.02 9.63 11.77C9.48 11.52 9.61 11.39 9.74 11.26C9.85 11.15 9.99 10.97 10.11 10.83C10.23 10.69 10.28 10.58 10.36 10.42C10.44 10.25 10.4 10.11 10.34 9.98C10.28 9.86 9.79 8.65 9.58 8.16C9.38 7.68 9.18 7.74 9.02 7.73C8.88 7.73 8.71 7.73 8.55 7.73C8.38 7.73 8.11 7.79 7.89 8.04C7.66 8.28 7.03 8.87 7.03 10.07C7.03 11.27 7.9 12.43 8.03 12.6C8.15 12.77 9.76 15.26 12.22 16.32C12.8 16.57 13.26 16.73 13.61 16.84C14.2 17.03 14.74 17 15.17 16.94C15.65 16.87 16.64 16.34 16.85 15.76C17.05 15.18 17.05 14.68 16.99 14.58C16.93 14.48 16.8 14.45 16.56 14.33Z"/>
                </svg>
                Order via WhatsApp
              </button>

              <Link
                href="/shop"
                className="w-full py-2.5 rounded-xl font-medium text-sm text-center block text-[#0B5B24] hover:underline"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs" style={{ color: '#0B5B24' }}>
              <span>🔒</span> Secured by MTN MoMo & Airtel Money
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#25D366] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white font-bold">
                  WA
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">Order via WhatsApp</h3>
                  <p className="text-xs text-gray-500">Official Hub: +250 789 545 954</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Your cart will be saved as an official enquiry in the DubazaarMart database, and WhatsApp will open with your itemized breakdown ready to send.
            </p>

            {whatsAppSuccess ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-300 text-green-800 text-sm font-medium text-center">
                ✓ {whatsAppSuccess}
              </div>
            ) : (
              <form onSubmit={handleOrderViaWhatsApp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Jean-Paul Hakizimana"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#25D366]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FFF7E8] border border-[#FFB800] text-xs space-y-1">
                  <div className="font-bold text-[#111111]">Order Summary:</div>
                  <div className="text-gray-700">{cartItems.length} items · Total: <span className="font-bold text-[#FF6A00]">{formatPrice(total)}</span></div>
                </div>

                {whatsAppError && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                    {whatsAppError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWhatsAppModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={whatsAppLoading}
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold bg-[#25D366] hover:brightness-110 flex items-center justify-center gap-1.5"
                  >
                    {whatsAppLoading ? 'Saving...' : 'Send on WhatsApp →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
