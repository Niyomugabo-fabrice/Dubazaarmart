import type { CompanyOrder } from '../lib/dashboardApi'
import LiveCountdown from './LiveCountdown'

interface Props {
  po: CompanyOrder | null
  onClose: () => void
  onAddStockClick?: (po: CompanyOrder) => void
  onDeletePo?: (poId: string, poNumber: string) => void
}

export default function CompanyOrderDetailsModal({ po, onClose, onAddStockClick, onDeletePo }: Props) {
  if (!po) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#FFB800] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-[#FF6A00]">{po.poNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                po.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                po.status === 'PARTIALLY_RECEIVED' ? 'bg-amber-100 text-amber-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {po.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Purchase Order Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Expected arrival alert with live countdown */}
        <div className="mt-4 p-4 rounded-xl border border-blue-300 bg-blue-50/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold mb-1.5">
            <span className="text-slate-900 flex items-center gap-1.5">
              <span className="text-base">🚢</span> Cargo Arrival Countdown
            </span>
            <LiveCountdown
              targetDate={po.expectedArrival}
              isCompleted={po.status === 'RECEIVED'}
              completedText="Cargo Received in Stock"
              variant="company"
            />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {new Date(po.expectedArrival).toLocaleString('en-RW', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </div>
        </div>

        {/* Supplier & Logistics info */}
        <div className="mt-4 grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 font-medium">Supplier / Company:</span>
            <div className="font-bold text-gray-900 text-sm">{po.supplierName}</div>
            <div className="text-gray-600 mt-0.5">{po.supplierContact || 'No contact specified'}</div>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Shipping Carrier:</span>
            <div className="font-bold text-gray-900 text-sm">{po.shippingCompany}</div>
            <div className="text-gray-600 mt-0.5">{po.notes || 'Direct cargo'}</div>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Order Date:</span>
            <div className="font-medium text-gray-800">
              {new Date(po.orderDate).toLocaleString('en-RW', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Payment Status:</span>
            <div className="font-bold text-green-700">{po.paymentStatus} (USD)</div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mt-5">
          <h3 className="font-bold text-sm text-gray-900 mb-2">Purchased Products (USD)</h3>
          <div className="overflow-x-auto border rounded-xl border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-[#FFF7E8] text-[#0B5B24] border-b border-[#FFB800] font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Product</th>
                  <th className="py-2.5 px-3 text-left">Category</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Ordered</th>
                  <th className="py-2.5 px-3 text-right">Received</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {po.items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{it.productName}</td>
                    <td className="py-2.5 px-3 text-gray-500">{it.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">${it.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">{it.quantityOrdered}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        (it.quantityReceived || 0) >= it.quantityOrdered ? 'bg-green-100 text-green-800' :
                        (it.quantityReceived || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {it.quantityReceived || 0} / {it.quantityOrdered}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono text-[#FF6A00]">${it.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mt-4 p-4 rounded-xl bg-[#FFF7E8] border border-[#FFB800] space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-gray-700">
            <span>Products Total:</span>
            <span className="font-bold">${po.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Shipping Cost:</span>
            <span>${(po.shippingCost || 0).toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Other Charges:</span>
            <span>${(po.otherCharges || 0).toFixed(2)} USD</span>
          </div>
          <div className="border-t border-[#FFB800] pt-1.5 flex justify-between font-bold text-sm text-gray-900">
            <span>Total Purchase Cost:</span>
            <span className="text-[#FF6A00] text-base">${po.totalAmount.toFixed(2)} USD</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2 justify-end pt-3 border-t">
          {onDeletePo && (
            <button
              type="button"
              onClick={() => onDeletePo(po.id, po.poNumber)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 flex items-center gap-1 shadow-xs"
              title="Permanently delete this purchase order"
            >
              <span>🗑️</span> Delete PO
            </button>
          )}

          {po.status !== 'RECEIVED' && onAddStockClick && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onAddStockClick(po)
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#17D719] hover:brightness-110 shadow-sm flex items-center gap-1.5"
            >
              📦 Add to Stock
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
