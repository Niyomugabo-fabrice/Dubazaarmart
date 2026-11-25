"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "../components/ui/Toast"

export default function ShippingPage() {
  const toast = useToast()
  const [quoteSent, setQuoteSent] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    fullName: "",
    phone: "",
    freightType: "Air Freight",
    shipFrom: "China",
    cargoDescription: "",
    weightOrVolume: "",
    deliveryLocation: "Kigali",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setQuoteSent(true)
    toast.success("Shipping quote request received! Our logistics desk will reach out shortly.")
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
                <li>• Customs clearance &amp; Kigali pickup or delivery</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
              <div className="mb-3 inline-block rounded-full bg-[#0A1F44]/10 px-3 py-1 text-xs font-bold text-[#0A1F44]">
                BULK &amp; CONTAINER
              </div>
              <h3 className="text-xl font-bold text-[#0A1F44]">Sea Freight (25–35 Days)</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Designed for wholesale shipments, heavy equipment, and large-volume commercial cargo via Mombasa / Dar es Salaam corridors into Rwanda.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#0A1F44]">
                <li>• LCL (shared container) &amp; FCL (full container)</li>
                <li>• Volume-based CBM pricing</li>
                <li>• End-to-end documentation &amp; tracking</li>
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
              Shipping Request
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-[#0A1F44] sm:text-3xl">
              Get a Shipping Quote
            </h2>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            {quoteSent ? (
              <div role="status" aria-live="polite" className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6A00]/10 text-2xl text-[#FF6A00]">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-[#0A1F44]">Shipping Request Received</h3>
                <p className="mt-2 text-sm text-[#475569]">
                  Our logistics team will contact you shortly with freight rates and warehouse drop-off instructions.
                </p>
                <button
                  type="button"
                  onClick={() => setQuoteSent(false)}
                  className="mt-6 rounded-full bg-[#FF6A00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E55A00]"
                >
                  Request Another Quote
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="ship-name" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Full Name
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
                    Phone / WhatsApp
                  </label>
                  <input
                    id="ship-phone"
                    type="tel"
                    required
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    placeholder="+250 78..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="ship-mode" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Freight Mode
                  </label>
                  <select
                    id="ship-mode"
                    value={quoteForm.freightType}
                    onChange={(e) => setQuoteForm({ ...quoteForm, freightType: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  >
                    <option value="Air Freight">Air Freight (Express)</option>
                    <option value="Sea Freight">Sea Freight (Bulk / CBM)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ship-origin" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Ship From
                  </label>
                  <select
                    id="ship-origin"
                    value={quoteForm.shipFrom}
                    onChange={(e) => setQuoteForm({ ...quoteForm, shipFrom: e.target.value })}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  >
                    <option value="China">China</option>
                    <option value="Dubai">Dubai (UAE)</option>
                    <option value="Other">Other International Origin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ship-weight" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Estimated Weight or Volume
                  </label>
                  <input
                    id="ship-weight"
                    value={quoteForm.weightOrVolume}
                    onChange={(e) => setQuoteForm({ ...quoteForm, weightOrVolume: e.target.value })}
                    placeholder="e.g. 15 kg or 2 CBM"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="ship-dest" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Delivery Location in Rwanda
                  </label>
                  <input
                    id="ship-dest"
                    required
                    value={quoteForm.deliveryLocation}
                    onChange={(e) => setQuoteForm({ ...quoteForm, deliveryLocation: e.target.value })}
                    placeholder="Kigali, Musanze, Rubavu..."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ship-cargo" className="mb-1.5 block text-xs font-semibold text-[#0A1F44]">
                    Cargo Description
                  </label>
                  <textarea
                    id="ship-cargo"
                    required
                    rows={4}
                    value={quoteForm.cargoDescription}
                    onChange={(e) => setQuoteForm({ ...quoteForm, cargoDescription: e.target.value })}
                    placeholder="Describe items, carton count, or paste supplier invoice/link..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0A1F44] focus:border-[#FF6A00] focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#FF6A00] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E55A00]"
                  >
                    Request Shipping Quote →
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
