"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "../components/ui/Toast"

export default function SourcingPage() {
  const toast = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    productName: "",
    quantity: "",
    market: "China",
    targetBudget: "",
    details: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    toast.success("Sourcing request submitted! Our procurement team will contact you shortly.")
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
              Tell us what you need. DubazaarMart identifies vetted manufacturers and suppliers across China, Dubai, and international trade hubs, negotiates factory-direct pricing, and inspects quality before dispatch to Rwanda.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#sourcing-form"
                className="rounded-full bg-[#FF6A00] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
              >
                Request Product Sourcing →
              </a>
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
              From supplier discovery to pre-shipment verification.
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
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div role="status" aria-live="polite" className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A00]/10 text-2xl text-[#FF6A00]">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-[#0A1F44]">Sourcing Request Received</h3>
                <p className="mt-2 text-sm text-[#475569]">
                  Our sourcing specialists will review your requirements and get back to you with verified supplier quotes.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-full bg-[#FF6A00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E55A00]"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="src-name" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Full Name
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
                    Phone / WhatsApp
                  </label>
                  <input
                    id="src-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+250 78..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="src-product" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Product Name or Link
                  </label>
                  <input
                    id="src-product"
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="e.g. Solar inverters, iPhone 15 Pro, packaging..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="src-qty" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Estimated Quantity
                  </label>
                  <input
                    id="src-qty"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 50 units"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="src-market" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Preferred Source Market
                  </label>
                  <select
                    id="src-market"
                    value={form.market}
                    onChange={(e) => setForm({ ...form, market: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  >
                    <option value="China">China</option>
                    <option value="Dubai">Dubai (UAE)</option>
                    <option value="Any Global Supplier">Best Global Supplier</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="src-budget" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Target Unit Budget (Optional)
                  </label>
                  <input
                    id="src-budget"
                    value={form.targetBudget}
                    onChange={(e) => setForm({ ...form, targetBudget: e.target.value })}
                    placeholder="e.g. RWF 150,000 or USD 120"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="src-details" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Specifications &amp; Notes
                  </label>
                  <textarea
                    id="src-details"
                    rows={4}
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                    placeholder="Share brand, model, colors, packaging, or delivery timeline..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#FF6A00] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
                  >
                    Submit Sourcing Request →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
