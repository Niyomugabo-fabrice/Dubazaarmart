"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import ProductCard from "../components/ProductCard"
import { useProducts } from "../store/productsStore"
import { useToast } from "../components/ui/Toast"

export default function WholesalePage() {
  const toast = useToast()
  const { products, loading } = useProducts()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    category: "Smartphones & Electronics",
    quantity: "",
    notes: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
    toast.success("Wholesale inquiry submitted! Our B2B desk will send tiered pricing.")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-14 px-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              Wholesale &amp; Distribution
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A1F44] sm:text-4xl lg:text-5xl">
              Buy in Bulk With <span className="text-[#FF6A00]">Flexible MOQ</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#475569]">
              Equip your retail store or business in Rwanda with genuine electronics and commercial goods at quantity-based wholesale pricing, backed by reliable restocking and local support.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#wholesale-inquiry"
                className="rounded-full bg-[#FF6A00] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
              >
                Request Bulk Pricing →
              </a>
              <Link
                href="/shop"
                className="rounded-full border border-[#0A1F44] px-7 py-3 text-sm font-bold text-[#0A1F44] transition-colors hover:bg-[#0A1F44] hover:text-white"
              >
                Shop Retail Catalog
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <Image
              src="/images/service-wholesale.jpg"
              alt="Wholesale distribution warehouse"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 px-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Flexible Minimum Orders",
                desc: "Start with manageable MOQs tailored to growing Rwandan retailers and resellers.",
              },
              {
                title: "Quantity-Based Pricing",
                desc: "Unlock deeper unit discounts as your order volume scales across cartons and pallets.",
              },
              {
                title: "Consistent Supply Chain",
                desc: "Direct Dubai & China replenishment schedules so your bestsellers stay in stock.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6"
              >
                <div className="mb-3 h-2 w-10 rounded-full bg-[#FF6A00]" />
                <h3 className="text-lg font-bold text-[#0A1F44]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Catalog Preview */}
      {!loading && products.length > 0 && (
        <section className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-14 px-4 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
                  Available Stock
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-[#0A1F44]">
                  Popular Wholesale &amp; Retail Lines
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-bold text-[#FF6A00] hover:underline"
              >
                View Full Catalog →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bulk Inquiry Form */}
      <section id="wholesale-inquiry" className="border-t border-[#E2E8F0] bg-white py-16 px-4 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              B2B Wholesale Desk
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-[#0A1F44] sm:text-3xl">
              Request Wholesale &amp; Bulk Quote
            </h2>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 sm:p-8">
            {sent ? (
              <div role="status" aria-live="polite" className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A00]/10 text-2xl text-[#FF6A00]">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-[#0A1F44]">Wholesale Inquiry Sent</h3>
                <p className="mt-2 text-sm text-[#475569]">
                  Our B2B distribution team will contact you with volume pricing and stock availability.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 rounded-full bg-[#FF6A00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E55A00]"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="wh-biz" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Business / Store Name
                  </label>
                  <input
                    id="wh-biz"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Your company name"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label htmlFor="wh-contact" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Contact Person
                  </label>
                  <input
                    id="wh-contact"
                    required
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label htmlFor="wh-phone" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="wh-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+250 78..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label htmlFor="wh-qty" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Estimated Order Quantity
                  </label>
                  <input
                    id="wh-qty"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 20+ units or 5 cartons"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="wh-notes" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Products &amp; Requirements
                  </label>
                  <textarea
                    id="wh-notes"
                    required
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="List the products, brands, or categories you want wholesale pricing for..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#FF6A00] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
                  >
                    Submit Wholesale Inquiry →
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
