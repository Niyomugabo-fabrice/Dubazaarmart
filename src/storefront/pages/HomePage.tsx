import { useState, useEffect } from 'react'
import { products, categories, testimonials } from '../data/products'
import ProductCard from '../components/ProductCard'
import type { Product } from '../data/products'

interface Props {
  setPage: (p: string) => void
  setSelectedProduct: (p: Product) => void
}

export default function HomePage({ setPage, setSelectedProduct }: Props) {
  const [activeTab, setActiveTab] = useState<'featured' | 'popular' | 'new' | 'deals'>('featured')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [heroText, setHeroText] = useState(0)

  const heroLines = ['Premium Electronics.', 'Dubai Prices.', 'Rwanda Delivered.']

  useEffect(() => {
    const t = setInterval(() => setHeroText((n) => (n + 1) % heroLines.length), 3000)
    return () => clearInterval(t)
  }, [])

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'featured') return p.featured
    if (activeTab === 'new') return p.badge === 'New Arrival'
    if (activeTab === 'deals') return p.discount >= 15
    return p.reviews > 150
  })

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  const whyItems = [
    {
      icon: '✈️',
      title: 'Sourced from Dubai',
      desc: 'Direct from UAE wholesalers — authentic products at wholesale prices.',
    },
    {
      icon: '🚀',
      title: 'Fast Delivery',
      desc: 'Nationwide delivery across Rwanda within 2–5 business days.',
    },
    {
      icon: '🔒',
      title: 'Secure Payments',
      desc: 'Pay securely via MTN Mobile Money or Airtel Money.',
    },
    {
      icon: '✅',
      title: '100% Authentic',
      desc: 'Every product is verified genuine with official warranty.',
    },
    {
      icon: '↩️',
      title: 'Easy Returns',
      desc: '14-day hassle-free returns on all eligible products.',
    },
    {
      icon: '💬',
      title: '24/7 Support',
      desc: 'Our team is always available via WhatsApp and email.',
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600&h=900&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #0A0A0B 50%, rgba(10,10,11,0.6) 100%)' }}
          />
          {/* Gold radial */}
          <div
            className="absolute top-1/2 right-1/3 w-96 h-96 rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)',
              transform: 'translate(50%, -50%)',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 badge"
                style={{
                  background: 'rgba(212,168,67,0.1)',
                  border: '1px solid rgba(212,168,67,0.3)',
                  color: '#D4A843',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Dubai-sourced · Rwanda-delivered
              </div>

              {/* Headline */}
              <h1 className="font-serif text-5xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="text-white">Premium</span>
                <br />
                <span className="gold-text">Electronics.</span>
                <br />
                <span className="text-white text-4xl lg:text-5xl">Dubai Prices.</span>
              </h1>

              <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: '#A0A0A8' }}>
                Discover quality electronics sourced directly from Dubai and delivered to you at
                competitive prices anywhere in Rwanda.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setPage('shop')}
                  className="btn-gold px-8 py-4 rounded-xl text-base font-bold"
                >
                  Shop Now →
                </button>
                <button
                  onClick={() => setPage('categories')}
                  className="btn-ghost px-8 py-4 rounded-xl text-base font-bold"
                >
                  Browse Categories
                </button>
              </div>

              {/* Stats */}
              <div
                className="grid grid-cols-3 gap-6 mt-14 pt-8"
                style={{ borderTop: '1px solid #1A1A1E' }}
              >
                {[
                  { val: '2,500+', label: 'Products' },
                  { val: '18,000+', label: 'Customers' },
                  { val: '4.9★', label: 'Rating' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold gold-text">{stat.val}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#555560' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero product showcase */}
            <div className="hidden lg:flex justify-center relative">
              <div className="relative">
                <div
                  className="w-80 h-80 rounded-3xl overflow-hidden"
                  style={{ border: '1px solid rgba(212,168,67,0.2)', background: '#111114' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1675315936697-1bd8e939948e?w=640&h=640&fit=crop&auto=format"
                    alt="Samsung Galaxy S24 Ultra"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating card */}
                <div
                  className="absolute -bottom-4 -left-8 px-4 py-3 rounded-2xl"
                  style={{
                    background: '#111114',
                    border: '1px solid #2A2A30',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="text-xs mb-0.5" style={{ color: '#D4A843' }}>
                    Samsung Galaxy S24 Ultra
                  </div>
                  <div className="font-bold text-white">RWF 1,450,000</div>
                  <div
                    className="text-xs"
                    style={{ color: '#555560', textDecoration: 'line-through' }}
                  >
                    RWF 1,800,000
                  </div>
                </div>
                <div
                  className="absolute -top-4 -right-4 px-3 py-2 rounded-xl badge"
                  style={{ background: '#D4A843', color: '#000' }}
                >
                  Save 19%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="py-16 px-4" style={{ background: '#111114' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="badge mb-2" style={{ color: '#D4A843' }}>
                EXPLORE
              </div>
              <h2 className="text-3xl font-bold text-white">Shop by Category</h2>
            </div>
            <button
              onClick={() => setPage('categories')}
              className="text-sm btn-ghost px-4 py-2 rounded-lg font-medium"
            >
              All Categories →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.slice(0, 7).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setPage('shop')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl card-hover text-center"
                style={{ background: '#0A0A0B', border: '1px solid #2A2A30' }}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium" style={{ color: '#A0A0A8' }}>
                  {cat.name}
                </span>
                <span className="badge" style={{ color: '#555560' }}>
                  {cat.count}
                </span>
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
              <div className="badge mb-2" style={{ color: '#D4A843' }}>
                COLLECTION
              </div>
              <h2 className="text-3xl font-bold text-white">Our Products</h2>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: '#111114' }}>
            {(['featured', 'popular', 'new', 'deals'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                style={
                  activeTab === tab
                    ? { background: '#D4A843', color: '#000' }
                    : { color: '#A0A0A8' }
                }
              >
                {tab === 'new'
                  ? 'New Arrivals'
                  : tab === 'deals'
                    ? 'Hot Deals'
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(filteredProducts.length > 0 ? filteredProducts : products).slice(0, 8).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onView={(prod) => {
                  setSelectedProduct(prod)
                  setPage('product')
                }}
              />
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setPage('shop')}
              className="btn-ghost px-8 py-3 rounded-xl text-base font-semibold"
            >
              View All Products →
            </button>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1A1A1E 0%, #111114 100%)',
              border: '1px solid rgba(212,168,67,0.2)',
            }}
          >
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background: 'radial-gradient(circle at 80% 50%, #D4A843 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <div className="badge mb-2" style={{ color: '#D4A843' }}>
                LIMITED OFFER
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Up to <span className="gold-text">30% OFF</span>
              </h3>
              <p style={{ color: '#A0A0A8' }}>On selected smartphones and laptops this week only</p>
            </div>
            <button
              onClick={() => setPage('deals')}
              className="btn-gold px-8 py-4 rounded-xl font-bold text-lg flex-shrink-0 relative"
            >
              Grab the Deal →
            </button>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 px-4" style={{ background: '#111114' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge mb-2" style={{ color: '#D4A843' }}>
              WHY US
            </div>
            <h2 className="text-3xl font-bold text-white">Why Choose Dubazaarmart</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {whyItems.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl"
                style={{ background: '#0A0A0B', border: '1px solid #2A2A30' }}
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#555560' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge mb-2" style={{ color: '#D4A843' }}>
              REVIEWS
            </div>
            <h2 className="text-3xl font-bold text-white">Customer Stories</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl"
                style={{ background: '#111114', border: '1px solid #2A2A30' }}
              >
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#D4A843">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#A0A0A8' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'rgba(212,168,67,0.2)', color: '#D4A843' }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs" style={{ color: '#555560' }}>
                      {t.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery info */}
      <section className="py-12 px-4" style={{ background: '#111114' }}>
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: '#0A0A0B', border: '1px solid #2A2A30' }}
          >
            <div className="text-4xl mb-4">🇷🇼</div>
            <h3 className="text-2xl font-bold text-white mb-3">Nationwide Delivery in Rwanda</h3>
            <p className="mb-6" style={{ color: '#A0A0A8' }}>
              We deliver to all provinces including Kigali, Northern, Southern, Eastern, and Western
              provinces. Standard delivery 2–3 days, express available.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                ['🏙️', 'Kigali', '1–2 days'],
                ['🌍', 'Other cities', '2–3 days'],
                ['🏡', 'Rural areas', '3–5 days'],
              ].map(([icon, loc, time]) => (
                <div key={String(loc)} className="text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-sm font-medium text-white">{loc}</div>
                  <div className="text-xs" style={{ color: '#D4A843' }}>
                    {time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section
        className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #111114, #0A0A0B)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="badge mb-3" style={{ color: '#D4A843' }}>
            NEWSLETTER
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Stay Ahead of the Deals</h2>
          <p className="mb-8" style={{ color: '#A0A0A8' }}>
            Get notified about flash sales, new arrivals, and exclusive offers.
          </p>
          {subscribed ? (
            <div
              className="py-4 px-6 rounded-xl inline-block"
              style={{
                background: 'rgba(212,168,67,0.1)',
                border: '1px solid rgba(212,168,67,0.3)',
                color: '#D4A843',
              }}
            >
              ✓ You're subscribed! Watch your inbox.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (email) setSubscribed(true)
              }}
              className="flex gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl text-sm"
                required
              />
              <button
                type="submit"
                className="btn-gold px-6 py-3 rounded-xl font-semibold flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 px-4"
        style={{ background: '#0A0A0B', borderTop: '1px solid #1A1A1E' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center gold-gradient">
                  <span className="text-black font-black text-sm">D</span>
                </div>
                <span className="font-bold text-white text-lg">Dubazaarmart</span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#555560' }}>
                Premium electronics from Dubai, delivered to Rwanda. Quality guaranteed.
              </p>
              <div className="text-sm" style={{ color: '#555560' }}>
                <div>📞 +250 788 123 456</div>
                <div>✉️ hello@dubazaarmart.com</div>
                <div>📍 KG 15 Ave, Kigali, Rwanda</div>
              </div>
            </div>
            {[
              {
                title: 'Shop',
                links: [
                  'Smartphones',
                  'Laptops',
                  'Tablets',
                  'Headphones',
                  'Smart Watches',
                  'All Products',
                ],
              },
              {
                title: 'Company',
                links: [
                  'About Us',
                  'Delivery Info',
                  'Contact Us',
                  'Terms & Conditions',
                  'Privacy Policy',
                ],
              },
              {
                title: 'Account',
                links: ['My Account', 'My Orders', 'Wishlist', 'Track Order', 'Returns'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
                <div className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <button
                      key={link}
                      className="text-sm text-left hover:text-white transition-colors"
                      style={{ color: '#555560' }}
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
            <div className="text-sm" style={{ color: '#555560' }}>
              © 2026 Dubazaarmart.com — All rights reserved
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#555560' }}>
                We accept:
              </span>
              <span
                className="badge px-2 py-1 rounded"
                style={{ background: '#1A1A1E', color: '#D4A843', border: '1px solid #2A2A30' }}
              >
                MTN MoMo
              </span>
              <span
                className="badge px-2 py-1 rounded"
                style={{ background: '#1A1A1E', color: '#D4A843', border: '1px solid #2A2A30' }}
              >
                Airtel Money
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
