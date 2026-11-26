"use client"

import { useState, useEffect } from 'react'
import { submitOrderPayment, type CustomerOrderReceipt } from '../lib/dashboardApi'
import { useAppNavigation } from '../lib/navigation'

const ORDER_RECEIPT_KEY = 'dubazaar_order_receipt'

export default function PaymentSuccessPage() {
  const { navigate } = useAppNavigation()
  const [order, setOrder] = useState<CustomerOrderReceipt | null>(null)
  const [retryTxId, setRetryTxId] = useState('')
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [retrySuccess, setRetrySuccess] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isOverdue: boolean
  } | null>(null)

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(ORDER_RECEIPT_KEY)
      if (stored) setOrder(JSON.parse(stored) as CustomerOrderReceipt)
    } catch {
      setOrder(null)
    }
  }, [])

  const placedAt = order
    ? new Intl.DateTimeFormat('en-RW', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Kigali',
      }).format(new Date(order.createdAt))
    : null
  const deliveryTarget = order
    ? order.requestedDeliveryTime || new Date(new Date(order.createdAt).getTime() + 48 * 3600 * 1000).toISOString()
    : null

  useEffect(() => {
    if (!deliveryTarget) return
    const target = new Date(deliveryTarget).getTime()
    if (!Number.isFinite(target)) return

    function updateCountdown() {
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isOverdue: false,
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [deliveryTarget])

  async function handleRetryPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!order || !retryTxId.trim() || retryLoading) return
    setRetryLoading(true)
    setRetryError(null)
    setRetrySuccess(null)
    try {
      await submitOrderPayment(order.orderId, retryTxId.trim())
      const updatedOrder = {
        ...order,
        status: 'WAITING_APPROVAL',
        paymentStatus: 'WAITING_APPROVAL',
        mtnTransactionId: retryTxId.trim(),
        paymentRejectionReason: null,
      }
      setOrder(updatedOrder)
      try {
        window.sessionStorage.setItem(ORDER_RECEIPT_KEY, JSON.stringify(updatedOrder))
      } catch {
        // Storage not available
      }
      setRetrySuccess('Payment details resubmitted successfully! Your payment is now waiting for admin approval.')
      setRetryTxId('')
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Failed to resubmit payment. Please try again.')
    } finally {
      setRetryLoading(false)
    }
  }

  function formatPrice(amount: number) {
    return `${amount.toLocaleString()} RWF`
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: '#FFFFFF' }}>
        <div className="w-full max-w-lg text-center">
          <h1 className="text-2xl font-bold text-[#111111] mb-3">Order confirmation unavailable</h1>
          <p className="text-sm mb-6" style={{ color: '#0B5B24' }}>
            This browser session doesn’t have a saved order receipt.
          </p>
          <button onClick={() => navigate('shop')} className="rounded-xl px-6 py-3 font-bold btn-gold">
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  const isWaitingApproval = order.status === 'WAITING_APPROVAL' || order.paymentStatus === 'WAITING_APPROVAL'
  const isRejected = order.status === 'PAYMENT_REJECTED' || order.paymentStatus === 'REJECTED'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-lg text-center">
        {isRejected ? (
          <div
            className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
            style={{ background: 'rgba(220,38,38,0.1)', border: '2px solid #DC2626', color: '#DC2626' }}
            aria-hidden="true"
          >
            !
          </div>
        ) : isWaitingApproval ? (
          <div
            className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full text-3xl animate-pulse"
            style={{ background: 'rgba(255,184,0,0.15)', border: '2px solid #FFB800', color: '#FF6A00' }}
            aria-hidden="true"
          >
            ⏳
          </div>
        ) : (
          <div
            className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
            style={{ background: 'rgba(23,215,25,0.1)', border: '2px solid #17D719', color: '#17D719' }}
            aria-hidden="true"
          >
            ✓
          </div>
        )}

        <div className="badge mb-3" style={{ color: isRejected ? '#DC2626' : isWaitingApproval ? '#FF6A00' : '#17D719' }}>
          {isRejected
            ? 'PAYMENT REJECTED'
            : isWaitingApproval
              ? 'WAITING FOR PAYMENT APPROVAL'
              : 'ORDER RECORDED'}
        </div>

        <h1 className="mb-3 text-3xl font-bold text-[#111111]">
          {isRejected
            ? 'Payment Verification Unsuccessful'
            : isWaitingApproval
              ? 'Payment Submitted · Waiting for Approval'
              : 'Order Successfully Placed!'}
        </h1>

        <p className="mb-6 leading-relaxed text-sm" style={{ color: '#111111' }}>
          {isRejected
            ? (order.paymentRejectionReason
                ? `Reason: ${order.paymentRejectionReason}. Please check your transaction ID and resubmit below.`
                : 'The submitted MTN MoMo transaction reference could not be verified by admin. You can try again below.')
            : isWaitingApproval
              ? `Order #${order.orderId} is registered. We have received your MTN payment submission and our admin desk is verifying it. Once approved, your order status changes to Paid and fulfillment begins.`
              : `Order #${order.orderId} is registered in the DubazaarMart system. Delivery preparation is underway.`}
        </p>

        {/* Retry Payment Form for Rejected Orders */}
        {isRejected && (
          <form onSubmit={handleRetryPayment} className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50/70 p-5 text-left space-y-3">
            <h3 className="text-sm font-bold text-red-950 flex items-center gap-1.5">
              <span>🔄</span> Retry MTN Payment Submission
            </h3>
            <p className="text-xs text-red-800 leading-relaxed">
              Ensure you have paid <strong>{formatPrice(order.total)}</strong> to MoMo code <strong>*182*8*1*0789545954#</strong> (or 0789545954) and enter the valid transaction ID from your MTN SMS:
            </p>
            <div>
              <label htmlFor="retry-txid" className="block text-xs font-bold text-gray-700 mb-1">
                New MTN MoMo Transaction ID
              </label>
              <input
                id="retry-txid"
                type="text"
                required
                value={retryTxId}
                onChange={(e) => setRetryTxId(e.target.value)}
                placeholder="e.g. 1928471038"
                className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 text-sm font-mono font-bold bg-white"
              />
            </div>
            {retryError && (
              <div className="text-xs text-red-700 bg-red-100 p-2.5 rounded-lg border border-red-200">
                {retryError}
              </div>
            )}
            {retrySuccess && (
              <div className="text-xs text-emerald-800 bg-emerald-100 p-2.5 rounded-lg border border-emerald-200">
                {retrySuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={retryLoading || !retryTxId.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#FF6A00] text-white hover:bg-[#E55A00] disabled:opacity-50"
            >
              {retryLoading ? 'Submitting…' : 'Resubmit Payment for Approval'}
            </button>
          </form>
        )}

        {/* Live Delivery Arrival Countdown */}
        {order && timeLeft && (
          <div className="mb-6 p-5 rounded-2xl border-2 border-[#FFB800] bg-[#FFF7E8] text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
                Delivery Countdown
              </span>
              {timeLeft.isOverdue ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white animate-pulse">
                  OVERDUE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#17D719]/20 text-[#0B5B24]">
                  ON SCHEDULE
                </span>
              )}
            </div>

            <div className="text-xs text-gray-700 mb-3">
              Target arrival:{' '}
              <strong className="text-black">
                {order.requestedDeliveryTime ? new Date(order.requestedDeliveryTime).toLocaleString('en-RW', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }) : 'Estimated within 48 hours of order placement'}
              </strong>
            </div>

            {timeLeft.isOverdue ? (
              <div className="p-3 rounded-xl bg-red-100/80 border border-red-300 text-red-800 text-xs font-medium">
                ⚠️ The requested arrival time has passed. Our delivery dispatch team is expediting your order right now.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded-xl p-2 border border-[#FFB800]/50 shadow-sm">
                  <div className="text-xl font-black text-[#FF6A00]">{timeLeft.days}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Days</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-[#FFB800]/50 shadow-sm">
                  <div className="text-xl font-black text-[#FF6A00]">{timeLeft.hours}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Hours</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-[#FFB800]/50 shadow-sm">
                  <div className="text-xl font-black text-[#FF6A00]">{timeLeft.minutes}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Mins</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-[#FFB800]/50 shadow-sm">
                  <div className="text-xl font-black text-[#FF6A00]">{timeLeft.seconds}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Secs</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 rounded-2xl border-2 p-5 text-left bg-white shadow-sm" style={{ borderColor: '#FFB800' }}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-gray-500">Order ID</div>
              <div className="mt-1 break-all font-mono text-sm font-bold text-[#FF6A00]">#{order?.orderId ?? 'Unavailable'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500">Order Type</div>
              <div className="mt-1 text-sm font-bold capitalize text-[#111111]">{order?.orderType ?? 'Shopping'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500">Fulfillment Status</div>
              <div className="mt-1 text-sm font-bold text-[#111111]">{order?.status.replace(/_/g, ' ') ?? 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500">Payment Status</div>
              <div className="mt-1 text-sm font-bold" style={{ color: isRejected ? '#DC2626' : isWaitingApproval ? '#FFB800' : '#10B981' }}>
                {isWaitingApproval ? 'WAITING APPROVAL' : (order?.paymentStatus ?? 'Unknown')}
              </div>
            </div>
            {order?.mtnTransactionId && (
              <div className="sm:col-span-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">MTN Transaction ID</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-amber-950 select-all">{order.mtnTransactionId}</div>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-gray-500">Placed Date</div>
              <div className="mt-1 text-sm font-semibold text-[#111111]">{placedAt ?? 'Unavailable'}</div>
            </div>
          </div>
          {order && (
            <div className="mt-4 border-t pt-3 flex justify-between text-sm font-bold" style={{ borderColor: '#FFB800' }}>
              <span>Total Payable</span>
              <span className="text-[#FF6A00] text-base">{formatPrice(order.total)}</span>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border p-4 text-left text-xs leading-5 bg-[#FFF7E8] border-[#FFB800] text-[#111111]">
          ℹ️ <strong>Payment verification:</strong> MTN MoMo payments are verified by our finance team. Once confirmed against merchant statement, your order status changes to <em>Paid → Pending dispatch</em>.
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('shop')} className="flex-1 rounded-xl py-3 font-bold btn-gold">
            Shop More Products →
          </button>
        </div>
      </div>
    </div>
  )
}
