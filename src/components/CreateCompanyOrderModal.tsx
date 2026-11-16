import { useState } from 'react'
import { createCompanyOrder, type CompanyOrder } from '../lib/dashboardApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: (order: CompanyOrder) => void
}

interface ProductItemRow {
  productName: string
  category: string
  unitPrice: number
  quantityOrdered: number
}

export default function CreateCompanyOrderModal({ isOpen, onClose, onOrderCreated }: Props) {
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [shippingCompany, setShippingCompany] = useState('')
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return d.toISOString().slice(0, 10)
  })
  const [expectedTime, setExpectedTime] = useState('10:00')
  const [shippingCost, setShippingCost] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<ProductItemRow[]>([
    { productName: '', category: 'smartphones', unitPrice: 0, quantityOrdered: 1 },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  function addItem() {
    setItems([...items, { productName: '', category: 'electronics', unitPrice: 0, quantityOrdered: 1 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ProductItemRow, value: any) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  // Real-time automatic calculation
  const productTotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantityOrdered) || 0), 0)
  const grandTotalUSD = productTotal + (Number(shippingCost) || 0) + (Number(otherCharges) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierName.trim() || !shippingCompany.trim() || !expectedDate) {
      setError('Supplier name, shipping company, and expected arrival date are required.')
      return
    }

    const validItems = items.filter(it => it.productName.trim() && it.quantityOrdered > 0 && it.unitPrice >= 0)
    if (validItems.length === 0) {
      setError('Please add at least 1 valid product with name, quantity, and unit cost.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const expectedArrival = new Date(`${expectedDate}T${expectedTime || '10:00'}:00`).toISOString()

      const created = await createCompanyOrder({
        supplierName: supplierName.trim(),
        supplierContact: supplierContact.trim(),
        shippingCompany: shippingCompany.trim(),
        expectedArrival,
        shippingCost: Number(shippingCost) || 0,
        otherCharges: Number(otherCharges) || 0,
        notes: notes.trim(),
        items: validItems,
      })

      onOrderCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border-2 border-[#FFB800] my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FF6A00]/10 text-[#FF6A00]">
                Company Purchases
              </span>
              <span className="font-mono text-xs font-bold text-gray-500">Currency: USD ($)</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Create Company Purchase Order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Supplier & Logistics */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Supplier Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Dubai Wholesale Tech FZCO"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-[#FF6A00]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Supplier Contact</label>
              <input
                type="text"
                placeholder="+971 4 382 9900 / orders@..."
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-[#FF6A00]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Shipping Company *</label>
              <input
                required
                type="text"
                placeholder="e.g. Emirates Cargo / DHL"
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Expected Arrival */}
          <div className="p-4 rounded-xl bg-[#FFF7E8] border border-[#FFB800] space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">✈️</span>
              <span className="text-xs font-bold text-[#111111]">Expected Arrival Date & Time (Starts live countdown)</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Arrival Date *</label>
                <input
                  required
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* Multiple Products Dynamic Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Products in this Purchase Order
              </label>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FF6A00]/10 text-[#FF6A00] hover:bg-[#FF6A00]/20"
              >
                + Add Another Product
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((it, idx) => {
                const lineCost = (Number(it.unitPrice) || 0) * (Number(it.quantityOrdered) || 0)
                return (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50 grid sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Product Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Samsung Galaxy A51"
                        value={it.productName}
                        onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Category</label>
                      <select
                        value={it.category}
                        onChange={(e) => updateItem(idx, 'category', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                      >
                        <option value="smartphones">Smartphones</option>
                        <option value="laptops">Laptops</option>
                        <option value="audio">Audio / AirPods</option>
                        <option value="accessories">Accessories</option>
                        <option value="electronics">General Tech</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Cost 1 Unit ($)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="150"
                        value={it.unitPrice || ''}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-gray-500 font-bold mb-0.5">Qty</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={it.quantityOrdered || ''}
                        onChange={(e) => updateItem(idx, 'quantityOrdered', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between pl-1">
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold">Total ($)</div>
                        <div className="font-mono text-xs font-black text-[#FF6A00]">
                          ${lineCost.toLocaleString()}
                        </div>
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm ml-2"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Logistics Costs & Grand Total */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Shipping Cost (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCost || ''}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Other Applicable Charges (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherCharges || ''}
                  onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF7E8] border border-[#FFB800] flex flex-col justify-between">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Products Cost:</span>
                  <span className="font-mono font-bold">${productTotal.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping Cost:</span>
                  <span className="font-mono">${(Number(shippingCost) || 0).toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Other Charges:</span>
                  <span className="font-mono">${(Number(otherCharges) || 0).toLocaleString()} USD</span>
                </div>
              </div>
              <div className="border-t border-[#FFB800] pt-2 mt-3 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900">Total Purchase Cost:</span>
                <span className="font-mono text-xl font-black text-[#FF6A00]">
                  ${grandTotalUSD.toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Tracking References</label>
            <input
              type="text"
              placeholder="e.g. AWB #987-12345678, Kigali International Airport cargo hold"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold btn-gold shadow-sm"
            >
              {loading ? 'Creating PO...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
