"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { categories, type Product } from '../data/products'
import ProductCard from '../components/ProductCard'
import SiteLogo from '../components/SiteLogo'
import { useProducts } from '../store/productsStore'
import { useWebsiteSettings } from '../store/settingsStore'
import { swaggerUrl } from '../services/api-client'
import { useAppNavigation } from '../lib/navigation'
import { fetchPublicTestimonials, type Testimonial } from '../lib/testimonialsApi'
import { useCategoryImages, type CategoryImageMap } from '../store/categoryImagesStore'
import { fetchActiveHeroSlides, type HeroSlide } from '../lib/heroSlidesApi'

interface HomePageProps {
  initialProducts?: Product[]
  initialCategoryImages?: CategoryImageMap
}

const HERO_ROTATION_INTERVAL_MS = 5000
const HERO_FALLBACK_IMAGE = '/hero-fallback.svg'
const DEFAULT_HERO_HEADING = "Dubazaarmart"
const DEFAULT_HERO_SUBHEADING = 'Shop authentic electronics sourced from Dubai and China, delivered across Rwanda.'

function isExternalLink(link: string): boolean {
  return /^https?:\/\//i.test(link)
}

function getFooterLinkHref(label: string): string {
  const category = categories.find((item) => item.name.toLowerCase() === label.toLowerCase())
  if (category) return `/shop?category=${encodeURIComponent(category.id)}`

  const links: Record<string, string> = {
    'All Products': '/shop',
    'About Us': '/about',
    'Delivery Info': '/#delivery-info',
    'Contact Us': '/contact',
    'Terms & Conditions': '/contact?topic=terms',
    'Privacy Policy': '/contact?topic=privacy',
    Wishlist: '/wishlist',
    'Track Order': '/contact?topic=tracking',
    Returns: '/contact?topic=returns',
    'Admin Dashboard': '/admin',
    'Create Staff Account': '/admin/register',
  }

  return links[label] ?? '/'
}

function WhyUsIcon({ name }: { name: string }) {
  const iconPaths: Record<string, ReactNode> = {
    plane: <><path d="m3 21 18-9L3 3l3 9-3 9Z" /><path d="M6 12h9" /></>,
    truck: <><path d="M3 6h11v12H3z" /><path d="M14 10h4l3 4v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    shield: <><path d="M12 3 4.5 6v5c0 5 3.2 8.2 7.5 10 4.3-1.8 7.5-5 7.5-10V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    badge: <><circle cx="12" cy="9" r="6" /><path d="m8 14-1 7 5-3 5 3-1-7" /><path d="m10 9 1.3 1.3L14 7.5" /></>,
    returns: <><path d="M3 11a9 9 0 0 1 15.4-6.4L21 7" /><path d="M21 3v4h-4" /><path d="M21 13a9 9 0 0 1-15.4 6.4L3 17" /><path d="M3 21v-4h4" /></>,
    support: <><path d="M3 13v-2a9 9 0 0 1 18 0v2" /><path d="M5 13h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" /><path d="M17 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2z" /><path d="M17 19a5 5 0 0 1-5 3" /></>,
  }

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] ?? iconPaths.shield}
    </svg>
  )
}

export default function HomePage({ initialProducts, initialCategoryImages }: HomePageProps) {
  const { navigate } = useAppNavigation()
  const settings = useWebsiteSettings()
  const { products: liveProducts, loading, error } = useProducts(initialProducts)
  const { categoryImages, error: categoryImagesError } = useCategoryImages(initialCategoryImages)
  const products = liveProducts

  const [activeTab, setActiveTab] = useState<'featured' | 'popular' | 'new' | 'deals'>('featured')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [testimonialError, setTestimonialError] = useState(false)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)

  useEffect(() => {
    let active = true
    void fetchActiveHeroSlides()
      .then((slides) => {
        if (active) setHeroSlides(slides)
      })
      .catch((loadError) => {
        if (!active) return
        console.error('Hero slides could not be loaded. Showing the default hero.', loadError)
        setHeroSlides([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (heroSlides.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = setInterval(() => {
      setCurrentHeroSlide((index) => (index + 1) % heroSlides.length)
    }, HERO_ROTATION_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  useEffect(() => {
    let active = true
    void fetchPublicTestimonials()
      .then((items) => {
        if (!active) return
        setTestimonials(items.filter((item) => item.isVisible))
        setTestimonialError(false)
      })
      .catch((loadError) => {
        if (!active) return
        console.error('Customer testimonials could not be loaded.', loadError)
        setTestimonials([])
        setTestimonialError(true)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredProducts = useMemo(() => products.filter(p => {
    if (activeTab === 'featured') return p.featured
    if (activeTab === 'new') return p.badge === 'New Arrival'
    if (activeTab === 'deals') return p.discount >= 15
    return p.reviews > 150
  }), [products, activeTab])

  const whyItems = [
    { icon: 'plane', title: 'Sourced from Dubai', desc: 'Direct from UAE wholesalers — authentic products at wholesale prices.' },
    { icon: 'truck', title: 'Fast Delivery', desc: 'Nationwide delivery across Rwanda within 2–5 business days.' },
    { icon: 'shield', title: 'Secure Payments', desc: 'Pay securely via MTN Mobile Money or Airtel Money.' },
    { icon: 'badge', title: '100% Authentic', desc: 'Every product is verified genuine with official warranty.' },
    { icon: 'returns', title: 'Easy Returns', desc: '14-day hassle-free returns on all eligible products.' },
    { icon: 'support', title: '24/7 Support', desc: 'Our team is always available via WhatsApp and email.' },
  ]
  const activeHeroSlide = heroSlides[currentHeroSlide]

  function changeHeroSlide(direction: -1 | 1) {
    setCurrentHeroSlide((index) => (index + direction + heroSlides.length) % heroSlides.length)
  }

  function getHeroSlideLink(slide: HeroSlide) {
    const link = slide.buttonLink?.trim() || '/shop'
    if (isExternalLink(link)) return link

    const [path, query = ''] = link.split('?')
    if (path !== '/shop') return link

    const params = new URLSearchParams(query)
    if (params.has('category')) return link

    const slideText = [slide.heading, slide.subheading, slide.buttonText].filter(Boolean).join(' ').toLowerCase()
    const category = categories.find((item) =>
      slideText.includes(item.name.toLowerCase()) || slideText.includes(item.id.replace(/-/g, ' ')),
    )
    const productCategory = [...new Set(products.map((product) => product.category.trim()).filter(Boolean))]
      .find((item) => slideText.includes(item.toLowerCase()))
    const brand = [...new Set(products.map((product) => product.brand.trim()).filter(Boolean))]
      .find((item) => slideText.includes(item.toLowerCase()))
    const categorySlug = /\biphone\b/i.test(slideText)
      ? 'iphone'
      : category?.id ?? productCategory?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        ?? brand?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        ?? slide.heading?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        ?? 'uncategorized'

    return `/shop?category=${encodeURIComponent(categorySlug || 'uncategorized')}`
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Hero */}
      <section
        className="relative mx-3 my-3 overflow-hidden rounded-3xl border-2 border-white/70"
        style={{ background: 'linear-gradient(90deg, #FF6A00 0%, #FFB000 100%)' }}
        role="region"
        aria-label="Homepage hero"
        aria-roledescription={heroSlides.length > 1 ? 'carousel' : undefined}
      >
        <div className="mx-auto grid w-full max-w-7xl items-center gap-2 pl-2 pr-4 py-1 sm:pl-3 sm:py-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12 lg:pl-4 lg:pr-8 lg:py-3">
          <div className="announcement relative z-10 min-w-0">
            <div className="max-w-xl">
              <h1 className="mb-2 whitespace-pre-line font-mono text-xl font-semibold uppercase leading-tight tracking-[0.08em] text-white sm:text-2xl lg:text-3xl">
                {DEFAULT_HERO_HEADING}
              </h1>
              <p className="mb-3 max-w-xl border-l-2 border-[#FF6A00] pl-4 text-sm leading-snug text-white sm:text-base">
                {DEFAULT_HERO_SUBHEADING}
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('shop')} className="rounded-xl border border-[#FF6A00] bg-white px-7 py-2 text-sm font-bold text-[#FF6A00]">
                  Shop Now →
                </button>
                <button onClick={() => navigate('categories')} className="btn-ghost rounded-xl px-7 py-2 text-sm font-bold" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.65)' }}>
                  Browse Categories
                </button>
              </div>
              <div className="mt-3 grid max-w-lg grid-cols-3 gap-4 border-t border-[#F1FFF0] pt-2 sm:gap-6">
                {[
                  { val: '100+', label: 'Products' },
                  { val: '8000+', label: 'Customers' },
                  { val: '4.9★', label: 'Rating' },
                ].map((stat) => (
                  <div key={stat.label}>
                      <div className="text-lg font-bold text-white sm:text-xl">{stat.val}</div>
                    <div className="mt-0.5 text-xs text-white sm:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 min-w-0">
            <div className="mx-auto w-full max-w-[30rem]">
              <div className="rounded-[1.4rem] bg-white p-[3px]">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[1.2rem] bg-white">
                  {heroSlides.length > 0 ? (
                    heroSlides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                          index === currentHeroSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ opacity: index === currentHeroSlide ? 1 : 0 }}
                        aria-hidden="true"
                      >
                        <Image
                          src={slide.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 55vw, 100vw"
                          unoptimized
                          loading={index === currentHeroSlide ? 'eager' : 'lazy'}
                          className="object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <Image
                      src={HERO_FALLBACK_IMAGE}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      loading="eager"
                      className="object-cover"
                    />
                  )}
                  {activeHeroSlide && (
                    isExternalLink(getHeroSlideLink(activeHeroSlide)) ? (
                      <a
                        href={getHeroSlideLink(activeHeroSlide)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Shop ${activeHeroSlide.heading || 'featured'} products`}
                        className="absolute inset-0 z-10"
                      />
                    ) : (
                      <Link
                        href={getHeroSlideLink(activeHeroSlide)}
                        aria-label={`Shop ${activeHeroSlide.heading || 'featured'} products`}
                        className="absolute inset-0 z-10"
                      />
                    )
                  )}
                </div>
              </div>
              {heroSlides.length > 1 && (
                <div className="mt-3 flex items-center justify-between gap-3 text-white">
                  <button
                    type="button"
                    onClick={() => changeHeroSlide(-1)}
                    aria-label="Previous hero slide"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white transition hover:bg-white/10"
                  >
                    ‹
                  </button>
                  <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Hero slides">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={index === currentHeroSlide}
                        aria-label={`Show hero slide ${index + 1} of ${heroSlides.length}`}
                        onClick={() => setCurrentHeroSlide(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentHeroSlide
                            ? 'w-7 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => changeHeroSlide(1)}
                    aria-label="Next hero slide"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white transition hover:bg-white/10"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="py-16 px-4" style={{ background: '#FFF7E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <div className="text-center sm:col-start-2">
              <div className="badge mb-2" style={{ color: '#FF6A00' }}>EXPLORE</div>
              <h2 className="font-mono text-1.7xl font-bold uppercase tracking-[0.08em] text-[#111111]">Shop by Category</h2>
            </div>
            <button onClick={() => navigate('categories')} className="text-sm btn-ghost justify-self-center px-4 py-2 rounded-lg font-medium sm:col-start-3 sm:justify-self-end">
              All Categories →
            </button>
          </div>
          <div className="category-marquee-viewport overflow-hidden" role="region" aria-roledescription="carousel" aria-label="Shop by category">
            <div className="category-marquee-track flex w-max">
              {[...categories, ...categories].map((cat, index) => {
                const imageUrl = categoryImages[cat.id]
                const isDuplicate = index >= categories.length
                return (
                  <button
                    key={`${cat.id}-${index}`}
                    type="button"
                    aria-hidden={isDuplicate}
                    tabIndex={isDuplicate ? -1 : 0}
                    onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.id)}`)}
                    className={`mr-4 flex w-36 flex-shrink-0 flex-col items-center gap-2 rounded-2xl p-3 text-center card-hover sm:w-40 ${
                      isDuplicate ? 'category-marquee-duplicate' : ''
                    }`}
                    style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}
                  >
                    <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gray-200">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt=""
                          width={96}
                          height={96}
                          unoptimized
                          className="h-24 w-24 object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#111111' }}>{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {categoryImagesError && (
            <p role="alert" className="mt-4 text-center text-xs text-[#0B5B24]">
              Category images are temporarily unavailable. Showing placeholders.
            </p>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="text-center">
              <div className="badge mb-2" style={{ color: '#FF6A00' }}>COLLECTION</div>
              <h2 className="font-mono text-1.7xl font-bold uppercase tracking-[0.08em] text-[#111111]">Our Products</h2>
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
              <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="status" aria-live="polite" aria-label="Loading products">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} aria-hidden="true" className="overflow-hidden rounded-2xl border border-[#FFB800] bg-[#FFF7E8]">
                    <div className="shimmer aspect-square" />
                    <div className="space-y-3 p-4">
                      <div className="shimmer h-3 w-1/3 rounded" />
                      <div className="shimmer h-4 w-4/5 rounded" />
                      <div className="shimmer h-4 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
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
      <section className="announcement mx-3 my-3 rounded-3xl border-2 border-white/70 px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge mb-2 text-white">WHY US</div>
            <h2 className="text-2xl font-semibold uppercase text-white sm:text-3xl">Why Choose Dubazaarmart</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {whyItems.map(item => (
              <div key={item.title} className="group relative min-h-[180px] overflow-hidden rounded-2xl p-6" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF6A00]/70 bg-transparent text-white">
                  <WhyUsIcon name={item.icon} />
                </div>
                <h3 className="relative mb-2 text-sm font-bold uppercase text-black">{item.title}</h3>
                <p className="relative text-sm font-bold leading-relaxed text-white">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="badge mb-2" style={{ color: '#FF6A00' }}>REVIEWS</div>
              <h2 className="text-3xl font-bold text-[#111111]">Customer Stories</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-6 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
                  <div className="flex mb-3" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill={star <= testimonial.rating ? '#FF6A00' : '#D1D5DB'}>
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#111111' }}>"{testimonial.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden text-sm font-bold" style={{ background: 'rgba(255,106,0,0.2)', color: '#FF6A00' }}>
                      {testimonial.photoUrl ? (
                        <Image
                          src={testimonial.photoUrl}
                          alt=""
                          width={36}
                          height={36}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        testimonial.customerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#111111]">{testimonial.customerName}</div>
                      {testimonial.role && <div className="text-xs" style={{ color: '#0B5B24' }}>{testimonial.role}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {testimonialError && (
        <div role="alert" className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-[#0B5B24]">
          Customer stories are temporarily unavailable.
        </div>
      )}

      {/* Delivery info */}
      <section id="delivery-info" className="py-12 px-4" style={{ background: '#FFF7E8' }}>
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
            <div role="status" aria-live="polite" className="py-4 px-6 rounded-xl inline-block" style={{ background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF6A00' }}>
              ✓ You're subscribed! Watch your inbox.
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); if (email) setSubscribed(true) }} className="flex gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
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
                <SiteLogo className="h-12 w-12" priority={false} />
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
              { title: 'Explore', links: ['Wishlist', 'Track Order', 'Returns', 'Admin Dashboard', 'Create Staff Account'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-[#111111] mb-4 text-sm">{col.title}</h4>
                <div className="flex flex-col gap-2">
                  {col.links.map(link => (
                    <Link
                      key={link}
                      href={getFooterLinkHref(link)}
                      className="text-sm text-left hover:text-[#111111] transition-colors"
                      style={{ color: '#0B5B24' }}
                    >
                      {link}
                    </Link>
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
