import type { AdminOrder } from '../lib/dashboardApi'
import LiveCountdown from './LiveCountdown'

interface Props {
  order: AdminOrder | null
  onClose: () => void
  onRecordPayment?: (orderId: string) => void
  onCancelOrder?: (orderId: string) => void
  onDeleteOrder?: (orderId: string) => void
}

export default function CustomerOrderDetailsModal({ order, onClose, onRecordPayment, onCancelOrder, onDeleteOrder }: Props) {
  if (!order) return null

  function formatPrice(n: number | null) {
    if (n === null || n === undefined) return '—'
    return `${n.toLocaleString()} RWF`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#FFB800] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-[#FF6A00]">#{order.id}</span>
              {order.channel === 'whatsapp' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/20 text-[#075E54]">
                  💬 WhatsApp Enquiry
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0874F9]/20 text-[#0874F9]">
                  🌐 Online Web Order
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Customer Order Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Delivery countdown notice */}
        <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold mb-1.5">
            <span className="text-slate-800 flex items-center gap-1.5">
              <span className="text-base">⏰</span> Delivery Arrival Countdown
            </span>
            <LiveCountdown
              targetDate={
                order.requestedDeliveryTime ||
                new Date(new Date(order.createdAt).getTime() + 48 * 3600 * 1000).toISOString()
              }
              isCompleted={order.status === 'DELIVERED'}
              completedText="Delivered to Customer"
            />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {order.requestedDeliveryTime
              ? new Date(order.requestedDeliveryTime).toLocaleString('en-RW', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })
              : 'Standard Next-Day Delivery (estimated within 48 hours)'}
          </div>
        </div>

        {/* Customer & Delivery Summary */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 font-medium">Customer:</span>
            <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Payment Status:</span>
            <div className="font-bold text-sm" style={{ color: order.paymentStatus === 'PAID' ? '#17D719' : '#FFB800' }}>
              {order.paymentStatus} ({order.paymentMethod.toUpperCase()})
            </div>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Fulfillment Status:</span>
            <div className="font-bold text-gray-900 text-sm">{order.status.replace(/_/g, ' ')}</div>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Order Placed:</span>
            <div className="font-medium text-gray-800">
              {new Date(order.createdAt).toLocaleString('en-RW', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </div>

        {/* Customer instructions / Cancel reason */}
        {order.customerInstructions && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Customer Instructions:</strong> {order.customerInstructions}
          </div>
        )}
        {order.cancelReason && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
            <strong>Cancellation Reason:</strong> {order.cancelReason}
          </div>
        )}

        {/* Items Table */}
        <div className="mt-5">
          <h3 className="font-bold text-sm text-gray-900 mb-2">Ordered Products</h3>
          <div className="overflow-x-auto border rounded-xl border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-[#FFF7E8] text-[#0B5B24] border-b border-[#FFB800] font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Product</th>
                  <th className="py-2.5 px-3 text-left">Category</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{it.productName}</td>
                    <td className="py-2.5 px-3 text-gray-500">{it.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{formatPrice(it.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#FF6A00]">{formatPrice(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="mt-4 p-4 rounded-xl bg-[#FFF7E8] border border-[#FFB800] space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-900">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Nationwide Delivery:</span>
            <span className="font-semibold text-gray-900">{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="border-t border-[#FFB800] pt-1.5 flex justify-between font-bold text-sm">
            <span className="text-gray-900">Grand Total:</span>
            <span className="text-[#FF6A00]">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap gap-2 justify-end pt-3 border-t">
          {order.paymentStatus !== 'PAID' && onRecordPayment && (
            <button
              type="button"
              onClick={() => onRecordPayment(order.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#17D719] hover:brightness-110 shadow-sm"
            >
              ✓ Record Authorized Payment
            </button>
          )}

          {order.status !== 'CANCELLED' && onCancelOrder && (
            <button
              type="button"
              onClick={() => onCancelOrder(order.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-50"
            >
              Cancel Order
            </button>
          )}

          {onDeleteOrder && (
            <button
              type="button"
              onClick={() => onDeleteOrder(order.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 flex items-center gap-1 shadow-xs"
              title="Permanently delete this order"
            >
              <span>🗑️</span> Delete Order
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
