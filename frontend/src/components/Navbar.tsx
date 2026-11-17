import { useState } from 'react'
import { useCart } from '../store/cartStore'
import SiteLogo from './SiteLogo'
import AnnouncementBanner from './AnnouncementBanner'

interface NavbarProps {
  page: string
  setPage: (p: string) => void
}

export default function Navbar({ page, setPage }: NavbarProps) {
  const { count } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'categories', label: 'Categories' },
    { id: 'deals', label: 'Deals' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      setPage('search')
      setSearchOpen(false)
    }
  }

  function nav(p: string) {
    setPage(p)
    setMobileOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #F1FFF0' }}>
      <AnnouncementBanner />
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => nav('home')}
            className="flex flex-shrink-0 items-center"
            aria-label="Dubazaarmart home"
          >
            <SiteLogo />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className={`nav-link ${page === item.id ? 'active' : ''}`}
              >
                {item.label}
              </button>
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
                    placeholder="Search products..."
                    className="h-9 w-48 rounded-lg px-3 text-sm"
                    style={{ background: '#F1FFF0', border: '1px solid #0874F9', color: '#111111' }}
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                  />
                  <button type="submit" className="ml-1 p-2 text-[#0874F9]">
                    <svg width="16" height="16" fill="none" stroke="#0874F9" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-2 text-black/60 hover:text-[#0874F9] transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button onClick={() => nav('wishlist')} className="p-2 text-black/60 hover:text-[#0874F9] transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            {/* Cart */}
            <button onClick={() => nav('cart')} className="relative p-2 text-black/60 hover:text-[#0874F9] transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: '#FF6A00', color: '#000' }}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* Account */}
            <button onClick={() => nav('account')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: '#F1FFF0', border: '1px solid #FFB800', color: '#111111' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Account
            </button>

            {/* Admin */}
            <button onClick={() => nav('admin')} className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium btn-gold">
              Admin
            </button>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-black/60 hover:text-[#0874F9] transition-colors">
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
          <div className="lg:hidden py-4 border-t" style={{ borderColor: '#F1FFF0' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => nav(item.id)}
                className="block w-full text-left px-2 py-3 text-sm font-medium border-b"
                style={{ color: page === item.id ? '#0874F9' : '#111111', borderColor: '#F1FFF0' }}
              >
                {item.label}
              </button>
            ))}
            <button onClick={() => nav('admin')} className="mt-3 w-full py-2 rounded-lg text-sm font-bold btn-gold">
              Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
