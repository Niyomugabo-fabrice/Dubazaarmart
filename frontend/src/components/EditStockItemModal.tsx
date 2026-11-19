import { useState, useEffect } from 'react'
import { updateStockTarget, type StockItemSummary } from '../lib/dashboardApi'

interface Props {
  item: StockItemSummary | null
  isOpen: boolean
  onClose: () => void
  onUpdated: (msg: string) => void
}

export default function EditStockItemModal({ item, isOpen, onClose, onUpdated }: Props) {
  const [targetStock, setTargetStock] = useState(20)
  const [minStock, setMinStock] = useState(5)
  const [unitCost, setUnitCost] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setTargetStock(item.targetStock || 20)
      setMinStock(item.minStock || 5)
      setUnitCost(item.unitCost || 0)
      setQuantity(item.quantity || 0)
    }
  }, [item])

  if (!isOpen || !item) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await updateStockTarget(item!.id, {
        expectedFullStock: targetStock,
        minStock,
        unitCost,
        quantity,
      })
      onUpdated(`Inventory targets updated for "${item!.name}".`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock targets')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#FFB800] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <h3 className="font-bold text-gray-900">Stock & Cost Configuration</h3>
            <p className="text-xs text-gray-500 truncate max-w-[280px]">{item.name}</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Current Stock (Units)
              </label>
              <input
                required
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Target Full Stock *
              </label>
              <input
                required
                type="number"
                min="1"
                value={targetStock}
                onChange={(e) => setTargetStock(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono font-bold text-[#0B5B24]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Unit Purchase Cost (RWF) *
              </label>
              <input
                required
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Low Stock Threshold (Red alert)
              </label>
              <input
                required
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono text-red-600 font-bold"
              />
            </div>
          </div>

          {/* Value preview */}
          <div className="p-3.5 rounded-xl bg-[#FFF7E8] border border-[#FFB800] space-y-1 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>Single Unit Value:</span>
              <span className="font-mono font-bold">{unitCost.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Total Item Stock Value:</span>
              <span className="font-mono font-black text-[#FF6A00]">
                {(quantity * unitCost).toLocaleString()} RWF
              </span>
            </div>
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
              className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-gold shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
