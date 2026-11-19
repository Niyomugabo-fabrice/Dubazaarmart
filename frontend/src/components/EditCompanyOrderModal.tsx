"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  updateCompanyOrder,
  type CompanyOrder,
  type UpdateCompanyOrderPayload,
} from "../lib/dashboardApi"

interface Props {
  po: CompanyOrder | null
  onClose: () => void
  onOrderSaved: (order: CompanyOrder) => void
}

type EditableItem = UpdateCompanyOrderPayload["items"][number] & {
  quantityReceived: number
}

const ORDER_STATUSES: CompanyOrder["status"][] = [
  "ORDERED",
  "SHIPPED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]

const PAYMENT_STATUSES: CompanyOrder["paymentStatus"][] = ["PENDING", "PAID", "PARTIAL"]

function toLocalDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export default function EditCompanyOrderModal({ po, onClose, onOrderSaved }: Props) {
  const [supplierName, setSupplierName] = useState("")
  const [supplierContact, setSupplierContact] = useState("")
  const [shippingCompany, setShippingCompany] = useState("")
  const [expectedArrival, setExpectedArrival] = useState("")
  const [shippingCost, setShippingCost] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)
  const [status, setStatus] = useState<CompanyOrder["status"]>("ORDERED")
  const [paymentStatus, setPaymentStatus] = useState<CompanyOrder["paymentStatus"]>("PENDING")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<EditableItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!po) return
    setSupplierName(po.supplierName)
    setSupplierContact(po.supplierContact)
    setShippingCompany(po.shippingCompany)
    setExpectedArrival(toLocalDateTime(po.expectedArrival))
    setShippingCost(po.shippingCost)
    setOtherCharges(po.otherCharges)
    setStatus(po.status)
    setPaymentStatus(po.paymentStatus)
    setNotes(po.notes)
    setItems(po.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      category: item.category,
      unitPrice: item.unitPrice,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
    })))
    setError(null)
  }, [po])

  if (!po) return null

  const productsTotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantityOrdered,
    0,
  )
  const total = productsTotal + shippingCost + otherCharges

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )))
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { productName: "", category: "electronics", unitPrice: 0, quantityOrdered: 1, quantityReceived: 0 },
    ])
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!po) return
    if (!supplierName.trim()) {
      setError("Supplier name is required.")
      return
    }
    if (!expectedArrival || Number.isNaN(new Date(expectedArrival).getTime())) {
      setError("Expected arrival date is required.")
      return
    }
    if (items.length === 0 || items.some((item) =>
      !item.productName.trim() || !Number.isInteger(item.quantityOrdered) || item.quantityOrdered < 1
    )) {
      setError("Add at least one product with a name and a positive quantity.")
      return
    }

    try {
      setSaving(true)
      setError(null)
      const saved = await updateCompanyOrder(po.id, {
        supplierName: supplierName.trim(),
        supplierContact: supplierContact.trim(),
        shippingCompany: shippingCompany.trim(),
        expectedArrival: new Date(expectedArrival).toISOString(),
        shippingCost,
        otherCharges,
        status,
        paymentStatus,
        notes: notes.trim(),
        items: items.map((item) => ({
          id: item.id,
          productName: item.productName.trim(),
          category: item.category.trim(),
          unitPrice: item.unitPrice,
          quantityOrdered: item.quantityOrdered,
        })),
      })
      onOrderSaved(saved)
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The purchase order could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-company-order-title"
        className="my-8 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#FFB800] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <div className="font-mono text-xs font-bold text-[#FF6A00]">{po.poNumber}</div>
            <h2 id="edit-company-order-title" className="mt-1 text-xl font-bold text-gray-900">
              Edit Purchase Order
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-2xl font-bold text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-gray-700">
              Supplier *
              <input
                required
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-bold text-gray-700">
              Supplier contact
              <input
                value={supplierContact}
                onChange={(event) => setSupplierContact(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-bold text-gray-700">
              Shipping company
              <input
                value={shippingCompany}
                onChange={(event) => setShippingCompany(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-bold text-gray-700">
              Expected arrival
              <input
                required
                type="datetime-local"
                value={expectedArrival}
                onChange={(event) => setExpectedArrival(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-bold text-gray-700">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as CompanyOrder["status"])}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
              >
                {ORDER_STATUSES.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-gray-700">
              Payment status
              <select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value as CompanyOrder["paymentStatus"])}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
              >
                {PAYMENT_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Items</h3>
              <button type="button" onClick={addItem} className="rounded-lg bg-[#FF6A00]/10 px-3 py-1.5 text-xs font-bold text-[#FF6A00]">
                + Add item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = item.unitPrice * item.quantityOrdered
                return (
                  <div key={item.id ?? `new-${index}`} className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-12">
                    <label className="text-[11px] font-bold text-gray-600 sm:col-span-5">
                      Product
                      <input
                        required
                        value={item.productName}
                        disabled={item.quantityReceived > 0}
                        onChange={(event) => updateItem(index, { productName: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-normal disabled:bg-gray-100"
                      />
                    </label>
                    <label className="text-[11px] font-bold text-gray-600 sm:col-span-2">
                      Category
                      <input
                        value={item.category}
                        onChange={(event) => updateItem(index, { category: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs font-normal"
                      />
                    </label>
                    <label className="text-[11px] font-bold text-gray-600 sm:col-span-2">
                      Unit price ($)
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) || 0 })}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs font-normal"
                      />
                    </label>
                    <label className="text-[11px] font-bold text-gray-600 sm:col-span-1">
                      Qty
                      <input
                        required
                        type="number"
                        min={Math.max(1, item.quantityReceived)}
                        step="1"
                        value={item.quantityOrdered}
                        onChange={(event) => updateItem(index, { quantityOrdered: Number(event.target.value) || 0 })}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs font-normal"
                      />
                    </label>
                    <div className="flex items-end justify-between gap-2 sm:col-span-2">
                      <div className="pb-2 text-xs font-bold text-[#FF6A00]">${lineTotal.toFixed(2)}</div>
                      {item.quantityReceived > 0 ? (
                        <span className="pb-2 text-[10px] text-gray-500" title="Received items cannot be removed or renamed.">
                          Received: {item.quantityReceived}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="mb-1 rounded px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          aria-label={`Remove ${item.productName || "item"}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Shipping cost (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCost}
                  onChange={(event) => setShippingCost(Number(event.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-xs font-bold text-gray-700">
                Other charges (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherCharges}
                  onChange={(event) => setOtherCharges(Number(event.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-[#FFB800] bg-[#FFF7E8] p-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span>Items</span><strong>${productsTotal.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>Shipping</span><strong>${shippingCost.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>Other charges</span><strong>${otherCharges.toFixed(2)}</strong></div>
              </div>
              <div className="mt-3 flex justify-between border-t border-[#FFB800] pt-3 text-sm font-bold">
                <span>Total</span><span className="text-[#FF6A00]">${total.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          <label className="block text-xs font-bold text-gray-700">
            Notes
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-gold rounded-xl px-6 py-2.5 text-xs font-bold disabled:opacity-60">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
