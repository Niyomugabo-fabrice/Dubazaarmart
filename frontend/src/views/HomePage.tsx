"use client"

import { useState, useEffect } from 'react'
import { categories, testimonials } from '../data/products'
import ProductCard from '../components/ProductCard'
import SiteLogo from '../components/SiteLogo'
import { useProducts } from '../store/productsStore'
import { useWebsiteSettings } from '../store/settingsStore'
import { swaggerUrl } from '../services/api-client'
import { useAppNavigation } from '../lib/navigation'

export default function HomePage() {
  const { navigate } = useAppNavigation()
  const settings = useWebsiteSettings()
  const { products: liveProducts, loading, error } = useProducts()
  const products = liveProducts

  const [activeTab, setActiveTab] = useState<'featured' | 'popular' | 'new' | 'deals'>('featured')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [heroText, setHeroText] = useState(0)

  const heroLines = [
    'Premium Electronics Direct from Dubai Wholesale',
    'Unbeatable Dubai Prices · Save up to 30%',
    'Fast & Secure Nationwide Delivery Across Rwanda',
  ]

  useEffect(() => {
    const t = setInterval(() => setHeroText(n => (n + 1) % heroLines.length), 2800)
    return () => clearInterval(t)
  }, [heroLines.length])

  const filteredProducts = products.filter(p => {
    if (activeTab === 'featured') return p.featured
    if (activeTab === 'new') return p.badge === 'New Arrival'
    if (activeTab === 'deals') return p.discount >= 15
    return p.reviews > 150
  })

  const whyItems = [
    { icon: '✈️', title: 'Sourced from Dubai', desc: 'Direct from UAE wholesalers — authentic products at wholesale prices.' },
    { icon: '🚀', title: 'Fast Delivery', desc: 'Nationwide delivery across Rwanda within 2–5 business days.' },
    { icon: '🔒', title: 'Secure Payments', desc: 'Pay securely via MTN Mobile Money or Airtel Money.' },
    { icon: '✅', title: '100% Authentic', desc: 'Every product is verified genuine with official warranty.' },
    { icon: '↩️', title: 'Easy Returns', desc: '14-day hassle-free returns on all eligible products.' },
    { icon: '💬', title: '24/7 Support', desc: 'Our team is always available via WhatsApp and email.' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600&h=900&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #FFFFFF 50%, rgba(255,247,232,0.88) 100%)' }} />
          {/* Gold radial */}
          <div className="absolute top-1/2 right-1/3 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF6A00 0%, transparent 70%)', transform: 'translate(50%, -50%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-xs font-semibold" style={{ background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF6A00' }}>
                <span className="w-2 h-2 rounded-full bg-[#17D719] animate-pulse" />
                Dubai-sourced · Rwanda-delivered
              </div>

              {/* Reduced size, highly attractive Hero Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.18] mb-4 text-[#111111]">
                <span>Premium</span>{' '}
                <span className="bg-gradient-to-r from-[#FF6A00] via-[#FFB800] to-[#17D719] bg-clip-text text-transparent">
                  Electronics.
                </span>
                <br />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111]/90">
                  Dubai Wholesale Prices.
                </span>
              </h1>

              {/* Attractive Animated HeroLine */}
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 transition-all duration-300" style={{ background: '#FFF7E8', borderColor: '#FFB800', boxShadow: '0 4px 20px rgba(255,106,0,0.08)' }}>
                <span className="inline-flex items-center justify-center rounded-lg bg-[#FF6A00]/15 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FF6A00]">
                  LIVE
                </span>
                <span
                  key={heroText}
                  className="text-xs sm:text-sm font-semibold transition-all duration-500 bg-gradient-to-r from-[#FF6A00] via-[#E94B00] to-[#0B5B24] bg-clip-text text-transparent"
                >
                  ⚡ {heroLines[heroText]}
                </span>
              </div>

              <p className="text-base sm:text-lg mb-8 max-w-lg leading-relaxed text-[#111111]/80">
                Discover quality electronics sourced directly from Dubai and delivered to you at competitive wholesale prices anywhere in Rwanda.
              </p>

              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('shop')} className="btn-gold px-8 py-4 rounded-xl text-base font-bold">
                  Shop Now →
                </button>
                <button onClick={() => navigate('categories')} className="btn-ghost px-8 py-4 rounded-xl text-base font-bold">
                  Browse Categories
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-14 pt-8" style={{ borderTop: '1px solid #F1FFF0' }}>
                {[
                  { val: '2,500+', label: 'Products' },
                  { val: '18,000+', label: 'Customers' },
                  { val: '4.9★', label: 'Rating' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold gold-text">{stat.val}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#0B5B24' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero product showcase */}
            <div className="hidden lg:flex justify-center relative">
              <div className="relative">
                <div className="w-80 h-80 rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,106,0,0.2)', background: '#FFF7E8' }}>
                  <img
                    src="https://images.unsplash.com/photo-1675315936697-1bd8e939948e?w=640&h=640&fit=crop&auto=format"
                    alt="Samsung Galaxy S24 Ultra"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-8 px-4 py-3 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div className="text-xs mb-0.5" style={{ color: '#FF6A00' }}>Samsung Galaxy S24 Ultra</div>
                  <div className="font-bold text-[#111111]">RWF 1,450,000</div>
                  <div className="text-xs" style={{ color: '#0B5B24', textDecoration: 'line-through' }}>RWF 1,800,000</div>
                </div>
                <div className="absolute -top-4 -right-4 px-3 py-2 rounded-xl badge" style={{ background: '#FF6A00', color: '#000' }}>
                  Save 19%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="py-16 px-4" style={{ background: '#FFF7E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="badge mb-2" style={{ color: '#FF6A00' }}>EXPLORE</div>
              <h2 className="text-3xl font-bold text-[#111111]">Shop by Category</h2>
            </div>
            <button onClick={() => navigate('categories')} className="text-sm btn-ghost px-4 py-2 rounded-lg font-medium">
              All Categories →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.slice(0, 7).map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate('shop')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl card-hover text-center"
                style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium" style={{ color: '#111111' }}>{cat.name}</span>
                <span className="badge" style={{ color: '#0B5B24' }}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="badge mb-2" style={{ color: '#FF6A00' }}>COLLECTION</div>
              <h2 className="text-3xl font-bold text-[#111111]">Our Products</h2>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: '#FFF7E8' }}>
            {(['featured', 'popular', 'new', 'deals'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                style={activeTab === tab
                  ? { background: '#FF6A00', color: '#000' }
                  : { color: '#111111' }
                }
              >
                {tab === 'new' ? 'New Arrivals' : tab === 'deals' ? 'Hot Deals' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center" style={{ color: '#0B5B24' }} role="status" aria-live="polite">
                Loading products…
              </div>
            ) : error ? (
              <div className="col-span-full py-12 text-center" style={{ color: '#0B5B24' }} role="alert">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: '#FFB800' }}>
                <div className="text-3xl mb-2">📦</div>
                <div className="font-bold text-gray-900 text-lg">Your store is ready for products</div>
                <p className="text-sm text-[#0B5B24] mt-1 mb-4">No products are currently in the catalog. Log in to the Admin Dashboard to add your first product.</p>
                <button onClick={() => navigate('admin')} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm">
                  Open Admin Dashboard →
                </button>
              </div>
            ) : (
              (filteredProducts.length > 0 ? filteredProducts : products).slice(0, 8).map(p => (
                <ProductCard key={p.id} product={p} />
              ))
            )}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate('shop')} className="btn-ghost px-8 py-3 rounded-xl text-base font-semibold">
              View All Products →
            </button>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F1FFF0 0%, #FFF7E8 100%)', border: '1px solid rgba(255,106,0,0.2)' }}>
            <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 80% 50%, #FF6A00 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="badge mb-2" style={{ color: '#FF6A00' }}>LIMITED OFFER</div>
              <h3 className="text-3xl lg:text-4xl font-bold text-[#111111] mb-2">Up to <span className="gold-text">30% OFF</span></h3>
              <p style={{ color: '#111111' }}>On selected smartphones and laptops this week only</p>
            </div>
            <button onClick={() => navigate('deals')} className="btn-gold px-8 py-4 rounded-xl font-bold text-lg flex-shrink-0 relative">
              Grab the Deal →
            </button>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 px-4" style={{ background: '#FFF7E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge mb-2" style={{ color: '#FF6A00' }}>WHY US</div>
            <h2 className="text-3xl font-bold text-[#111111]">Why Choose Dubazaarmart</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {whyItems.map(item => (
              <div key={item.title} className="p-6 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-[#111111] mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#0B5B24' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge mb-2" style={{ color: '#FF6A00' }}>REVIEWS</div>
            <h2 className="text-3xl font-bold text-[#111111]">Customer Stories</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FF6A00">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#111111' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,106,0,0.2)', color: '#FF6A00' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111111]">{t.name}</div>
                    <div className="text-xs" style={{ color: '#0B5B24' }}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery info */}
      <section className="py-12 px-4" style={{ background: '#FFF7E8' }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}>
            <div className="text-4xl mb-4">🇷🇼</div>
            <h3 className="text-2xl font-bold text-[#111111] mb-3">Nationwide Delivery in Rwanda</h3>
            <p className="mb-6" style={{ color: '#111111' }}>We deliver to all provinces including Kigali, Northern, Southern, Eastern, and Western provinces. Standard delivery 2–3 days, express available.</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[['🏙️', 'Kigali', '1–2 days'], ['🌍', 'Other cities', '2–3 days'], ['🏡', 'Rural areas', '3–5 days']].map(([icon, loc, time]) => (
                <div key={String(loc)} className="text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-sm font-medium text-[#111111]">{loc}</div>
                  <div className="text-xs" style={{ color: '#FF6A00' }}>{time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #FFF7E8, #FFFFFF)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="badge mb-3" style={{ color: '#FF6A00' }}>NEWSLETTER</div>
          <h2 className="text-3xl font-bold text-[#111111] mb-3">Stay Ahead of the Deals</h2>
          <p className="mb-8" style={{ color: '#111111' }}>Get notified about flash sales, new arrivals, and exclusive offers.</p>
          {subscribed ? (
            <div className="py-4 px-6 rounded-xl inline-block" style={{ background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF6A00' }}>
              ✓ You're subscribed! Watch your inbox.
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); if (email) setSubscribed(true) }} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                required
              />
              <button type="submit" className="btn-gold px-6 py-3 rounded-xl font-semibold flex-shrink-0">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4" style={{ background: '#FFFFFF', borderTop: '1px solid #F1FFF0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <SiteLogo className="h-12 w-12" />
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#0B5B24' }}>
                Premium electronics from Dubai, delivered to Rwanda. Quality guaranteed.
              </p>
              <div className="text-sm" style={{ color: '#0B5B24' }}>
                <div>📞 {settings.phoneNumber || '+250789545954'}</div>
                <div>✉️ {settings.companyEmail || 'hello@dubazaarmart.com'}</div>
                <div>📍 {settings.businessAddress || 'KG 15 Ave, Kigali, Rwanda'}</div>
              </div>
            </div>
            {[
              { title: 'Shop', links: ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Smart Watches', 'All Products'] },
              { title: 'Company', links: ['About Us', 'Delivery Info', 'Contact Us', 'Terms & Conditions', 'Privacy Policy'] },
              { title: 'Account', links: ['My Account', 'My Orders', 'Wishlist', 'Track Order', 'Returns', 'Create Account', 'Admin Dashboard'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-[#111111] mb-4 text-sm">{col.title}</h4>
                <div className="flex flex-col gap-2">
                  {col.links.map(link => (
                    <button
                      key={link}
                      onClick={() => {
                        if (link === 'Create Account') navigate('account')
                        if (link === 'Admin Dashboard') navigate('admin')
                      }}
                      className="text-sm text-left hover:text-[#111111] transition-colors"
                      style={{ color: '#0B5B24' }}
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="section-divider mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm" style={{ color: '#0B5B24' }}>
              © 2026 Dubazaarmart.com — All rights reserved
              <a href={swaggerUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-[#111111] transition-colors">
                API Documentation
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#0B5B24' }}>We accept:</span>
              <span className="badge px-2 py-1 rounded" style={{ background: '#F1FFF0', color: '#FF6A00', border: '1px solid #FFB800' }}>MTN MoMo</span>
              <span className="badge px-2 py-1 rounded" style={{ background: '#F1FFF0', color: '#FF6A00', border: '1px solid #FFB800' }}>Airtel Money</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
