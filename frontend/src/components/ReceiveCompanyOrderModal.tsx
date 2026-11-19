import { useState } from 'react'
import { receiveCompanyOrder, type CompanyOrder } from '../lib/dashboardApi'

interface Props {
  po: CompanyOrder | null
  isOpen: boolean
  onClose: () => void
  onStockAdded: (updatedPo: CompanyOrder, message: string) => void
}

export default function ReceiveCompanyOrderModal({ po, isOpen, onClose, onStockAdded }: Props) {
  if (!isOpen || !po) return null

  // Track quantities to receive for each item
  const [receivedInputs, setReceivedInputs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const it of po.items) {
      const remaining = it.quantityOrdered - (it.quantityReceived || 0)
      init[it.id] = Math.max(0, remaining)
    }
    return init
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateQty(itemId: string, val: number, max: number) {
    const safe = Math.min(Math.max(0, val), max)
    setReceivedInputs(prev => ({ ...prev, [itemId]: safe }))
  }

  async function handleConfirmReceive(e: React.FormEvent) {
    e.preventDefault()

    const toReceive = Object.entries(receivedInputs)
      .map(([itemId, quantityReceived]) => ({ itemId, quantityReceived }))
      .filter(item => item.quantityReceived > 0)

    if (toReceive.length === 0) {
      setError('Please specify at least 1 product quantity that has physically arrived.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await receiveCompanyOrder(po!.id, toReceive)
      onStockAdded(res.po, res.message)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive goods')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#17D719] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700 text-lg">
              📦
            </span>
            <div>
              <h3 className="font-bold text-gray-900">Add to Stock – Arrived Goods</h3>
              <p className="text-xs text-gray-500">PO: {po.poNumber} · {po.supplierName}</p>
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

        <p className="mt-3 text-xs text-gray-600 leading-relaxed">
          Verify physical shipments. Enter only the quantities that have actually arrived at the DubazaarMart warehouse. Arrived quantities will immediately increment stock and log in Stock Movements.
        </p>

        <form onSubmit={handleConfirmReceive} className="mt-4 space-y-4">
          <div className="space-y-3">
            {po.items.map(it => {
              const alreadyReceived = it.quantityReceived || 0
              const remaining = it.quantityOrdered - alreadyReceived
              const currentInput = receivedInputs[it.id] ?? 0

              return (
                <div key={it.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-sm truncate">{it.productName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Ordered: <strong>{it.quantityOrdered}</strong> · Already in stock: <strong>{alreadyReceived}</strong> · Remaining: <strong className="text-[#FF6A00]">{remaining}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="text-xs font-semibold text-gray-700">Received now:</label>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      disabled={remaining <= 0}
                      value={currentInput}
                      onChange={(e) => updateQty(it.id, parseInt(e.target.value) || 0, remaining)}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-300 text-center font-mono font-bold text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#17D719]"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t">
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
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#17D719] hover:brightness-110 shadow-sm"
            >
              {loading ? 'Adding to Stock...' : 'Confirm & Add to Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
