import { useState } from 'react'

interface Props {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onConfirmed: (orderId: string, reason: string) => Promise<void>
}

export default function CancelOrderModal({ orderId, isOpen, onClose, onConfirmed }: Props) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !orderId) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a specific reason for cancelling this order.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onConfirmed(orderId!, reason.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border-2 border-red-500 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
              ✕
            </span>
            <h3 className="font-bold text-gray-900">Cancel Customer Order</h3>
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
          Cancelling order <strong className="font-mono text-gray-900">#{orderId}</strong> will restore its ordered product quantities back into warehouse stock and log an official audit entry in Stock Movements.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation due to change of delivery location / unreachable on phone..."
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Processing...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
