"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "../components/ui/Toast"
import AcceptQuotationModal from "../components/AcceptQuotationModal"
import OrderThreadModal from "../components/OrderThreadModal"
import { createShippingRequest } from "../lib/dashboardApi"

export default function ShippingPage() {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<{ id: string; trackingNumber?: string } | null>(null)
  const [isAcceptQuoteOpen, setIsAcceptQuoteOpen] = useState(false)
  const [threadModalOrder, setThreadModalOrder] = useState<{ id: string; title: string } | null>(null)

  const [quoteForm, setQuoteForm] = useState({
    cargoDescription: "",
    weightOrSize: "",
    pickupAddress: "",
    deliveryAddress: "",
    freightType: "Air",
    fullName: "",
    phone: "",
    email: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !quoteForm.cargoDescription.trim() ||
      !quoteForm.pickupAddress.trim() ||
      !quoteForm.deliveryAddress.trim() ||
      !quoteForm.fullName.trim() ||
      !quoteForm.phone.trim()
    ) {
      toast.error("Please fill in all required fields.")
      return
    }

    try {
      setSubmitting(true)
      const res = await createShippingRequest({
        cargoDescription: quoteForm.cargoDescription.trim(),
        weightOrSize: quoteForm.weightOrSize.trim() || undefined,
        pickupAddress: quoteForm.pickupAddress.trim(),
        deliveryAddress: quoteForm.deliveryAddress.trim(),
        freightType: quoteForm.freightType as "Air" | "Sea",
        fullName: quoteForm.fullName.trim(),
        customerName: quoteForm.fullName.trim(),
        phone: quoteForm.phone.trim(),
        email: quoteForm.email.trim() || undefined,
      })

      setCreatedOrder({
        id: res.order.id,
      })
      toast.success(res.message || "Shipping request submitted! We will send you a quotation.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit shipping request.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setCreatedOrder(null)
    setQuoteForm({
      cargoDescription: "",
      weightOrSize: "",
      pickupAddress: "",
      deliveryAddress: "",
      freightType: "Air",
      fullName: "",
      phone: "",
      email: "",
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-14 px-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              Import &amp; Logistics
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A1F44] sm:text-4xl lg:text-5xl">
              Reliable Air &amp; Sea Freight <span className="text-[#FF6A00]">to Rwanda</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#475569]">
              Already purchased from a supplier in China, Dubai, or abroad? Ship through DubazaarMart with transparent rates, customs clearance handling, and door-to-door delivery across Rwanda.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#shipping-quote"
                className="rounded-full bg-[#FF6A00] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
              >
                Get a Shipping Quote →
              </a>
              <button
                type="button"
                onClick={() => setIsAcceptQuoteOpen(true)}
                className="rounded-full border-2 border-[#FF6A00] bg-[#FFF7E8] px-6 py-3 text-sm font-bold text-[#FF6A00] transition-colors hover:bg-[#FF6A00] hover:text-white"
              >
                💳 Accept Quotation & Pay MoMo
              </button>
              <Link
                href="/sourcing"
                className="rounded-full border border-[#0A1F44] px-7 py-3 text-sm font-bold text-[#0A1F44] transition-colors hover:bg-[#0A1F44] hover:text-white"
              >
                Need Sourcing Too?
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <Image
              src="/images/service-shipping.jpg"
              alt="International air and sea freight logistics"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Freight Modes */}
      <section className="py-14 px-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-[#0A1F44] sm:text-3xl">
              Flexible Freight Options
            </h2>
            <p className="mt-2 text-sm text-[#475569]">
              Choose speed with air cargo or cost-efficiency with sea freight.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
              <div className="mb-3 inline-block rounded-full bg-[#FF6A00]/10 px-3 py-1 text-xs font-bold text-[#FF6A00]">
                EXPRESS CARGO
              </div>
              <h3 className="text-xl font-bold text-[#0A1F44]">Air Freight (5–7 Business Days)</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Ideal for electronics, high-value parcels, urgent inventory restocks, and sample orders from China and Dubai straight to Kigali.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#0A1F44]">
                <li>• Weekly consolidated departures</li>
                <li>• Per-kilogram transparent pricing</li>
                <li>• Customs clearance and insurance assistance</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
              <div className="mb-3 inline-block rounded-full bg-[#0A1F44]/10 px-3 py-1 text-xs font-bold text-[#0A1F44]">
                BULK FREIGHT
              </div>
              <h3 className="text-xl font-bold text-[#0A1F44]">Sea Freight (30–45 Business Days)</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                The most cost-effective option for heavy machinery, construction items, raw materials, and high-volume container shipments.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#0A1F44]">
                <li>• LCL (Less than Container Load) &amp; FCL options</li>
                <li>• Safe warehousing in Guangzhou and Yiwu</li>
                <li>• Full transit tracking until Kigali delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="shipping-quote" className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-16 px-4 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              Instant Quote Request
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-[#0A1F44] sm:text-3xl">
              Request a Custom Freight Quotation
            </h2>
            <p className="mt-2 text-sm text-[#475569]">
              Provide cargo details and pickup/delivery points to receive a fast, transparent quote.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            {createdOrder ? (
              <div role="status" aria-live="polite" className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-[#0A1F44]">Shipping Request Received!</h3>
                <p className="mt-2 text-sm text-[#475569]">
                  Your shipping quote request has been registered under reference:
                </p>
                <div className="mt-3 inline-block rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-mono text-base font-bold text-[#FF6A00]">
                  #{createdOrder.id.slice(0, 8)}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Our logistics desk is reviewing your cargo details and will issue a detailed freight quote shortly.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setThreadModalOrder({ id: createdOrder.id, title: `Shipping Request #${createdOrder.id.slice(0, 8)}` })}
                    className="rounded-full bg-[#FF6A00] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#E55A00]"
                  >
                    💬 View Negotiation &amp; Quotation
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Request Another Quote
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="ship-cargo" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Description of the Goods <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="ship-cargo"
                    required
                    rows={3}
                    value={quoteForm.cargoDescription}
                    onChange={(e) => setQuoteForm({ ...quoteForm, cargoDescription: e.target.value })}
                    placeholder="Describe the items, type of goods, packaging (cartons/crates), contents..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="ship-weight" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Weight / Size (CBM or Dimensions)
                  </label>
                  <input
                    id="ship-weight"
                    value={quoteForm.weightOrSize}
                    onChange={(e) => setQuoteForm({ ...quoteForm, weightOrSize: e.target.value })}
                    placeholder="e.g. 25 kg, or 1.5 CBM (60x40x50 cm)"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="ship-mode" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Freight Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ship-mode"
                    value={quoteForm.freightType}
                    onChange={(e) => setQuoteForm({ ...quoteForm, freightType: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  >
                    <option value="Air">Air Freight (Express 5-7 days)</option>
                    <option value="Sea">Sea Freight (Bulk / CBM 30-45 days)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ship-origin" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Pickup Address (Origin) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ship-origin"
                    required
                    value={quoteForm.pickupAddress}
                    onChange={(e) => setQuoteForm({ ...quoteForm, pickupAddress: e.target.value })}
                    placeholder="e.g. Guangzhou Warehouse, China or Dubai Port"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="ship-dest" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Delivery Address (Destination in Rwanda) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ship-dest"
                    required
                    value={quoteForm.deliveryAddress}
                    onChange={(e) => setQuoteForm({ ...quoteForm, deliveryAddress: e.target.value })}
                    placeholder="e.g. Kigali, Remera, KG 11 Ave..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-[#E2E8F0] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] mb-3">
                    Customer Contact Details
                  </h4>
                </div>

                <div>
                  <label htmlFor="ship-name" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ship-name"
                    required
                    value={quoteForm.fullName}
                    onChange={(e) => setQuoteForm({ ...quoteForm, fullName: e.target.value })}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="ship-phone" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Phone / MTN Mobile Money <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ship-phone"
                    type="tel"
                    required
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    placeholder="e.g. 078XXXXXXX or +250 78..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="ship-email" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Email Address (Optional)
                  </label>
                  <input
                    id="ship-email"
                    type="email"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                    placeholder="yourname@example.com"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-[#FF6A00] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E55A00] disabled:opacity-60"
                  >
                    {submitting ? "Submitting Request…" : "Request Shipping Quote →"}
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
        serviceType="shipping"
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
