"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "../components/ui/Toast"
import AcceptQuotationModal from "../components/AcceptQuotationModal"
import OrderThreadModal from "../components/OrderThreadModal"
import { createSourcingRequest } from "../lib/dashboardApi"

export default function SourcingPage() {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<{ id: string; trackingNumber?: string } | null>(null)
  const [isAcceptQuoteOpen, setIsAcceptQuoteOpen] = useState(false)
  const [threadModalOrder, setThreadModalOrder] = useState<{ id: string; title: string } | null>(null)

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    deliveryAddress: "",
    productName: "",
    photoOrLink: "",
    specifications: "",
    quantity: "1",
    targetBudget: "",
    freightType: "Air",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productName.trim() || !form.fullName.trim() || !form.phone.trim() || !form.deliveryAddress.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    try {
      setSubmitting(true)
      const res = await createSourcingRequest({
        productName: form.productName.trim(),
        photoOrLink: form.photoOrLink.trim() || undefined,
        specifications: form.specifications.trim() || undefined,
        quantity: parseInt(form.quantity, 10) || 1,
        targetBudget: form.targetBudget.trim() ? parseFloat(form.targetBudget.replace(/[^0-9.]/g, "")) || undefined : undefined,
        freightType: form.freightType as "Air" | "Sea",
        fullName: form.fullName.trim(),
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        deliveryAddress: form.deliveryAddress.trim(),
      })

      setCreatedOrder({
        id: res.order.id,
      })
      toast.success(res.message || "Sourcing request submitted! We will send you a quotation.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit sourcing request.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setCreatedOrder(null)
    setForm({
      fullName: "",
      phone: "",
      email: "",
      deliveryAddress: "",
      productName: "",
      photoOrLink: "",
      specifications: "",
      quantity: "1",
      targetBudget: "",
      freightType: "Air",
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-14 px-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              International Sourcing
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A1F44] sm:text-4xl lg:text-5xl">
              Source Verified Products From <span className="text-[#FF6A00]">Global Markets</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#475569]">
              Tell us the product you want. We search for the best supplier, buy it for you and ship it to you. Fill in the form and we will send you a quotation.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#sourcing-form"
                className="rounded-full bg-[#FF6A00] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
              >
                Request Product Sourcing →
              </a>
              <button
                type="button"
                onClick={() => setIsAcceptQuoteOpen(true)}
                className="rounded-full border-2 border-[#FF6A00] bg-[#FFF7E8] px-6 py-3 text-sm font-bold text-[#FF6A00] transition-colors hover:bg-[#FF6A00] hover:text-white"
              >
                💳 Accept Quotation & Pay MoMo
              </button>
              <Link
                href="/shop"
                className="rounded-full border border-[#0A1F44] px-7 py-3 text-sm font-bold text-[#0A1F44] transition-colors hover:bg-[#0A1F44] hover:text-white"
              >
                Browse Retail Catalog
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <Image
              src="/images/service-sourcing.jpg"
              alt="International product sourcing and quality inspection"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-14 px-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-[#0A1F44] sm:text-3xl">
              End-to-End Procurement Support
            </h2>
            <p className="mt-2 text-sm text-[#475569]">
              From supplier discovery to pre-shipment verification and doorstep delivery.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Supplier Verification",
                desc: "We vet factories and wholesale distributors to protect you from counterfeit or unreliable vendors.",
              },
              {
                title: "Price Negotiation",
                desc: "Access competitive factory-direct rates in China, Dubai, and global sourcing hubs.",
              },
              {
                title: "Quality Inspection",
                desc: "Physical product checks, spec verification, and photo/video confirmation before shipping.",
              },
              {
                title: "Seamless Logistics",
                desc: "Combine sourcing directly with our air or sea freight delivery to Kigali and nationwide.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6"
              >
                <div className="mb-3 h-2 w-10 rounded-full bg-[#FF6A00]" />
                <h3 className="text-base font-bold text-[#0A1F44]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section id="sourcing-form" className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-16 px-4 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              Sourcing Request
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-[#0A1F44] sm:text-3xl">
              Tell Us What You Want to Source
            </h2>
            <p className="mt-2 text-sm text-[#475569]">
              Tell us the product you want. We search for the best supplier, buy it for you and ship it to you. Fill in the form and we will send you a quotation.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            {createdOrder ? (
              <div role="status" aria-live="polite" className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-[#0A1F44]">Sourcing Request Received!</h3>
                <p className="mt-2 text-sm text-[#475569]">
                  Your request has been registered under reference:
                </p>
                <div className="mt-3 inline-block rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-mono text-base font-bold text-[#FF6A00]">
                  #{createdOrder.id.slice(0, 8)}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Our sourcing specialists will review your requirements, search for the best supplier, and send you a formal quotation with product cost, sourcing fee, and shipping breakdown.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setThreadModalOrder({ id: createdOrder.id, title: `Sourcing Request #${createdOrder.id.slice(0, 8)}` })}
                    className="rounded-full bg-[#FF6A00] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E55A00]"
                  >
                    💬 View Negotiation &amp; Quotation
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="src-product" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Product Name / Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="src-product"
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="e.g. Industrial sewing machine, iPhone 15 Pro, solar inverters..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="src-link" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Photo or Link (Optional)
                  </label>
                  <input
                    id="src-link"
                    value={form.photoOrLink}
                    onChange={(e) => setForm({ ...form, photoOrLink: e.target.value })}
                    placeholder="https://1688.com/... or image URL"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="src-qty" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="src-qty"
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="src-freight" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Freight Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="src-freight"
                    value={form.freightType}
                    onChange={(e) => setForm({ ...form, freightType: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  >
                    <option value="Air">Air Freight (Express 5-7 days)</option>
                    <option value="Sea">Sea Freight (Bulk 30-45 days)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="src-budget" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Target Budget (Optional)
                  </label>
                  <input
                    id="src-budget"
                    value={form.targetBudget}
                    onChange={(e) => setForm({ ...form, targetBudget: e.target.value })}
                    placeholder="e.g. USD 500 or RWF 650,000"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="src-specs" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Size / Color / Specifications
                  </label>
                  <textarea
                    id="src-specs"
                    rows={3}
                    value={form.specifications}
                    onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                    placeholder="Provide specific dimensions, materials, colors, voltage, or packaging requirements..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-[#E2E8F0] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] mb-3">
                    Customer Contact &amp; Delivery
                  </h4>
                </div>

                <div>
                  <label htmlFor="src-name" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="src-name"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="src-phone" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Phone / MTN Mobile Money <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="src-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 078XXXXXXX or +250 78..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="src-email" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Email Address (Optional)
                  </label>
                  <input
                    id="src-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="yourname@example.com"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="src-addr" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Delivery Address in Rwanda <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="src-addr"
                    required
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    placeholder="e.g. Kigali, Nyarugenge, KN 4 Ave..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-[#FF6A00] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E55A00] disabled:opacity-60"
                  >
                    {submitting ? "Submitting Request…" : "Submit Sourcing Request →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <AcceptQuotationModal
        isOpen={isAcceptQuoteOpen}
        onClose={() => setIsAcceptQuoteOpen(false)}
        serviceType="sourcing"
      />

      {threadModalOrder && (
        <OrderThreadModal
          orderId={threadModalOrder.id}
          orderTitle={threadModalOrder.title}
          isOpen={true}
          onClose={() => setThreadModalOrder(null)}
          isStaffMode={false}
        />
      )}
    </div>
  )
}
