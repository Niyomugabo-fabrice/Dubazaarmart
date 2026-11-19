"use client"

import { useEffect, useState } from "react"
import {
  updateAdminOrder,
  type AdminOrder,
  type UpdateAdminOrderPayload,
} from "../lib/dashboardApi"

interface Props {
  order: AdminOrder | null
  onClose: () => void
  onOrderSaved: (order: AdminOrder) => void
}

type OrderForm = UpdateAdminOrderPayload

const ORDER_STATUS_OPTIONS = [
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
]

const PAYMENT_STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]

function createForm(order: AdminOrder | null): OrderForm {
  const deliveryAddress: Record<string, string> = {}
  for (const [key, value] of Object.entries(order?.deliveryAddress ?? {})) {
    if (typeof value === "string") deliveryAddress[key] = value
  }

  for (const key of ["province", "district", "sector", "cell", "street", "instructions"]) {
    deliveryAddress[key] ??= ""
  }

  return {
    status: order?.status ?? "PENDING_PAYMENT",
    paymentStatus: order?.paymentStatus ?? "PENDING",
    deliveryAddress,
    adminNotes: order?.adminNotes ?? "",
  }
}

export default function EditAdminOrderModal({ order, onClose, onOrderSaved }: Props) {
  const [form, setForm] = useState<OrderForm>(() => createForm(order))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(createForm(order))
    setError(null)
  }, [order])

  if (!order) return null

  const statusOptions = ORDER_STATUS_OPTIONS.some((option) => option.value === order.status)
    ? ORDER_STATUS_OPTIONS
    : [
        {
          value: order.status,
          label: `Current status: ${order.status.replace(/_/g, " ")}`,
        },
        ...ORDER_STATUS_OPTIONS,
      ]

  const paymentOptions = PAYMENT_STATUS_OPTIONS.includes(order.paymentStatus)
    ? PAYMENT_STATUS_OPTIONS
    : [order.paymentStatus, ...PAYMENT_STATUS_OPTIONS]
  const orderId = order.id

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)
    try {
      const updated = await updateAdminOrder(orderId, form)
      onOrderSaved(updated)
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The order could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  function updateAddressField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      deliveryAddress: { ...current.deliveryAddress, [field]: value },
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-admin-order-title"
        onSubmit={handleSubmit}
        className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#FFB800] bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">Order management</div>
            <h2 id="edit-admin-order-title" className="mt-1 text-xl font-bold text-gray-900">
              Edit order #{order.id.slice(0, 8)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit order"
            className="rounded-lg px-2 py-1 text-2xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">
              Order status
              <select
                value={form.status}
                onChange={(event) => {
                  const status = event.target.value
                  setForm((current) => ({
                    ...current,
                    status,
                    paymentStatus: status === "CANCELLED" ? "CANCELLED" : current.paymentStatus,
                  }))
                }}
                disabled={order.status === "CANCELLED"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-semibold text-slate-700">
              Payment status
              <select
                value={form.paymentStatus}
                onChange={(event) => setForm((current) => ({ ...current, paymentStatus: event.target.value }))}
                disabled={form.status === "CANCELLED"}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
              >
                {paymentOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>

          <section aria-labelledby="edit-order-address-title">
            <h3 id="edit-order-address-title" className="mb-3 text-sm font-bold text-slate-900">Shipping address</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["province", "Province"],
                ["district", "District"],
                ["sector", "Sector"],
                ["cell", "Cell"],
                ["street", "Street / landmark"],
                ["instructions", "Delivery instructions"],
              ].map(([field, label]) => (
                <label key={field} className="space-y-1 text-xs font-semibold text-slate-600">
                  {label}
                  <input
                    value={form.deliveryAddress[field] ?? ""}
                    onChange={(event) => updateAddressField(field, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900"
                  />
                </label>
              ))}
            </div>
          </section>

          <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
            Admin notes
            <textarea
              value={form.adminNotes}
              onChange={(event) => setForm((current) => ({ ...current, adminNotes: event.target.value }))}
              rows={4}
              maxLength={5000}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900"
              placeholder="Internal notes about this order"
            />
          </label>

          {form.status === "CANCELLED" && order.status !== "CANCELLED" && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Cancelling this order restores its ordered items to available stock.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#FFB800] px-4 py-2 text-sm font-bold text-slate-950 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
