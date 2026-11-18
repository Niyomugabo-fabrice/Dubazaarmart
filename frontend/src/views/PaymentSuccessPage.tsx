"use client"

import { useState, useEffect } from 'react'
import type { CustomerOrderReceipt } from '../lib/dashboardApi'
import { useAppNavigation } from '../lib/navigation'

const ORDER_RECEIPT_KEY = 'dubazaar_order_receipt'

export default function PaymentSuccessPage() {
  const { navigate } = useAppNavigation()
  const [order, setOrder] = useState<CustomerOrderReceipt | null>(null)
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

  useEffect(() => {
    if (!order?.requestedDeliveryTime) return

    function calcTime() {
      const target = new Date(order!.requestedDeliveryTime!).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft({ days, hours, minutes, seconds, isOverdue: false })
    }

    calcTime()
    const timer = setInterval(calcTime, 1000)
    return () => clearInterval(timer)
  }, [order?.requestedDeliveryTime])

  const placedAt = order
    ? new Intl.DateTimeFormat('en-RW', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Kigali',
      }).format(new Date(order.createdAt))
    : null

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-lg text-center">
        <div
          className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
          style={{ background: 'rgba(23,215,25,0.1)', border: '2px solid #17D719', color: '#17D719' }}
          aria-hidden="true"
        >
          ✓
        </div>
        <div className="badge mb-3" style={{ color: '#FF6A00' }}>ORDER RECORDED</div>
        <h1 className="mb-3 text-3xl font-bold text-[#111111]">Order Successfully Placed!</h1>
        <p className="mb-6 leading-relaxed text-sm" style={{ color: '#111111' }}>
          {order
            ? `Order #${order.orderId} is registered in the DubazaarMart system. Delivery preparation is underway.`
            : 'Order details are not available in this session. Check with support before submitting again.'}
        </p>

        {/* Live Delivery Arrival Countdown */}
        {order?.requestedDeliveryTime && timeLeft && (
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
                {new Date(order.requestedDeliveryTime).toLocaleString('en-RW', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
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
              <div className="text-xs font-semibold text-gray-500">Fulfillment Status</div>
              <div className="mt-1 text-sm font-bold text-[#111111]">{order?.status.replace(/_/g, ' ') ?? 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500">Payment Status</div>
              <div className="mt-1 text-sm font-bold text-[#FFB800]">
                {order?.paymentStatus ?? 'Unknown'}
              </div>
            </div>
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
          ℹ️ <strong>Payment verification:</strong> Once your payment via MTN MoMo or Airtel Money is authorized, our admin confirms receipt and your status changes to <em>PAID</em>.
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
