'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '../store/cartStore'
import SiteLogo from './SiteLogo'
import AnnouncementBanner from './AnnouncementBanner'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { count } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const navItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'shop', label: 'Shop', href: '/shop' },
    { id: 'categories', label: 'Categories', href: '/categories' },
    { id: 'deals', label: 'Deals', href: '/deals' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ]

  function isItemActive(item: typeof navItems[number]) {
    if (item.href === '/') return pathname === '/'
    return pathname.startsWith(item.href)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #F1FFF0' }}>
      <AnnouncementBanner />
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex flex-shrink-0 items-center"
            aria-label="Dubazaarmart home"
          >
            <SiteLogo />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-link ${isItemActive(item) ? 'active' : ''}`}
                aria-current={isItemActive(item) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search products"
                    placeholder="Search products..."
                    className="h-9 w-48 rounded-lg px-3 text-sm"
                    style={{ background: '#F1FFF0', border: '1px solid #0874F9', color: '#111111' }}
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                  />
                  <button type="submit" className="ml-1 p-2 text-[#0874F9]" aria-label="Submit product search">
                    <svg width="16" height="16" fill="none" stroke="#0874F9" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-2 text-black/60 hover:text-[#0874F9] transition-colors" aria-label="Open search">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2 text-black/60 hover:text-[#0874F9] transition-colors"
              aria-label="Wishlist"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-black/60 hover:text-[#0874F9] transition-colors"
              aria-label={`Shopping cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#FF6A00', color: '#000' }}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-black/60 hover:text-[#0874F9] transition-colors"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="lg:hidden py-4 border-t" style={{ borderColor: '#F1FFF0' }}>
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isItemActive(item) ? 'page' : undefined}
                className="block w-full text-left px-2 py-3 text-sm font-medium border-b"
                style={{ color: isItemActive(item) ? '#0874F9' : '#111111', borderColor: '#F1FFF0' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
