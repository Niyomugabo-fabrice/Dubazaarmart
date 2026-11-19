import { useState } from 'react'
import { apiFetch, apiUrl } from '../services/api-client'
import type { Product } from '../data/products'

interface Props {
  isOpen: boolean
  products: Product[]
  onClose: () => void
  onOrderCreated: () => void
}

export default function CreateOrderModal({ isOpen, products, onClose, onOrderCreated }: Props) {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [province, setProvince] = useState('Kigali')
  const [district, setDistrict] = useState('Gasabo')
  const [sector, setSector] = useState('Kimironko')
  const [street, setStreet] = useState('')
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel'>('mtn')
  const [orderStatus, setOrderStatus] = useState('PAID')
  const [paymentStatus, setPaymentStatus] = useState('PAID')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedProduct = products.find(p => p.sku === selectedSku) || products[0]
  const unitPrice = selectedProduct?.price || 0
  const subtotal = unitPrice * quantity
  const deliveryFee = 10000
  const total = subtotal + deliveryFee

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!customerName.trim() || !phone.trim()) {
      setError('Customer name and phone number are required.')
      return
    }

    if (!selectedSku) {
      setError('Please select a product.')
      return
    }

    setSubmitting(true)

    const payload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase() || `${customerName.trim().toLowerCase().replace(/\s+/g, '.')}@customer.rw`,
      deliveryAddress: {
        province,
        district,
        sector,
        street: street.trim() || 'Direct Customer Pickup',
        cell: 'Main',
      },
      paymentMethod,
      status: orderStatus,
      paymentStatus,
      deliveryFee,
      items: [
        {
          productName: selectedProduct?.name || 'Item',
          category: selectedProduct?.category || 'General',
          sku: selectedSku,
          quantity: Math.max(1, quantity),
          unitPrice,
        },
      ],
    }

    try {
      const res = await apiFetch(apiUrl('/api/admin/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      onOrderCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl p-6 shadow-2xl animate-scaleUp sm:p-8"
        style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#F1FFF0' }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF6A00]">
              ADMIN DISPATCH
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] mt-0.5">
              Create New Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div
            className="my-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2"
            style={{ background: 'rgba(233,75,0,0.08)', color: '#E94B00', border: '1px solid rgba(233,75,0,0.3)' }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Eric Manzi"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+250 788 123 456"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Customer Email
              </label>
              <input
                type="email"
                placeholder="customer@domain.rw"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Province
              </label>
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                <option value="Kigali">Kigali</option>
                <option value="Northern">Northern</option>
                <option value="Southern">Southern</option>
                <option value="Eastern">Eastern</option>
                <option value="Western">Western</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="Gasabo"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Sector
              </label>
              <input
                type="text"
                value={sector}
                onChange={e => setSector(e.target.value)}
                placeholder="Kimironko"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Street / Land mark
              </label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="KG 15 Ave"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-[1fr_120px] gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Select Product *
              </label>
              <select
                value={selectedSku}
                onChange={e => setSelectedSku(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                {products.map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} — {formatPrice(p.price)} (Stock: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as 'mtn' | 'airtel')}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                <option value="mtn">MTN Mobile Money</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Order Status
              </label>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                <option value="PAID">PAID (Verified)</option>
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
              </select>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-4 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
            <div className="flex justify-between text-xs text-[#0B5B24] mb-1">
              <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''}):</span>
              <span className="font-semibold text-[#111111]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#0B5B24] mb-2">
              <span>Delivery Fee (Nationwide):</span>
              <span className="font-semibold text-[#111111]">{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2" style={{ borderColor: '#FFB800' }}>
              <span className="text-[#111111]">Total Amount:</span>
              <span className="text-[#FF6A00]">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: '#F1FFF0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold btn-gold flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Place & Record Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
