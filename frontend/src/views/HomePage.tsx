"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { fetchActiveHeroSlides } from "../lib/heroSlidesApi"
import { fetchPublicTestimonials, type Testimonial } from "../lib/testimonialsApi"

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="ml-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

function StepIcon({ name }: { name: "search" | "handshake" | "check" | "truck" }) {
  const icons: Record<typeof name, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>,
    handshake: <><path d="m3 12 4-4 4 2 3-2 7 4-5 6-4-2-3 2-6-6Z" /><path d="m7 8 3-3 5 1 3 2M8 15l3 3m2-2 2 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
  }

  return (
    <svg className="h-7 w-7 text-[#0756D9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function BenefitIcon({ name }: { name: "globe" | "shield" | "truck" | "support" }) {
  const icons: Record<typeof name, ReactNode> = {
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" /></>,
    shield: <><path d="M12 3 4.5 6v5c0 5 3.2 8.2 7.5 10 4.3-1.8 7.5-5 7.5-10V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    support: <><path d="M3 13v-2a9 9 0 0 1 18 0v2M5 13h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2ZM17 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2zM17 19a5 5 0 0 1-5 3" /></>,
  }

  return (
    <svg className="h-5 w-5 shrink-0 text-[#0756D9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

const services = [
  {
    title: "Find a Product",
    subtitle: "Sourcing",
    desc: "Tell us what you need, and we’ll help you find it.",
    cta: "Request Product Sourcing",
    href: "/sourcing",
    image: "/images/service-sourcing.jpg",
    alt: "Finding products in a warehouse",
    color: "#0756D9",
  },
  {
    title: "Ship Your Products",
    subtitle: "Shipping",
    desc: "Choose sea or air freight for your shipments.",
    cta: "Explore Shipping",
    href: "/shipping",
    image: "/images/service-shipping.jpg",
    alt: "Air freight cargo plane",
    color: "#FF8200",
  },
  {
    title: "Buy in Bulk",
    subtitle: "Wholesale",
    desc: "Purchase quality products at great wholesale prices.",
    cta: "Explore Wholesale",
    href: "/wholesale",
    image: "/images/service-wholesale.jpg",
    alt: "Wholesale products in a warehouse",
    color: "#169A32",
  },
  {
    title: "Shop Individual Products",
    subtitle: "Retail Sales",
    desc: "Browse and buy your favorite products.",
    cta: "Start Shopping",
    href: "/shop",
    image: "/images/service-retail.jpg",
    alt: "Shopping cart with products",
    color: "#169A32",
  },
]

const steps = [
  { number: "1", icon: "search" as const, title: "Tell Us What You Need", desc: "Describe your product or service." },
  { number: "2", icon: "handshake" as const, title: "We Find or Supply It", desc: "We source, ship or provide it for you." },
  { number: "3", icon: "check" as const, title: "Confirm & Pay", desc: "Review and complete your order." },
  { number: "4", icon: "truck" as const, title: "Receive Your Order", desc: "Get your products on time." },
]

const benefits = [
  { icon: "globe" as const, title: "Global Reach" },
  { icon: "shield" as const, title: "Trusted Partner" },
  { icon: "truck" as const, title: "Fast Delivery" },
  { icon: "support" as const, title: "Dedicated Support" },
]

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [heroImageUrl, setHeroImageUrl] = useState("/images/hero-panorama.png?v=534f607")

  useEffect(() => {
    let active = true
    void fetchActiveHeroSlides()
      .then((slides) => {
        if (active && slides[0]?.imageUrl) setHeroImageUrl(slides[0].imageUrl)
      })
      .catch((error: unknown) => {
        console.error("The active homepage hero image could not be loaded.", error)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    void fetchPublicTestimonials()
      .then((items) => {
        if (active) setTestimonials(items.filter((item) => item.isVisible))
      })
      .catch(() => {
        if (active) setTestimonials([])
      })
    return () => {
      active = false
    }
  }, [])

  const testimonial = testimonials[testimonialIndex]

  return (
    <div className="bg-white text-[#0A1F44]">
      <section className="relative isolate min-h-[420px] overflow-hidden bg-[#EAF3FF] sm:min-h-[350px] lg:min-h-[380px]">
        <div className="absolute inset-0 bg-[#EAF3FF]" />
        <div className="absolute inset-y-0 right-0 w-full sm:left-[28%] sm:w-[72%]">
          <Image
            src={heroImageUrl}
            alt="DubazaarMart homepage hero"
            fill
            priority
            unoptimized
            sizes="(min-width: 640px) 72vw, 100vw"
            className="object-cover object-right sm:object-center"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 z-[2] w-[85%] bg-[linear-gradient(90deg,#ffffff_0%,#ffffff_55%,rgba(255,255,255,0.88)_72%,rgba(255,255,255,0)_100%)] sm:w-[46%] sm:bg-[linear-gradient(90deg,#ffffff_0%,#ffffff_64%,rgba(255,255,255,0.92)_78%,rgba(255,255,255,0)_100%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[2] h-5 bg-gradient-to-t from-white/25 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-10 sm:min-h-[350px] sm:px-6 sm:py-10 lg:min-h-[380px] lg:px-8 lg:py-12">
          <div className="max-w-[440px]">
            <h1 className="text-[1.85rem] font-black leading-[1.04] tracking-[-0.035em] text-[#102744] sm:text-[2.1rem] lg:text-[2.25rem]">
              One Partner for
              <br />
              <span className="text-[#0874F9]">Shipping,</span>{" "}
              <span className="text-[#F26A21]">Logistics,</span>
              <br />
              <span className="text-[#168D42]">Wholesale</span> &amp;{" "}
              <span className="text-[#0874F9]">Retail</span>
            </h1>
            <p className="mt-3 max-w-[390px] text-xs leading-relaxed text-[#26384D] sm:text-sm">
              From global sourcing and freight management to wholesale distribution and retail sales, we provide complete commerce solutions that move products from suppliers to customers efficiently.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href="/contact?topic=quote" className="inline-flex items-center rounded-md bg-[#F26A21] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#D95412]">
                Get a Quote <ArrowIcon />
              </Link>
              <Link href="#services" className="inline-flex items-center rounded-md border border-[#0756D9] bg-white/90 px-4 py-2 text-xs font-bold text-[#12304F] transition-colors hover:bg-white">
                Explore Services
              </Link>
            </div>
            <div className="mt-4 flex max-w-[440px] flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-[#26384D] sm:text-[11px]">
              <span className="inline-flex items-center gap-1"><span className="text-[#168D42]">✓</span> Reliable Service</span>
              <span className="inline-flex items-center gap-1"><span className="text-[#0874F9]">◎</span> Global Network</span>
              <span className="inline-flex items-center gap-1"><span className="text-[#0874F9]">●</span> Business &amp; Consumer Focus</span>
              <span className="inline-flex items-center gap-1"><span className="text-[#168D42]">✦</span> A More Connected Tomorrow</span>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-center">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">How Can We Help You Today?</h2>
            <p className="mt-0.5 text-xs sm:text-sm">Choose what you want to do and let DubazaarMart take care of the rest.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {services.map((service) => (
              <article key={service.title} className="overflow-hidden rounded-2xl border border-[#DDE8F7] bg-white p-1.5 shadow-[0_3px_14px_rgba(20,66,120,0.08)]">
                <div className="relative aspect-[1.75] overflow-hidden rounded-xl bg-[#EFF5FC]">
                  <Image src={service.image} alt={service.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="flex min-h-[105px] flex-col items-center px-2 pb-1 pt-2 text-center">
                  <h3 className="text-[13px] font-extrabold leading-tight">{service.title}</h3>
                  <span className="mt-0.5 text-[10px] font-bold" style={{ color: service.color }}>{service.subtitle}</span>
                  <p className="mt-1.5 max-w-[190px] flex-1 text-[10px] leading-[1.3] sm:text-[11px]">{service.desc}</p>
                  <Link href={service.href} className="mt-2 inline-flex w-full items-center justify-center rounded-full px-3 py-1.5 text-[10px] font-bold text-white transition-opacity hover:opacity-90 sm:text-[11px]" style={{ backgroundColor: service.color }}>
                    {service.cta} <ArrowIcon />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F7FAFF] px-4 pb-5 pt-1 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 text-center">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">How It Works</h2>
            <p className="text-[11px] sm:text-xs">A simple process to get what you need.</p>
          </div>
          <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {index < steps.length - 1 && <span aria-hidden="true" className="absolute left-[63%] top-5 hidden w-[75%] text-center text-lg text-[#0756D9] sm:block">→</span>}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0756D9] text-[11px] font-extrabold text-white">{step.number}</span>
                <div className="mt-1 flex h-9 items-center justify-center"><StepIcon name={step.icon} /></div>
                <h3 className="mt-0.5 text-[10px] font-bold sm:text-[11px]">{step.title}</h3>
                <p className="mt-0.5 max-w-[145px] text-[9px] leading-[1.3] sm:text-[10px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="mx-auto grid max-w-6xl items-center gap-4 rounded-2xl bg-[#F7FAFF] sm:grid-cols-[1.1fr_1fr_0.55fr] sm:gap-5">
          <div className="relative min-h-[130px] overflow-hidden rounded-2xl sm:h-full">
            <Image src="/images/promo-port.jpg" alt="Cargo ship at a global trade port" fill sizes="(min-width: 640px) 36vw, 100vw" className="object-cover" />
          </div>
          <div className="px-2 py-3 sm:py-2">
            <span className="rounded-full bg-[#E6F0FF] px-2.5 py-1 text-[9px] font-bold text-[#0756D9]">About DubazaarMart</span>
            <h2 className="mt-2 text-xl font-extrabold leading-tight sm:text-[23px]">Building a Smarter<br />Global Trade <span className="text-[#0756D9]">Ecosystem.</span></h2>
            <p className="mt-2 text-[10px] leading-[1.4] sm:text-[11px]">We connect customers with products, suppliers and international shipping solutions, while also supplying products through wholesale and retail sales.</p>
            <Link href="/about" className="mt-2 inline-flex items-center rounded-full bg-[#0756D9] px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#0648B5]">Learn More About Us <ArrowIcon /></Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 px-2 pb-3 sm:grid-cols-1 sm:border-l sm:border-[#D9E5F5] sm:px-4 sm:py-3">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-center gap-2 text-[10px] font-semibold">
                <BenefitIcon name={benefit.icon} />
                {benefit.title}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="mx-auto max-w-5xl">
            <div className="mb-2 text-center">
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">What Our Customers Say</h2>
              <p className="text-[11px] sm:text-xs">Trusted by businesses and shoppers worldwide.</p>
            </div>
            <div className="flex items-center gap-2">
              {testimonials.length > 1 && (
                <button type="button" onClick={() => setTestimonialIndex((index) => (index - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E0EAF8] bg-white text-lg shadow-sm hover:text-[#0756D9]">‹</button>
              )}
              {testimonial ? <article className="flex min-w-0 flex-1 flex-col items-center gap-3 rounded-2xl border border-[#E7EEF8] bg-[#F7FAFF] px-4 py-3 sm:flex-row">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6F0FF] text-sm font-bold text-[#0756D9]">
                  {testimonial.photoUrl ? (
                    <Image src={testimonial.photoUrl} alt={testimonial.customerName} width={48} height={48} unoptimized className="h-full w-full object-cover" />
                  ) : testimonial.customerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-[10px] leading-[1.35] sm:text-[11px]">&ldquo;{testimonial.message}&rdquo;</p>
                  <p className="mt-1 text-[10px] font-bold">{testimonial.customerName}</p>
                  {testimonial.role && <p className="text-[9px]">{testimonial.role}</p>}
                </div>
                <div className="shrink-0 text-sm tracking-[1px] text-[#FFAE00]" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {"★".repeat(testimonial.rating)}<span className="text-[#D7DFEA]">{"★".repeat(5 - testimonial.rating)}</span>
                </div>
              </article> : <p className="flex min-h-16 flex-1 items-center justify-center rounded-2xl border border-[#E7EEF8] bg-[#F7FAFF] px-4 text-center text-xs text-[#475569]">We’re gathering feedback from our customers.</p>}
              {testimonials.length > 1 && (
                <button type="button" onClick={() => setTestimonialIndex((index) => (index + 1) % testimonials.length)} aria-label="Next testimonial" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E0EAF8] bg-white text-lg shadow-sm hover:text-[#0756D9]">›</button>
              )}
            </div>
          </div>
      </section>

      <section className="px-4 pb-2 sm:px-6 sm:pb-2">
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#0645A8] via-[#0756D9] to-[#0645A8] px-5 py-3 text-center text-white sm:flex-row sm:px-8 sm:text-left">
          <div aria-hidden="true" className="absolute -left-2 top-0 h-full w-24 -skew-x-[28deg] bg-gradient-to-r from-[#FF8200] via-[#FFB000] to-[#169A32]" />
          <h2 className="relative text-base font-extrabold sm:text-lg">Whatever You Need, Start With DubazaarMart.</h2>
          <Link href="/sourcing" className="relative inline-flex shrink-0 items-center rounded-full bg-[#FF8200] px-4 py-2 text-[10px] font-bold text-white hover:bg-[#E76E00]">Get Started <ArrowIcon /></Link>
        </div>
      </section>
    </div>
  )
}
