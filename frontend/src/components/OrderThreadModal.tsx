"use client"

import { useEffect, useRef, useState } from "react"
import {
  fetchOrderThread,
  sendOrderMessage,
  createOrderQuotation,
  acceptOrderQuotationWithMtn,
  type OrderMessage,
  type OrderQuotation,
  type AdminOrder,
} from "../lib/dashboardApi"
import { useToast } from "./ui/Toast"

interface OrderThreadModalProps {
  orderId: string
  orderTitle?: string
  isOpen: boolean
  onClose: () => void
  isStaffMode?: boolean
  canManageQuotations?: boolean
  onOrderUpdated?: () => void
}

function formatPrice(n: number) {
  return `${n.toLocaleString()} RWF`
}

function getStatusBadge(status: string) {
  switch (status) {
    case "RECEIVED":
      return { label: "Received", bg: "bg-blue-100 text-blue-800 border-blue-200" }
    case "UNDER_NEGOTIATION":
      return { label: "Under Negotiation", bg: "bg-purple-100 text-purple-800 border-purple-200" }
    case "QUOTATION_SENT":
      return { label: "Quotation Sent", bg: "bg-amber-100 text-amber-800 border-amber-200" }
    case "WAITING_APPROVAL":
      return { label: "Waiting for Payment Approval", bg: "bg-amber-500 text-white border-amber-600" }
    case "PAID":
      return { label: "Paid", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" }
    case "PENDING":
      return { label: "Pending Fulfillment", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" }
    default:
      return { label: status.replace(/_/g, " "), bg: "bg-slate-100 text-slate-800 border-slate-200" }
  }
}

export default function OrderThreadModal({
  orderId,
  isOpen,
  onClose,
  isStaffMode = false,
  canManageQuotations = false,
  onOrderUpdated,
}: OrderThreadModalProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [messages, setMessages] = useState<OrderMessage[]>([])
  const [quotations, setQuotations] = useState<OrderQuotation[]>([])

  // Message input state
  const [newMsg, setNewMsg] = useState("")
  const [sendingMsg, setSendingMsg] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Quotation creation state (for staff)
  const [isQuoting, setIsQuoting] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    productCost: "",
    sourcingFee: "",
    shippingCost: "",
    notes: "",
  })
  const [quoteSubmitting, setQuoteSubmitting] = useState(false)

  // Accept Quotation & Pay MTN state (for customer)
  const [isPayingMtn, setIsPayingMtn] = useState(false)
  const [mtnTxId, setMtnTxId] = useState("")
  const [acceptingQuote, setAcceptingQuote] = useState(false)

  async function loadThread() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchOrderThread(orderId)
      setOrder(res.order)
      setMessages(res.messages)
      setQuotations(res.quotations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load thread.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && orderId) {
      loadThread()
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || sendingMsg) return
    setSendingMsg(true)
    try {
      const res = await sendOrderMessage(
        orderId,
        newMsg.trim(),
        isStaffMode ? undefined : order?.customerName || "Customer",
        isStaffMode ? "staff" : "customer"
      )
      setMessages((prev) => [...prev, res.message])
      setNewMsg("")
      if (order && order.status === "RECEIVED") {
        setOrder({ ...order, status: "UNDER_NEGOTIATION" })
      }
      onOrderUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message", "Error")
    } finally {
      setSendingMsg(false)
    }
  }

  async function handleCreateQuotation(e: React.FormEvent) {
    e.preventDefault()
    const pCost = Number(quoteForm.productCost) || 0
    const sFee = Number(quoteForm.sourcingFee) || 0
    const shCost = Number(quoteForm.shippingCost) || 0
    if (pCost < 0 || sFee < 0 || shCost < 0 || pCost + sFee + shCost <= 0) {
      toast.error("Please enter valid cost amounts.", "Invalid Quotation")
      return
    }

    setQuoteSubmitting(true)
    try {
      const res = await createOrderQuotation(orderId, {
        productCost: pCost,
        sourcingFee: sFee,
        shippingCost: shCost,
        notes: quoteForm.notes.trim() || undefined,
      })
      toast.success(`Quotation v${res.quotation.version} created and sent to customer!`, "Quotation Sent")
      setIsQuoting(false)
      setQuoteForm({ productCost: "", sourcingFee: "", shippingCost: "", notes: "" })
      await loadThread()
      onOrderUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create quotation", "Error")
    } finally {
      setQuoteSubmitting(false)
    }
  }

  async function handleAcceptQuotation(e: React.FormEvent) {
    e.preventDefault()
    if (!mtnTxId.trim()) {
      toast.error("Please enter the MTN MoMo transaction ID from your SMS.", "Transaction ID Required")
      return
    }

    setAcceptingQuote(true)
    try {
      const res = await acceptOrderQuotationWithMtn(orderId, mtnTxId.trim())
      toast.success(res.message, "Payment Submitted")
      setIsPayingMtn(false)
      setMtnTxId("")
      await loadThread()
      onOrderUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit payment", "Error")
    } finally {
      setAcceptingQuote(false)
    }
  }

  if (!isOpen) return null

  const latestPendingQuote = quotations.slice().reverse().find((q) => q.status === "PENDING")
  const activeQuote = latestPendingQuote || quotations[quotations.length - 1]
  const statusBadge = order ? getStatusBadge(order.status) : { label: "...", bg: "bg-slate-100" }
  const requestDetails = order?.requestDetails as Record<string, any> | undefined

  const calculatedTotal =
    (Number(quoteForm.productCost) || 0) +
    (Number(quoteForm.sourcingFee) || 0) +
    (Number(quoteForm.shippingCost) || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  #{orderId.slice(0, 8)}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadge.bg}`}
                >
                  {statusBadge.label}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-800">
                  {order?.orderType || "Order"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: <strong className="text-slate-800">{order?.customerName}</strong> ({order?.phone})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent mx-auto mb-2" />
            Loading negotiation thread & quotation history…
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p className="mb-2 font-bold">{error}</p>
            <button
              onClick={loadThread}
              className="rounded-lg bg-red-100 px-4 py-1.5 text-xs font-bold text-red-800"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: Details & Quotations (5 cols) */}
            <div className="lg:col-span-5 p-5 overflow-y-auto space-y-4 max-h-[70vh]">
              {/* Request Details Box */}
              {requestDetails && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs space-y-1.5">
                  <div className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">
                    Request Details
                  </div>
                  {order?.orderType === "sourcing" ? (
                    <>
                      <div>Product: <strong className="text-slate-900">{requestDetails.productName}</strong></div>
                      <div>Quantity: <strong>{requestDetails.quantity}</strong></div>
                      <div>Freight: <strong>{requestDetails.freightType}</strong></div>
                      {requestDetails.targetBudget && (
                        <div>Target Budget: <strong>{formatPrice(requestDetails.targetBudget)}</strong></div>
                      )}
                      {requestDetails.specifications && (
                        <div>Specs: <span className="text-slate-700">{requestDetails.specifications}</span></div>
                      )}
                      {requestDetails.photoOrLink && (
                        <div className="truncate">
                          Link/Photo:{" "}
                          <a href={requestDetails.photoOrLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            View Attachment
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>Cargo: <strong className="text-slate-900">{requestDetails.cargoDescription}</strong></div>
                      <div>Weight/Size: <strong>{requestDetails.weightOrSize}</strong></div>
                      <div>Pickup: <strong>{requestDetails.pickupAddress}</strong></div>
                      <div>Freight: <strong>{requestDetails.freightType}</strong></div>
                    </>
                  )}
                </div>
              )}

              {/* Quotations List Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Quotations ({quotations.length})
                  </h3>
                  {isStaffMode && canManageQuotations && !isQuoting && (
                    <button
                      type="button"
                      onClick={() => setIsQuoting(true)}
                      className="rounded-lg bg-[#FF6A00] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#E55A00]"
                    >
                      + New Quotation
                    </button>
                  )}
                </div>

                {/* Quotation Creation Form (Staff) */}
                {isQuoting && (
                  <form onSubmit={handleCreateQuotation} className="rounded-xl border border-[#FF6A00]/40 bg-[#FFF7E8] p-3 text-xs space-y-2">
                    <div className="font-bold text-slate-900 text-xs">
                      Prepare Quotation (v{quotations.length + 1})
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-0.5">Product Cost (RWF)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={quoteForm.productCost}
                        onChange={(e) => setQuoteForm({ ...quoteForm, productCost: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-0.5">Sourcing / Admin Fee (RWF)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={quoteForm.sourcingFee}
                        onChange={(e) => setQuoteForm({ ...quoteForm, sourcingFee: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-0.5">Freight &amp; Shipping Cost (RWF)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={quoteForm.shippingCost}
                        onChange={(e) => setQuoteForm({ ...quoteForm, shippingCost: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-0.5">Quotation Notes (optional)</label>
                      <textarea
                        rows={2}
                        value={quoteForm.notes}
                        onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        placeholder="e.g. Valid for 7 days, includes customs clearance..."
                      />
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-[#FFB800] flex justify-between font-bold">
                      <span>Total Quotation:</span>
                      <span className="text-[#FF6A00]">{formatPrice(calculatedTotal)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsQuoting(false)}
                        className="flex-1 rounded-lg border border-slate-300 py-1.5 font-bold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={quoteSubmitting || calculatedTotal <= 0}
                        className="flex-1 rounded-lg bg-[#FF6A00] py-1.5 font-bold text-white hover:bg-[#E55A00] disabled:opacity-50"
                      >
                        {quoteSubmitting ? "Sending…" : "Send Quotation"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Quotations List */}
                {quotations.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No quotation generated yet. Staff will review the request and generate a formal quotation.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {quotations.map((q) => {
                      const isPending = q.status === "PENDING"
                      const isAccepted = q.status === "ACCEPTED"

                      return (
                        <div
                          key={q.id}
                          className={`rounded-xl border p-3 text-xs space-y-1.5 transition-all ${
                            isAccepted
                              ? "border-emerald-300 bg-emerald-50/60"
                              : isPending
                                ? "border-amber-300 bg-amber-50/50 shadow-xs"
                                : "border-slate-200 bg-slate-50/50 opacity-70"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900 font-mono">Quotation v{q.version}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                                isAccepted
                                  ? "bg-emerald-600 text-white"
                                  : isPending
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 py-1 text-[11px] border-y border-slate-200/60 text-slate-600">
                            <div>
                              <span>Product:</span>
                              <div className="font-bold text-slate-900">{formatPrice(q.productCost)}</div>
                            </div>
                            <div>
                              <span>Sourcing:</span>
                              <div className="font-bold text-slate-900">{formatPrice(q.sourcingFee)}</div>
                            </div>
                            <div>
                              <span>Shipping:</span>
                              <div className="font-bold text-slate-900">{formatPrice(q.shippingCost)}</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-0.5">
                            <span className="font-bold text-slate-700">Total Quoted:</span>
                            <span className="font-bold text-sm text-[#FF6A00]">{formatPrice(q.totalAmount)}</span>
                          </div>

                          {q.notes && (
                            <p className="text-[11px] text-slate-600 italic">Notes: {q.notes}</p>
                          )}

                          <div className="text-[10px] text-slate-400">
                            By {q.createdBy} on {new Date(q.createdAt).toLocaleDateString("en-RW")}
                          </div>

                          {/* Customer Accept & Pay Button */}
                          {!isStaffMode && isPending && (
                            <div className="pt-2">
                              {!isPayingMtn ? (
                                <button
                                  type="button"
                                  onClick={() => setIsPayingMtn(true)}
                                  className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                                >
                                  ✓ Accept Quotation &amp; Pay with MTN MoMo
                                </button>
                              ) : (
                                <form onSubmit={handleAcceptQuotation} className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2 mt-2">
                                  <div className="font-bold text-emerald-950">
                                    Pay via MTN MoMo
                                  </div>
                                  <div className="text-[11px] text-slate-600 space-y-0.5">
                                    <div>Dial: <strong className="font-mono text-[#FF6A00]">*182*8*1*0789545954#</strong></div>
                                    <div>Amount: <strong className="text-black">{formatPrice(q.totalAmount)}</strong></div>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                      MTN Transaction ID (from SMS):
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={mtnTxId}
                                      onChange={(e) => setMtnTxId(e.target.value)}
                                      placeholder="e.g. 1928471038"
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setIsPayingMtn(false)}
                                      className="flex-1 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={acceptingQuote || !mtnTxId.trim()}
                                      className="flex-1 py-1.5 bg-emerald-600 rounded-lg text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      {acceptingQuote ? "Submitting…" : "Confirm Payment"}
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Negotiation Message Thread (7 cols) */}
            <div className="lg:col-span-7 flex flex-col h-[70vh]">
              <div className="p-3.5 border-b bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>💬 Negotiation &amp; Message Thread</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {messages.length} message{messages.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No messages in this negotiation thread yet. Send a message below to start chatting.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSystem = m.senderType === "system"
                    const isStaff = m.senderType === "staff"
                    const isCustomer = m.senderType === "customer"

                    if (isSystem) {
                      return (
                        <div key={m.id} className="text-center my-2">
                          <span className="inline-block px-3 py-1.5 rounded-full text-[11px] bg-slate-200/80 text-slate-700 border border-slate-300/50">
                            ℹ️ {m.message}
                          </span>
                        </div>
                      )
                    }

                    const isSelf = isStaffMode ? isStaff : isCustomer

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div className="text-[10px] text-slate-500 mb-0.5 px-1 font-semibold flex items-center gap-1">
                          <span>{m.senderName}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">
                            ({m.senderType})
                          </span>
                          <span>·</span>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                            isSelf
                              ? "bg-[#FF6A00] text-white rounded-br-xs"
                              : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                              {m.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={att}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] underline block truncate opacity-90 hover:opacity-100"
                                >
                                  📎 Attachment {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder={
                    isStaffMode
                      ? "Reply to customer regarding specs, quotation, or logistics..."
                      : "Type your question or response to Dubazaar team..."
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !newMsg.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#0A1F44] text-white text-xs font-bold hover:bg-[#06142E] disabled:opacity-50 transition-colors"
                >
                  {sendingMsg ? "Sending…" : "Send"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
