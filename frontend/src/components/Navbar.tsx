'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../store/cartStore'
import SiteLogo from './SiteLogo'
import AnnouncementBanner from './AnnouncementBanner'

export default function Navbar() {
  const pathname = usePathname()
  const { count } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const servicesMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const root = document.documentElement
    const publishHeight = () => root.style.setProperty('--site-header-height', `${header.offsetHeight}px`)
    publishHeight()
    const observer = new ResizeObserver(publishHeight)
    observer.observe(header, { box: 'border-box' })
    return () => {
      observer.disconnect()
      root.style.removeProperty('--site-header-height')
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const serviceItems = [
    {
      label: 'International Sourcing',
      desc: 'Source products from global markets',
      href: '/sourcing',
    },
    {
      label: 'Import & Logistics',
      desc: 'Air and sea freight to Rwanda',
      href: '/shipping',
    },
    {
      label: 'Wholesale & Distribution',
      desc: 'Bulk orders with flexible MOQ',
      href: '/wholesale',
    },
    {
      label: 'Retail Shop',
      desc: 'Electronics & ready-to-ship products',
      href: '/shop',
    },
  ]

  const navItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'sourcing', label: 'Sourcing', href: '/sourcing' },
    { id: 'shipping', label: 'Shipping', href: '/shipping' },
    { id: 'wholesale', label: 'Wholesale', href: '/wholesale' },
    { id: 'shop', label: 'Retail Shop', href: '/shop' },
    { id: 'about', label: 'About Us', href: '/about' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ]

  function isItemActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-[0_2px_12px_rgba(10,31,68,0.05)]"
    >
      <AnnouncementBanner />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center" aria-label="DubazaarMart home">
            <SiteLogo className="h-10 w-10" size={40} />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className={`relative whitespace-nowrap py-1 text-sm font-semibold transition-colors ${
                pathname === '/' ? 'text-[#FF6A00]' : 'text-[#0A1F44] hover:text-[#FF6A00]'
              }`}
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              Home
              {pathname === '/' && (
                <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#FF6A00]" />
              )}
            </Link>

            {/* Services Dropdown */}
            <div ref={servicesMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen((prev) => !prev)}
                aria-expanded={servicesOpen}
                className={`flex items-center gap-1 whitespace-nowrap py-1 text-sm font-semibold transition-colors ${
                  ['/sourcing', '/shipping', '/wholesale', '/shop'].some((p) => pathname.startsWith(p))
                    ? 'text-[#FF6A00]'
                    : 'text-[#0A1F44] hover:text-[#FF6A00]'
                }`}
              >
                Services
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {servicesOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-xl">
                  {serviceItems.map((service) => (
                    <Link
                      key={service.href}
                      href={service.href}
                      onClick={() => setServicesOpen(false)}
                      className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-[#F8FAFC]"
                    >
                      <div className="text-sm font-bold text-[#0A1F44]">{service.label}</div>
                      <div className="text-xs text-[#475569]">{service.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/shop"
              className={`relative whitespace-nowrap py-1 text-sm font-semibold transition-colors ${
                isItemActive('/shop') ? 'text-[#FF6A00]' : 'text-[#0A1F44] hover:text-[#FF6A00]'
              }`}
              aria-current={isItemActive('/shop') ? 'page' : undefined}
            >
              Retail Shop
            </Link>

            <Link
              href="/about"
              className={`relative whitespace-nowrap py-1 text-sm font-semibold transition-colors ${
                isItemActive('/about') ? 'text-[#FF6A00]' : 'text-[#0A1F44] hover:text-[#FF6A00]'
              }`}
              aria-current={isItemActive('/about') ? 'page' : undefined}
            >
              About Us
            </Link>

            <Link
              href="/contact"
              className={`relative whitespace-nowrap py-1 text-sm font-semibold transition-colors ${
                isItemActive('/contact') ? 'text-[#FF6A00]' : 'text-[#0A1F44] hover:text-[#FF6A00]'
              }`}
              aria-current={isItemActive('/contact') ? 'page' : undefined}
            >
              Contact
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Account */}
            <Link
              href="/account"
              className="rounded-full p-2 text-[#0A1F44] transition-colors hover:bg-[#F8FAFC] hover:text-[#FF6A00]"
              aria-label="Account"
              title="My Account"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative rounded-full p-2 text-[#0A1F44] transition-colors hover:bg-[#F8FAFC] hover:text-[#FF6A00]"
              aria-label={`Shopping cart, ${count} item${count === 1 ? '' : 's'}`}
              title="Shopping Cart"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6A00] text-[11px] font-bold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {/* Get Started CTA */}
            <Link
              href="/#services"
              className="hidden sm:inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#FF6A00] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#E55A00]"
            >
              Get Started
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden rounded-lg p-2 text-[#0A1F44] transition-colors hover:bg-[#F8FAFC] hover:text-[#FF6A00]"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-[#E2E8F0] py-4 lg:hidden"
          >
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isItemActive(item.href) ? 'page' : undefined}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isItemActive(item.href)
                      ? 'bg-[#FFF7E8] text-[#FF6A00]'
                      : 'text-[#0A1F44] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2">
                <Link
                  href="/#services"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-[#FF6A00] px-4 py-2.5 text-sm font-bold text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
