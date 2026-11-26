"use client"

import { useState } from "react"
import { acceptQuotationOrder } from "../lib/dashboardApi"
import { useAppNavigation } from "../lib/navigation"
import { useToast } from "./ui/Toast"

interface AcceptQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  serviceType: "sourcing" | "shipping"
  defaultQuotationRef?: string
}

const ORDER_RECEIPT_KEY = "dubazaar_order_receipt"

function formatPrice(n: number) {
  return `${n.toLocaleString()} RWF`
}

export default function AcceptQuotationModal({
  isOpen,
  onClose,
  serviceType,
  defaultQuotationRef = "",
}: AcceptQuotationModalProps) {
  const toast = useToast()
  const { navigate } = useAppNavigation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    quotationRef: defaultQuotationRef,
    fullName: "",
    phone: "",
    email: "",
    amount: "",
    deliveryAddress: "",
    mtnTransactionId: "",
  })

  if (!isOpen) return null

  const isSourcing = serviceType === "sourcing"
  const title = isSourcing ? "Accept Sourcing Quotation" : "Accept Shipping Quotation"
  const parsedAmount = Number(form.amount) || 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (parsedAmount <= 0) {
      setError("Please enter a valid quotation amount.")
      return
    }
    if (!form.mtnTransactionId.trim()) {
      setError("Please enter your MTN Mobile Money transaction ID.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await acceptQuotationOrder({
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        deliveryAddress: form.deliveryAddress.trim()
          ? { address: form.deliveryAddress.trim() }
          : undefined,
        quotationRef: form.quotationRef.trim(),
        orderType: serviceType,
        amount: parsedAmount,
        mtnTransactionId: form.mtnTransactionId.trim(),
        description: `Quotation accepted by customer for ${isSourcing ? "product sourcing" : "freight shipping"} (Ref: ${form.quotationRef.trim()}).`,
      })

      const receipt = {
        orderId: res.orderId,
        status: res.order?.status || "WAITING_APPROVAL",
        paymentStatus: res.order?.paymentStatus || "WAITING_APPROVAL",
        orderType: serviceType,
        mtnTransactionId: form.mtnTransactionId.trim(),
        subtotal: parsedAmount,
        deliveryFee: 0,
        total: parsedAmount,
        createdAt: new Date().toISOString(),
      }

      try {
        window.sessionStorage.setItem(ORDER_RECEIPT_KEY, JSON.stringify(receipt))
      } catch {
        // storage fallback
      }

      toast.success(
        `Quotation ${form.quotationRef} accepted! Status is now Waiting for payment approval.`,
        "Payment Recorded"
      )
      onClose()
      navigate("payment-success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept quotation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              {isSourcing ? "Product Sourcing" : "Cargo & Freight"}
            </div>
            <h2 className="text-xl font-bold text-[#0A1F44]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="quo-ref" className="block text-xs font-bold text-slate-700 mb-1">
                Quotation Reference <span className="text-red-500">*</span>
              </label>
              <input
                id="quo-ref"
                type="text"
                required
                value={form.quotationRef}
                onChange={(e) => setForm({ ...form, quotationRef: e.target.value })}
                placeholder={isSourcing ? "e.g. QUO-SRC-104" : "e.g. QUO-SHP-202"}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono font-bold uppercase focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              />
            </div>

            <div>
              <label htmlFor="quo-amount" className="block text-xs font-bold text-slate-700 mb-1">
                Quoted Amount (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                id="quo-amount"
                type="number"
                min="1"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 250000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="quo-name" className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="quo-name"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              />
            </div>

            <div>
              <label htmlFor="quo-phone" className="block text-xs font-bold text-slate-700 mb-1">
                Phone / MoMo Number <span className="text-red-500">*</span>
              </label>
              <input
                id="quo-phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+250 78X XXX XXX"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quo-email" className="block text-xs font-bold text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="quo-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
            />
          </div>

          <div>
            <label htmlFor="quo-address" className="block text-xs font-bold text-slate-700 mb-1">
              Delivery Destination / Address (optional)
            </label>
            <input
              id="quo-address"
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              placeholder="e.g. Kigali, Gasabo, Kimironko"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
            />
          </div>

          {/* MTN Payment Banner */}
          <div className="rounded-xl border-2 border-[#FFB800] bg-[#FFF7E8] p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB800] text-xs font-black text-black">
                M
              </span>
              <span className="text-xs font-bold text-[#111111]">
                MTN Mobile Money Payment Instructions
              </span>
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                Dial <strong className="font-mono text-[#FF6A00] text-sm">*182*8*1*0789545954#</strong> (or send to <strong>0789545954</strong> - DubazaarMart).
              </div>
              <div>
                Payable Amount: <strong className="text-black">{parsedAmount > 0 ? formatPrice(parsedAmount) : "Quoted Amount"}</strong>
              </div>
              <div>
                Enter your MTN MoMo PIN to complete the payment, then copy the <strong>Transaction ID</strong> from the SMS.
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="quo-txid" className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
              MTN MoMo Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              id="quo-txid"
              type="text"
              required
              value={form.mtnTransactionId}
              onChange={(e) => setForm({ ...form, mtnTransactionId: e.target.value })}
              placeholder="e.g. 1928471038"
              className="w-full rounded-xl border border-[#FFB800] bg-white px-3.5 py-2.5 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-[#FF6A00]"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Enter the exact transaction ID from the confirmation SMS you received.
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.mtnTransactionId.trim() || parsedAmount <= 0}
              className="flex-1 rounded-xl bg-[#FF6A00] py-3 text-sm font-bold text-white shadow-md hover:bg-[#E55A00] disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Accept & Submit Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
