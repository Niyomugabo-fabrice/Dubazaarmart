import { useState } from 'react'
import { receiveCompanyOrder, type CompanyOrder } from '../lib/dashboardApi'

interface Props {
  po: CompanyOrder | null
  isOpen: boolean
  onClose: () => void
  onStockAdded: (updatedPo: CompanyOrder, message: string) => void
}

export default function ReceiveCompanyOrderModal({ po, isOpen, onClose, onStockAdded }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!isOpen || !po) return null
  const order = po

  async function handleConfirmReceive(e: React.FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      const res = await receiveCompanyOrder(order.id)
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
          Confirm the full shipment. Every remaining product quantity will be added to stock and logged together in Stock Movement History.
        </p>

        <form onSubmit={handleConfirmReceive} className="mt-4 space-y-4">
          <div className="space-y-3">
            {po.items.map(it => {
              const alreadyReceived = it.quantityReceived || 0
              const remaining = it.quantityOrdered - alreadyReceived

              return (
                <div key={it.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-sm truncate">{it.productName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Ordered: <strong>{it.quantityOrdered}</strong> · Already in stock: <strong>{alreadyReceived}</strong> · Remaining: <strong className="text-[#FF6A00]">{remaining}</strong>
                    </div>
                  </div>

                  <div className="flex-shrink-0 rounded-lg bg-green-50 px-3 py-2 text-sm font-black text-green-700">+{remaining}</div>
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
              {loading ? 'Marking as Received...' : 'Mark as Received'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
