"use client"

import { useEffect, useState } from "react"
import {
  fetchPaymentApprovals,
  approvePayment,
  rejectPayment,
  type AdminOrder,
} from "../../lib/dashboardApi"
import { useToast } from "../../components/ui/Toast"

interface PaymentApprovalsPanelProps {
  onPaymentProcessed?: () => void
}

const REJECTION_PRESETS = [
  "Transaction ID not found in MTN statement",
  "Amount received does not match order total",
  "Duplicate or already used transaction ID",
  "Payment sent to wrong recipient / merchant",
]

function formatPrice(n: number) {
  return `${n.toLocaleString()} RWF`
}

function getOrderTypeBadge(orderType?: string) {
  const type = (orderType || "shopping").toLowerCase()
  if (type === "wholesale") {
    return { label: "Wholesale", bg: "bg-purple-100 text-purple-800 border-purple-200" }
  }
  if (type === "sourcing") {
    return { label: "Sourcing Quote", bg: "bg-amber-100 text-amber-800 border-amber-200" }
  }
  if (type === "shipping") {
    return { label: "Shipping Quote", bg: "bg-teal-100 text-teal-800 border-teal-200" }
  }
  return { label: "Shopping (Retail)", bg: "bg-blue-100 text-blue-800 border-blue-200" }
}

export default function PaymentApprovalsPanel({ onPaymentProcessed }: PaymentApprovalsPanelProps) {
  const toast = useToast()
  const [approvals, setApprovals] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null)

  // Rejection modal state
  const [orderToReject, setOrderToReject] = useState<AdminOrder | null>(null)
  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESETS[0])
  const [customReason, setCustomReason] = useState("")

  async function loadApprovals() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchPaymentApprovals()
      setApprovals(res.approvals)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment approvals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApprovals()
  }, [])

  async function handleApprove(order: AdminOrder) {
    if (actionLoadingId) return
    setActionLoadingId(order.id)
    try {
      await approvePayment(order.id)
      toast.success(
        `Payment for Order #${order.id.slice(0, 8)} approved! Order status is now Paid → Pending dispatch.`,
        "Payment Approved"
      )
      setApprovals((prev) => prev.filter((o) => o.id !== order.id))
      onPaymentProcessed?.()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve payment",
        "Approval Failed"
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleConfirmReject() {
    if (!orderToReject || actionLoadingId) return
    const finalReason = customReason.trim() ? customReason.trim() : rejectionReason
    setActionLoadingId(orderToReject.id)
    try {
      await rejectPayment(orderToReject.id, finalReason)
      toast.success(
        `Payment for Order #${orderToReject.id.slice(0, 8)} rejected. Customer will be notified to retry.`,
        "Payment Rejected"
      )
      setApprovals((prev) => prev.filter((o) => o.id !== orderToReject.id))
      setOrderToReject(null)
      setCustomReason("")
      onPaymentProcessed?.()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject payment",
        "Rejection Failed"
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedTxId(text)
    setTimeout(() => setCopiedTxId(null), 2500)
    toast.success("Transaction ID copied to clipboard", "Copied")
  }

  const filtered = approvals.filter((item) => {
    const term = search.toLowerCase()
    return (
      item.id.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      (item.phone && item.phone.toLowerCase().includes(term)) ||
      (item.mtnTransactionId && item.mtnTransactionId.toLowerCase().includes(term)) ||
      (item.orderType && item.orderType.toLowerCase().includes(term))
    )
  })

  const totalPendingAmount = approvals.reduce((sum, item) => sum + (item.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="badge mb-2" style={{ color: "#FF6A00" }}>
            FINANCE & VERIFICATION
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
            Payment Approvals
          </h1>
          <p className="mt-2 text-sm text-[#0B5B24]">
            Review, verify, and approve incoming MTN Mobile Money customer payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadApprovals}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh List
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Pending Payment Approvals
          </div>
          <div className="mt-2 text-3xl font-black text-amber-950">
            {approvals.length}
          </div>
          <p className="mt-1 text-xs text-amber-700">Orders awaiting MTN transaction verification</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Total Pending Value
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-950">
            {formatPrice(totalPendingAmount)}
          </div>
          <p className="mt-1 text-xs text-emerald-700">Value of payments awaiting approval</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Merchant MoMo Account
          </div>
          <div className="mt-2 font-mono text-lg font-black text-[#FF6A00] select-all">
            *182*8*1*0789545954#
          </div>
          <p className="mt-1 text-xs text-slate-600">Merchant: DubazaarMart (+250 789 545 954)</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, customer, phone, or MTN transaction ID…"
          className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#111111] shadow-sm focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 flex justify-between items-center">
          <span>Failed to load approvals: {error}</span>
          <button
            type="button"
            onClick={loadApprovals}
            className="rounded-lg bg-red-200 px-3 py-1 font-bold text-red-900 hover:bg-red-300 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Approvals Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Order / Ref</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">MTN Transaction ID</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    <span>Loading payment approvals…</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                    ✓
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {search ? "No matching pending approvals" : "All payments verified!"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    {search
                      ? "Try adjusting your search terms to find the order."
                      : "There are currently no MTN Mobile Money payments awaiting admin approval."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((order) => {
                const badge = getOrderTypeBadge(order.orderType)
                const isProcessing = actionLoadingId === order.id

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      #{order.id.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-700">
                      {order.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span>{order.phone}</span>
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            title="Chat on WhatsApp"
                          >
                            💬
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#FF6A00]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.mtnTransactionId ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1">
                          <span className="font-mono text-xs font-bold text-amber-950 select-all">
                            {order.mtnTransactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.mtnTransactionId!)}
                            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold"
                            title="Copy Transaction ID"
                          >
                            {copiedTxId === order.mtnTransactionId ? "✓" : "📋"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Not provided</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Intl.DateTimeFormat("en-RW", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Africa/Kigali",
                      }).format(new Date(order.createdAt))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(order)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isProcessing ? "Approving…" : "✓ Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setOrderToReject(order)
                            setRejectionReason(REJECTION_PRESETS[0])
                            setCustomReason("")
                          }}
                          className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Reject Payment · Order #{orderToReject.id.slice(0, 8)}
              </h3>
              <button
                type="button"
                onClick={() => setOrderToReject(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 text-xs text-slate-600 space-y-1">
              <div>Customer: <strong>{orderToReject.customerName}</strong> ({orderToReject.phone})</div>
              <div>Amount: <strong className="text-[#FF6A00]">{formatPrice(orderToReject.total)}</strong></div>
              <div>Submitted MTN Ref: <strong className="font-mono">{orderToReject.mtnTransactionId || "None"}</strong></div>
            </div>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-slate-700">
                Select Rejection Reason:
              </label>
              {REJECTION_PRESETS.map((preset) => (
                <label
                  key={preset}
                  className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="rejectionPreset"
                    checked={rejectionReason === preset}
                    onChange={() => setRejectionReason(preset)}
                  />
                  <span>{preset}</span>
                </label>
              ))}

              <div>
                <label htmlFor="custom-reject-reason" className="block text-xs font-bold text-slate-700 mb-1">
                  Or Custom Reason:
                </label>
                <textarea
                  id="custom-reject-reason"
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Optional details for the customer…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderToReject(null)}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(actionLoadingId)}
                onClick={handleConfirmReject}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoadingId ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
