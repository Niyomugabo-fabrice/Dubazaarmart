import { useState } from 'react'
import { removeStockManual, type StockItemSummary } from '../lib/dashboardApi'

interface Props {
  isOpen: boolean
  stockItems: StockItemSummary[]
  preselectedProduct?: StockItemSummary | null
  onClose: () => void
  onStockRemoved: (message: string) => void
}

export default function RemoveStockModal({
  isOpen,
  stockItems,
  preselectedProduct,
  onClose,
  onStockRemoved,
}: Props) {
  const [selectedProductId, setSelectedProductId] = useState(preselectedProduct?.id || (stockItems[0]?.id ?? ''))
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Sold directly to customer / outside website')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const activeProduct = stockItems.find(p => p.id === (preselectedProduct?.id || selectedProductId))
  const availableQty = activeProduct?.quantity ?? 0
  const newAvailable = Math.max(0, availableQty - (quantity || 0))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeProduct) {
      setError('Please select a product.')
      return
    }
    if (quantity <= 0) {
      setError('Quantity to remove must be at least 1.')
      return
    }
    if (quantity > availableQty) {
      setError(`Cannot remove ${quantity}. Only ${availableQty} units available.`)
      return
    }
    if (!reason.trim()) {
      setError('Please provide an approved reason for removing stock.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await removeStockManual(activeProduct.id, quantity, reason.trim())
      onStockRemoved(`Removed ${quantity} units of "${activeProduct.name}". New stock: ${res.remainingQuantity}`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-[#FF6A00]">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6A00] text-lg font-bold">
              −
            </span>
            <div>
              <h3 className="font-bold text-gray-900">Remove Stock Manually</h3>
              <p className="text-xs text-gray-500">External sales, damage, or adjustment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Select Product *</label>
            <select
              value={preselectedProduct?.id || selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={!!preselectedProduct}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
            >
              {stockItems.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) – Available: {p.quantity}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Quantity to Remove *</label>
              <input
                required
                type="number"
                min="1"
                max={availableQty}
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Date & Time</label>
              <input
                type="text"
                disabled
                value={new Date().toLocaleString('en-RW', { dateStyle: 'short', timeStyle: 'short' })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-100 text-gray-600 font-mono"
              />
            </div>
          </div>

          {/* Automatic calculation preview */}
          {activeProduct && (
            <div className="p-3.5 rounded-xl bg-[#FFF7E8] border border-[#FFB800] space-y-1 text-xs font-medium">
              <div className="text-gray-600">Product: <strong className="text-gray-900">{activeProduct.name}</strong></div>
              <div className="text-gray-600">Available stock: <strong className="text-gray-900">{availableQty}</strong></div>
              <div className="text-gray-600">Quantity removed: <strong className="text-red-600">−{quantity || 0}</strong></div>
              <div className="border-t border-[#FFB800] pt-1 text-gray-900 font-bold">
                New available stock: <span className="text-[#FF6A00] font-black text-sm">{newAvailable}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Removal *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white mb-2"
            >
              <option value="Sold directly to customers">Sold directly to customers</option>
              <option value="Physical damage / broken unit">Physical damage / broken unit</option>
              <option value="Warranty exchange / customer return">Warranty exchange / customer return</option>
              <option value="Showroom demo / display unit">Showroom demo / display unit</option>
              <option value="Warehouse audit adjustment">Warehouse audit adjustment</option>
              <option value="Other approved reason">Other approved reason</option>
            </select>
            {reason === 'Other approved reason' && (
              <input
                required
                type="text"
                placeholder="Specify exact reason..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF6A00] hover:brightness-110 shadow-sm"
            >
              {loading ? 'Processing...' : 'Deduct Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
