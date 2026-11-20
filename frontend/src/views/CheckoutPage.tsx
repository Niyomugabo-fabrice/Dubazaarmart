"use client"

import Image from 'next/image'
import { useState } from 'react'
import { useCart, cartStore } from '../store/cartStore'
import { createCustomerOrder } from '../lib/dashboardApi'
import { useAppNavigation } from '../lib/navigation'

const STEPS = ['Customer Info', 'Delivery', 'Review', 'Payment']

const RW_PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western']

const ORDER_RECEIPT_KEY = 'dubazaar_order_receipt'

export default function CheckoutPage() {
  const { cartItems, subtotal, delivery, total } = useCart()
  const { navigate } = useAppNavigation()
  const [step, setStep] = useState(0)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    street: '',
    instructions: '',
    deliveryDate: '',
    deliveryTime: '',
    paymentMethod: 'mtn',
  })

  function update(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function formatPrice(n: number) {
    return `${n.toLocaleString()} RWF`
  }

  function canProceed() {
    if (step === 0) return form.fullName && form.phone && form.email
    if (step === 1) return form.province && form.district && form.sector && form.cell
    return true
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    if (paymentLoading) return
    setPaymentLoading(true)
    setSubmitError(null)
    try {
      const requestedDeliveryTime = form.deliveryDate
        ? new Date(`${form.deliveryDate}T${form.deliveryTime || '10:00'}:00`).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const order = await createCustomerOrder({
        customerName: form.fullName,
        phone: form.phone,
        email: form.email,
        deliveryAddress: {
          province: form.province,
          district: form.district,
          sector: form.sector,
          cell: form.cell,
          street: form.street,
          instructions: form.instructions,
        },
        paymentMethod: form.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
        requestedDeliveryTime,
        customerInstructions: form.instructions || undefined,
        channel: 'web',
        items: cartItems.map(item => ({
          sku: item.product.sku,
          quantity: item.quantity,
        })),
      })
      try {
        window.sessionStorage.setItem(ORDER_RECEIPT_KEY, JSON.stringify(order))
      } catch {
        // The order is already placed; still show the confirmation if storage is unavailable.
      }
      cartStore.clear()
      navigate('payment-success')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The order could not be submitted. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-6 flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">Nothing to checkout</h2>
          <button onClick={() => navigate('shop')} className="btn-gold px-8 py-3 rounded-xl font-bold">Shop Now</button>
        </div>
      </div>
    )
  }

  const input = (label: string, field: keyof typeof form, type = 'text', placeholder = '') => {
    const id = `checkout-${field}`

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>{label}</label>
      <input
        id={id}
        type={type}
        value={form[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm"
      />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-6 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-6" style={{ color: '#FF6A00' }}>CHECKOUT</div>
        <h1 className="text-3xl font-bold text-[#111111] mb-8">Secure Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              {i < step ? (
                <button type="button" onClick={() => setStep(i)} className="flex items-center gap-2" aria-label={`Return to ${s}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: '#17D719', color: '#000' }}
                  >
                    ✓
                  </div>
                  <span className="text-sm font-medium hidden sm:block" style={{ color: '#0B5B24' }}>{s}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2" aria-current={i === step ? 'step' : undefined}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: i === step ? '#FF6A00' : '#F1FFF0',
                      color: i <= step ? '#000' : '#0B5B24',
                      border: '1px solid #FFB800',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block" style={{ color: i === step ? '#FFFFFF' : '#0B5B24' }}>{s}</span>
                </div>
              )}
              {i < STEPS.length - 1 && <div className="flex-1 h-px mx-3" style={{ background: i < step ? '#17D719' : '#FFB800' }} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
              {/* Step 0: Customer */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-bold text-[#111111] text-lg mb-6">Customer Information</h2>
                  {input('Full Name', 'fullName', 'text', 'Jean-Paul Hakizimana')}
                  {input('Phone Number', 'phone', 'tel', '+250 7XX XXX XXX')}
                  {input('Email Address', 'email', 'email', 'you@example.com')}
                </div>
              )}

              {/* Step 1: Delivery */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-bold text-[#111111] text-lg mb-6">Delivery Information</h2>
                  <div>
                    <label htmlFor="checkout-province" className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Province</label>
                    <select id="checkout-province" value={form.province} onChange={e => update('province', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm">
                      <option value="">Select Province</option>
                      {RW_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {input('District', 'district', 'text', 'e.g. Gasabo')}
                  {input('Sector', 'sector', 'text', 'e.g. Kimironko')}
                  {input('Cell', 'cell', 'text', 'e.g. Kibagabaga')}
                  {input('Street / Landmark', 'street', 'text', 'e.g. Near Simba Supermarket')}

                  <div className="rounded-xl p-4 border border-[#FFB800] bg-[#FFF7E8]/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⏰</span>
                      <h3 className="text-sm font-bold text-[#111111]">Preferred Delivery Arrival (Live Countdown)</h3>
                    </div>
                    <p className="text-xs text-[#0B5B24]">
                      Tell us when you want your order to arrive (e.g. tomorrow at 10:00 AM). The system will calculate a live countdown for you and our delivery team!
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="checkout-delivery-date" className="block text-xs font-semibold mb-1 text-[#111111]">Arrival Date</label>
                        <input
                          id="checkout-delivery-date"
                          type="date"
                          min={new Date().toISOString().slice(0, 10)}
                          value={form.deliveryDate}
                          onChange={(e) => update('deliveryDate', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-[#FFB800]"
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-delivery-time" className="block text-xs font-semibold mb-1 text-[#111111]">Arrival Time</label>
                        <input
                          id="checkout-delivery-time"
                          type="time"
                          value={form.deliveryTime}
                          onChange={(e) => update('deliveryTime', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white border border-[#FFB800]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-instructions" className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Delivery Instructions (optional)</label>
                    <textarea id="checkout-instructions" value={form.instructions} onChange={e => update('instructions', e.target.value)} placeholder="e.g. Please deliver my order tomorrow at 10:00 AM, call me when at the gate..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none" />
                  </div>
                </div>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div>
                  <h2 className="font-bold text-[#111111] text-lg mb-6">Order Review</h2>
                  <div className="space-y-3 mb-6">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="flex gap-3 py-3" style={{ borderBottom: '1px solid #FFB800' }}>
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.product.image} alt={item.product.name} fill sizes="48px" unoptimized={item.product.image.includes('images.unsplash.com')} className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#111111] line-clamp-1">{item.product.name}</div>
                          <div className="text-xs" style={{ color: '#0B5B24' }}>Qty: {item.quantity}</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: '#FF6A00' }}>{formatPrice(item.product.price * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl space-y-2 text-sm" style={{ background: '#F1FFF0' }}>
                    <div><span style={{ color: '#111111' }}>Delivering to: </span><span className="text-[#111111] font-semibold">{form.fullName}</span></div>
                    <div><span style={{ color: '#111111' }}>Address: </span><span className="text-[#111111]">{[form.cell, form.sector, form.district, form.province].filter(Boolean).join(', ')}</span></div>
                    <div><span style={{ color: '#111111' }}>Phone: </span><span className="text-[#111111] font-semibold">{form.phone}</span></div>
                    {form.deliveryDate && (
                      <div className="pt-1 text-[#FF6A00] font-bold">
                        <span>Requested Arrival: </span>
                        <span>{form.deliveryDate} at {form.deliveryTime || '10:00 AM'}</span>
                      </div>
                    )}
                    {form.instructions && (
                      <div className="pt-1 text-xs italic text-gray-700">
                        <span>Instructions: </span>{form.instructions}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <form onSubmit={handlePlaceOrder}>
                  <h2 className="font-bold text-[#111111] text-lg mb-6">Payment Method</h2>
                  <div className="space-y-3 mb-6">
                    {[
                      { id: 'mtn', label: 'MTN Mobile Money', desc: 'Pay with your MTN MoMo account', color: '#FFB800' },
                      { id: 'airtel', label: 'Airtel Money', desc: 'Pay with your Airtel Money account', color: '#FF6A00' },
                    ].map(method => (
                      <label
                        key={method.id}
                        className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: form.paymentMethod === method.id ? 'rgba(255,106,0,0.08)' : '#F1FFF0',
                          border: `1px solid ${form.paymentMethod === method.id ? '#FF6A00' : '#FFB800'}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={form.paymentMethod === method.id}
                          onChange={() => update('paymentMethod', method.id)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold text-[#111111]">{method.label}</div>
                          <div className="text-sm" style={{ color: '#0B5B24' }}>{method.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mb-6 rounded-xl border p-4 text-sm leading-6" style={{ background: 'rgba(255,106,0,0.06)', borderColor: 'rgba(255,106,0,0.2)', color: '#111111' }}>
                    Your order will be saved with payment marked pending. Payment is only marked paid after confirmation from the payment provider.
                  </div>

                  {submitError && (
                    <div role="alert" className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: 'rgba(255,106,0,0.35)', background: 'rgba(255,106,0,0.08)', color: '#FFB800' }}>
                      {submitError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full py-4 rounded-xl font-bold btn-gold disabled:opacity-50"
                  >
                    {paymentLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.3)" strokeWidth="3"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Saving your order…
                      </span>
                    ) : `Place order · ${formatPrice(total)}`}
                  </button>
                </form>
              )}

              {step < 3 && (
                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-medium btn-ghost">
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canProceed()}
                    className="flex-1 py-3 rounded-xl font-bold btn-gold disabled:opacity-50"
                  >
                    {step === 2 ? 'Proceed to Payment →' : 'Continue →'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="p-5 rounded-2xl h-fit sticky top-24" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
            <h3 className="font-bold text-[#111111] mb-4 text-sm">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {cartItems.slice(0, 3).map(item => (
                <div key={item.product.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1 mr-2" style={{ color: '#111111' }}>{item.product.name} ×{item.quantity}</span>
                  <span className="flex-shrink-0 text-[#111111]">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              {cartItems.length > 3 && <div className="text-xs" style={{ color: '#0B5B24' }}>+{cartItems.length - 3} more items</div>}
            </div>
            <div className="section-divider mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span style={{ color: '#111111' }}>Subtotal</span><span className="text-[#111111]">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: '#111111' }}>Delivery</span><span className="text-[#111111]">{formatPrice(delivery)}</span></div>
              <div className="flex justify-between font-bold pt-2" style={{ borderTop: '1px solid #FFB800' }}>
                <span className="text-[#111111]">Total</span>
                <span style={{ color: '#FF6A00' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
