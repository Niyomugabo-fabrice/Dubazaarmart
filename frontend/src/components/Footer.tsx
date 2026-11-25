"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import SiteLogo from "./SiteLogo"
import { useWebsiteSettings } from "../store/settingsStore"
import { swaggerUrl } from "../services/api-client"

export default function Footer() {
  const isHomePage = usePathname() === "/"
  const settings = useWebsiteSettings()
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="bg-[#061C42] text-white">
      <div className={`mx-auto max-w-7xl px-4 lg:px-8 ${isHomePage ? "py-5" : "py-14"}`}>
        <div className={`grid grid-cols-1 ${isHomePage ? "gap-5 sm:grid-cols-[1.15fr_0.7fr_0.7fr_0.9fr_1.4fr]" : "gap-10 sm:grid-cols-2 lg:grid-cols-4"}`}>
          {/* Brand */}
          <div>
            <div className={isHomePage ? "mb-1.5" : "mb-4"}>
              <SiteLogo className={isHomePage ? "h-9 w-9" : "h-11 w-11"} priority={false} variant="dark" />
            </div>
            {!isHomePage && <p className="mb-4 text-sm leading-relaxed text-slate-300">
              Discover. Trade. Grow. Your integrated platform for international sourcing, global shipping, wholesale distribution, and retail shopping.
            </p>}
            <div className={`space-y-1.5 text-slate-300 ${isHomePage ? "text-[10px]" : "text-sm"}`}>
              {isHomePage && <div>Trade · Ship · Grow</div>}
              {!isHomePage && <div>📍 {settings.businessAddress || "KG 15 Ave, Kigali, Rwanda"}</div>}
              {!isHomePage && <><div>✉️ {settings.companyEmail || "info@dubazaarmart.com"}</div><div>📞 {settings.phoneNumber || "+250 789 545 954"}</div></>}
            </div>
          </div>

          {/* Our Services */}
          <div>
            <h3 className={`font-bold text-white ${isHomePage ? "mb-2 text-[10px]" : "mb-4 text-sm uppercase tracking-wider"}`}>
              Our Services
            </h3>
            <ul className={`text-slate-300 ${isHomePage ? "space-y-1 text-[10px]" : "space-y-2.5 text-sm"}`}>
              <li>
                <Link href="/sourcing" className="transition-colors hover:text-[#FF6A00]">
                  International Sourcing
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="transition-colors hover:text-[#FF6A00]">
                  Import &amp; Logistics
                </Link>
              </li>
              <li>
                <Link href="/wholesale" className="transition-colors hover:text-[#FF6A00]">
                  Wholesale &amp; Distribution
                </Link>
              </li>
              <li>
                <Link href="/shop" className="transition-colors hover:text-[#FF6A00]">
                  Retail Shopping
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`font-bold text-white ${isHomePage ? "mb-2 text-[10px]" : "mb-4 text-sm uppercase tracking-wider"}`}>
              Quick Links
            </h3>
            <ul className={`text-slate-300 ${isHomePage ? "space-y-1 text-[10px]" : "space-y-2.5 text-sm"}`}>
              <li>
                <Link href="/about" className="transition-colors hover:text-[#FF6A00]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/categories" className="transition-colors hover:text-[#FF6A00]">
                  Product Categories
                </Link>
              </li>
              <li>
                <Link href="/deals" className="transition-colors hover:text-[#FF6A00]">
                  Hot Deals
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-[#FF6A00]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/admin" className="transition-colors hover:text-[#FF6A00]">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {isHomePage && <div>
            <h3 className="mb-2 text-[10px] font-bold text-white">Contact Us</h3>
            <ul className="space-y-1 text-[10px] text-slate-300">
              <li>⌖ {settings.businessAddress || "Kigali, Rwanda"}</li>
              <li>✉ {settings.companyEmail || "info@dubazaarmart.com"}</li>
              <li>☎ {settings.phoneNumber || "+250 789 545 954"}</li>
            </ul>
          </div>}

          {/* Newsletter */}
          <div>
            <h3 className={`font-bold text-white ${isHomePage ? "mb-2 text-[10px]" : "mb-4 text-sm uppercase tracking-wider"}`}>
              Subscribe to Our Newsletter
            </h3>
            <p className={`text-slate-300 ${isHomePage ? "mb-2 text-[10px]" : "mb-4 text-sm"}`}>
              Get the latest trade updates, shipping schedules, and retail offers.
            </p>
            {subscribed ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-[#FF6A00]/40 bg-[#FF6A00]/15 px-4 py-3 text-sm font-medium text-white"
              >
                ✓ Subscribed! Watch your inbox for updates.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (email.trim()) setSubscribed(true)
                }}
                className={`flex gap-2.5 ${isHomePage ? "flex-row" : "flex-col sm:flex-row"}`}
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className={`w-full border border-slate-600 bg-white text-[#0A1F44] placeholder:text-slate-400 focus:border-[#0756D9] ${isHomePage ? "min-w-0 rounded-full px-3 py-1.5 text-[10px]" : "rounded-xl px-3.5 py-2.5 text-sm"}`}
                />
                <button
                  type="submit"
                  className={`shrink-0 bg-[#0756D9] font-bold text-white transition-colors hover:bg-[#0648B5] ${isHomePage ? "rounded-full px-3 py-1.5 text-[10px]" : "rounded-xl px-4 py-2.5 text-sm"}`}
                >
                  Subscribe
                </button>
              </form>
            )}
            {!isHomePage && <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>Payments:</span>
              <span className="rounded-md border border-slate-600 bg-white/5 px-2.5 py-1 font-semibold text-white">
                MTN MoMo
              </span>
              <span className="rounded-md border border-slate-600 bg-white/5 px-2.5 py-1 font-semibold text-white">
                Airtel Money
              </span>
            </div>}
          </div>
        </div>

        <div className={`flex flex-col items-center justify-between gap-3 border-t border-white/10 text-slate-400 sm:flex-row ${isHomePage ? "mt-4 pt-3 text-[9px]" : "mt-12 gap-4 pt-6 text-xs"}`}>
          <p>© {new Date().getFullYear()} DubazaarMart. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/contact?topic=privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/contact?topic=terms" className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
            {!isHomePage && <a
                href={swaggerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                API Docs
              </a>}
            {isHomePage && <Link href="/contact?topic=cookies" className="transition-colors hover:text-white">Cookie Policy</Link>}
          </div>
          {isHomePage && <div className="flex gap-1.5 text-[9px] font-bold text-white" aria-hidden="true">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2]">f</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black">𝕏</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0A66C2]">in</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF0000]">▶</span>
          </div>}
        </div>
      </div>
    </footer>
  )
}
