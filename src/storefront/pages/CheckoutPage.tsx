import { useState } from 'react'
import { useCart, cartStore } from '../store/cartStore'
import { placeCustomerOrder } from '../../app/(frontend)/actions'

interface Props {
  setPage: (p: string) => void
}

const STEPS = ['Customer Info', 'Delivery', 'Review', 'Payment']

const RW_PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western']

export default function CheckoutPage({ setPage }: Props) {
  const { cartItems, subtotal, delivery, total } = useCart()
  const [step, setStep] = useState(0)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
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
    paymentMethod: 'mtn',
    momoPhone: '',
  })

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  function canProceed() {
    if (step === 0) return form.fullName && form.phone && form.email
    if (step === 1) return form.province && form.district && form.sector && form.cell
    return true
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setPaymentLoading(true)
    setPaymentError('')
    const result = await placeCustomerOrder({
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
      items: cartItems.map(({ product, quantity }) => ({
        productName: product.name,
        category: product.category,
        sku: product.sku,
        quantity,
        unitPrice: product.price,
      })),
      subtotal,
      deliveryFee: delivery,
      total,
      paymentMethod: form.paymentMethod === 'airtel' ? 'airtel' : 'mtn',
    })
    setPaymentLoading(false)
    if (result.ok) {
      cartStore.clear()
      setPage('payment-success')
    } else {
      setPaymentError(result.error)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{ background: '#0A0A0B' }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Nothing to checkout</h2>
          <button
            onClick={() => setPage('shop')}
            className="btn-gold px-8 py-3 rounded-xl font-bold"
          >
            Shop Now
          </button>
        </div>
      </div>
    )
  }

  const input = (label: string, field: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#A0A0A8' }}>
        {label}
      </label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm"
      />
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#0A0A0B' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-6" style={{ color: '#D4A843' }}>
          CHECKOUT
        </div>
        <h1 className="text-3xl font-bold text-white mb-8">Secure Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 ${i <= step ? 'cursor-pointer' : ''}`}
                onClick={() => i < step && setStep(i)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: i < step ? '#22c55e' : i === step ? '#D4A843' : '#1A1A1E',
                    color: i <= step ? '#000' : '#555560',
                    border: i > step ? '1px solid #2A2A30' : 'none',
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className="text-sm font-medium hidden sm:block"
                  style={{ color: i === step ? '#F5F5F0' : '#555560' }}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-3"
                  style={{ background: i < step ? '#22c55e' : '#2A2A30' }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div
              className="p-6 rounded-2xl"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              {/* Step 0: Customer */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-bold text-white text-lg mb-6">Customer Information</h2>
                  {input('Full Name', 'fullName', 'text', 'Jean-Paul Hakizimana')}
                  {input('Phone Number', 'phone', 'tel', '+250 7XX XXX XXX')}
                  {input('Email Address', 'email', 'email', 'you@example.com')}
                </div>
              )}

              {/* Step 1: Delivery */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-bold text-white text-lg mb-6">Delivery Information</h2>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: '#A0A0A8' }}
                    >
                      Province
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) => update('province', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm"
                    >
                      <option value="">Select Province</option>
                      {RW_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  {input('District', 'district', 'text', 'e.g. Gasabo')}
                  {input('Sector', 'sector', 'text', 'e.g. Kimironko')}
                  {input('Cell', 'cell', 'text', 'e.g. Kibagabaga')}
                  {input('Street / Landmark', 'street', 'text', 'e.g. Near Simba Supermarket')}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: '#A0A0A8' }}
                    >
                      Delivery Instructions (optional)
                    </label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => update('instructions', e.target.value)}
                      placeholder="Any special instructions for delivery..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div>
                  <h2 className="font-bold text-white text-lg mb-6">Order Review</h2>
                  <div className="space-y-3 mb-6">
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-3 py-3"
                        style={{ borderBottom: '1px solid #2A2A30' }}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white line-clamp-1">
                            {item.product.name}
                          </div>
                          <div className="text-xs" style={{ color: '#555560' }}>
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: '#D4A843' }}>
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="p-4 rounded-xl space-y-2 text-sm"
                    style={{ background: '#1A1A1E' }}
                  >
                    <div>
                      <span style={{ color: '#A0A0A8' }}>Delivering to: </span>
                      <span className="text-white">{form.fullName}</span>
                    </div>
                    <div>
                      <span style={{ color: '#A0A0A8' }}>Address: </span>
                      <span className="text-white">
                        {[form.cell, form.sector, form.district, form.province]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#A0A0A8' }}>Phone: </span>
                      <span className="text-white">{form.phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <form onSubmit={handlePayment}>
                  <h2 className="font-bold text-white text-lg mb-6">Payment Method</h2>
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        id: 'mtn',
                        label: 'MTN Mobile Money',
                        desc: 'Pay with your MTN MoMo account',
                        color: '#FFD700',
                      },
                      {
                        id: 'airtel',
                        label: 'Airtel Money',
                        desc: 'Pay with your Airtel Money account',
                        color: '#FF0000',
                      },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          background:
                            form.paymentMethod === method.id ? 'rgba(212,168,67,0.08)' : '#1A1A1E',
                          border: `1px solid ${form.paymentMethod === method.id ? '#D4A843' : '#2A2A30'}`,
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
                          <div className="font-semibold text-white">{method.label}</div>
                          <div className="text-sm" style={{ color: '#555560' }}>
                            {method.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: '#A0A0A8' }}
                    >
                      Mobile Money Number
                    </label>
                    <input
                      type="tel"
                      value={form.momoPhone}
                      onChange={(e) => update('momoPhone', e.target.value)}
                      placeholder="+250 7XX XXX XXX"
                      className="w-full px-4 py-3 rounded-xl text-sm"
                      required
                    />
                    <p className="text-xs mt-2" style={{ color: '#555560' }}>
                      You will receive a payment prompt on your phone. Authorize with your PIN to
                      complete.
                    </p>
                  </div>

                  <div
                    className="p-3 rounded-xl mb-6 text-sm"
                    style={{
                      background: 'rgba(212,168,67,0.06)',
                      border: '1px solid rgba(212,168,67,0.2)',
                      color: '#A0A0A8',
                    }}
                  >
                    🔒 Your payment PIN is entered directly on your phone — we never see or store
                    it.
                  </div>

                  <button
                    type="submit"
                    disabled={!form.momoPhone || paymentLoading}
                    className="w-full py-4 rounded-xl font-bold btn-gold disabled:opacity-50"
                  >
                    {paymentLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin"
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />
                          <path
                            d="M12 2a10 10 0 0 1 10 10"
                            stroke="#000"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Waiting for authorization...
                      </span>
                    ) : (
                      `Pay ${formatPrice(total)}`
                    )}
                  </button>
                  {paymentError && (
                    <p className="mt-3 text-sm" role="alert" style={{ color: '#ef4444' }}>
                      {paymentError}
                    </p>
                  )}
                </form>
              )}

              {step < 3 && (
                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => s - 1)}
                      className="px-6 py-3 rounded-xl font-medium btn-ghost"
                    >
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={() => setStep((s) => s + 1)}
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
          <div
            className="p-5 rounded-2xl h-fit sticky top-24"
            style={{ background: '#111114', border: '1px solid #2A2A30' }}
          >
            <h3 className="font-bold text-white mb-4 text-sm">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {cartItems.slice(0, 3).map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1 mr-2" style={{ color: '#A0A0A8' }}>
                    {item.product.name} ×{item.quantity}
                  </span>
                  <span className="flex-shrink-0 text-white">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
              {cartItems.length > 3 && (
                <div className="text-xs" style={{ color: '#555560' }}>
                  +{cartItems.length - 3} more items
                </div>
              )}
            </div>
            <div className="section-divider mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A8' }}>Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A8' }}>Delivery</span>
                <span className="text-white">{formatPrice(delivery)}</span>
              </div>
              <div
                className="flex justify-between font-bold pt-2"
                style={{ borderTop: '1px solid #2A2A30' }}
              >
                <span className="text-white">Total</span>
                <span style={{ color: '#D4A843' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
