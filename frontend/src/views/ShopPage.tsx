"use client"

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { categories } from '../data/products'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../store/productsStore'
import { useCategoryImages, type CategoryImageMap } from '../store/categoryImagesStore'
import Image from 'next/image'

interface Props {
  initialCategory?: string
  initialQuery?: string
  initialCategoryImages?: CategoryImageMap
}

const PRODUCT_FAMILY_OPTIONS = [{ id: 'iphone', name: 'iPhone' }]

function normalizeCategory(value?: string) {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  if (!normalized) return 'all'
  return categories.find((category) =>
    category.id.toLowerCase() === normalized || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalized,
  )?.id ?? normalized
}

export default function ShopPage({ initialCategory, initialQuery = '', initialCategoryImages }: Props = {}) {
  const router = useRouter()
  const { products: liveProducts, loading, error, refresh } = useProducts()
  const { categoryImages } = useCategoryImages(initialCategoryImages)
  const products = liveProducts

  const [selectedCategory, setSelectedCategory] = useState(() => normalizeCategory(initialCategory))
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3_000_000])
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => setSelectedCategory(normalizeCategory(initialCategory)), [initialCategory])
  useEffect(() => setSearchQuery(initialQuery), [initialQuery])

  const retailProducts = useMemo(() => {
    return products.filter((product) => !product.listingType || product.listingType === 'retail' || product.listingType === 'both')
  }, [products])

  const brandOptions = useMemo(() => {
    const brands = new Map<string, string>([['samsung', 'Samsung']])
    for (const product of retailProducts) {
      const brand = product.brand.trim()
      if (!brand) continue
      const id = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (id) brands.set(id, brand)
    }
    return [...brands.entries()].map(([id, name]) => ({ id, name }))
  }, [retailProducts])

  const categoryLabel = useMemo(() => {
    const normalized = selectedCategory.toLowerCase()
    return categories.find((category) => category.id.toLowerCase() === normalized || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalized)?.name
      ?? brandOptions.find((brand) => brand.id === normalized || brand.name.toLowerCase() === normalized)?.name
      ?? PRODUCT_FAMILY_OPTIONS.find((option) => option.id === normalized)?.name
      ?? selectedCategory.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
  }, [selectedCategory, brandOptions])

  function selectCategory(category: string) {
    setSelectedCategory(category || 'all')
    setSidebarOpen(false)
    const query = category ? `?category=${encodeURIComponent(category)}` : ''
    router.push(`/shop${query}`, { scroll: false })
  }

  function formatPrice(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    return `${(n / 1000).toFixed(0)}K`
  }

  const categoryProducts = useMemo(() => {
    if (selectedCategory === 'all') return retailProducts
    const normalized = selectedCategory.toLowerCase()
    return retailProducts.filter((product) => {
      const category = product.category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const brand = product.brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return category === normalized || brand === normalized || (normalized === 'iphone' && /iphone/i.test(product.name))
    })
  }, [retailProducts, selectedCategory])

  const filtered = useMemo(() => {
    let list = [...categoryProducts]
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'discount') list.sort((a, b) => b.discount - a.discount)
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    return list
  }, [categoryProducts, sortBy, priceRange, searchQuery])

  // A JSX element rather than a nested component: a component defined inside
  // ShopPage would be a new type on every render, remounting the filters and
  // resetting the rail's scroll position on each filter click.
  const filterPanels = (
    <div>
      {/* Categories */}
      <div className="p-5 rounded-2xl mb-4" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
        <h3 className="font-bold text-[#111111] mb-4 text-sm">Categories</h3>
        <button
          type="button"
          onClick={() => selectCategory('')}
          aria-pressed={selectedCategory === 'all'}
          className="w-full text-left flex items-center justify-between py-2 px-3 rounded-lg mb-1 text-sm transition-all"
          style={selectedCategory === 'all' ? { background: 'rgba(255,106,0,0.15)', color: '#FF6A00' } : { color: '#111111' }}
        >
          <span>All Products</span>
          <span className="badge" style={{ color: 'inherit' }}>{products.length}</span>
        </button>
        {categories.map((cat) => {
          const imageUrl = categoryImages[cat.id]
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className="w-full text-left flex items-center justify-between py-2 px-3 rounded-lg mb-1 text-sm transition-all"
              style={selectedCategory === cat.id ? { background: 'rgba(255,106,0,0.15)', color: '#FF6A00' } : { color: '#111111' }}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-200">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="h-9 w-9 object-cover"
                    />
                  ) : null}
                </span>
                <span>{cat.name}</span>
              </span>
            </button>
          )
        })}
        {brandOptions.length > 0 && (
          <>
            <h4 className="mt-4 mb-2 px-3 text-xs font-bold uppercase tracking-wide text-[#0B5B24]">Brands</h4>
            {[...brandOptions, ...PRODUCT_FAMILY_OPTIONS.filter((option) => !brandOptions.some((brand) => brand.id === option.id))].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectCategory(option.id)}
                aria-pressed={selectedCategory === option.id}
                className="w-full text-left flex items-center justify-between py-2 px-3 rounded-lg mb-1 text-sm transition-all"
                style={selectedCategory === option.id ? { background: 'rgba(255,106,0,0.15)', color: '#FF6A00' } : { color: '#111111' }}
              >
                <span>{option.name}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Price range */}
      <div className="p-5 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
        <h3 className="font-bold text-[#111111] mb-4 text-sm">Price Range</h3>
        <div className="space-y-2">
          {[[0, 200_000], [200_000, 500_000], [500_000, 1_000_000], [1_000_000, 3_000_000]].map(([min, max]) => (
            <button
              key={`${min}-${max}`}
              type="button"
              onClick={() => setPriceRange([min, max])}
              aria-pressed={priceRange[0] === min && priceRange[1] === max}
              className="w-full text-left py-2 px-3 rounded-lg text-sm transition-all"
              style={priceRange[0] === min && priceRange[1] === max
                ? { background: 'rgba(255,106,0,0.15)', color: '#FF6A00' }
                : { color: '#111111' }
              }
            >
              {min === 0 ? `Under RWF ${formatPrice(max)}` : `RWF ${formatPrice(min)} – ${formatPrice(max)}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPriceRange([0, 3_000_000])}
            aria-pressed={priceRange[0] === 0 && priceRange[1] === 3_000_000}
            className="w-full text-left py-2 px-3 rounded-lg text-sm transition-all"
            style={priceRange[0] === 0 && priceRange[1] === 3_000_000
              ? { background: 'rgba(255,106,0,0.15)', color: '#FF6A00' }
              : { color: '#111111' }
            }
          >
            All Prices
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-6" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="badge mb-2" style={{ color: '#FF6A00' }}>SHOP</div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold text-[#111111]">
            {selectedCategory === 'all' ? 'All Electronics' : `Showing: ${categoryLabel}`}
          </h1>
          {selectedCategory !== 'all' && (
            <button type="button" onClick={() => selectCategory('')} className="btn-ghost rounded-lg px-4 py-2 text-sm font-semibold">
              Clear filter / View all products
            </button>
          )}
        </div>

        {/* Search + Sort bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <label htmlFor="product-search" className="sr-only">Search products and brands</label>
            <input
              id="product-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
            />
            <svg className="absolute left-3 top-3.5" width="16" height="16" fill="none" stroke="#0B5B24" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <label htmlFor="product-sort" className="sr-only">Sort products</label>
          <select
            id="product-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Best Rated</option>
            <option value="discount">Biggest Discount</option>
          </select>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden px-4 py-3 rounded-xl text-sm btn-ghost"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-product-filters"
          >
            Filters
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-16 flex gap-8">
        {/* Sidebar desktop: sticky, scrolls independently of the product grid */}
        <aside aria-label="Product filters" className="shop-filters-rail hidden lg:block w-64 flex-shrink-0">
          {filterPanels}
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 h-full w-full cursor-default" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)} aria-label="Close product filters" />
            <aside id="mobile-product-filters" aria-label="Product filters" className="absolute left-0 top-0 bottom-0 w-72 p-4 overflow-y-auto overscroll-contain" style={{ background: '#FFFFFF' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-[#111111]">Filters</h2>
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg px-3 py-2 text-sm btn-ghost" aria-label="Close product filters">Close</button>
              </div>
              {filterPanels}
            </aside>
          </div>
        )}

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm" style={{ color: '#0B5B24' }}>
              <span className="text-[#111111] font-medium">{filtered.length}</span> products found
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="status" aria-live="polite" aria-label="Loading products">
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
            <div className="text-center py-24" style={{ color: '#0B5B24' }} role="alert">
              <div className="text-lg font-medium text-[#111111] mb-2">Products could not be loaded</div>
              <p className="text-sm mb-4">{error}</p>
              <button onClick={() => void refresh()} className="btn-gold px-5 py-2.5 rounded-xl font-semibold">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24" style={{ color: '#0B5B24' }}>
              <div className="text-lg font-medium text-[#111111] mb-2">
                {selectedCategory !== 'all' && categoryProducts.length === 0 ? 'No products in this category yet' : 'No products found'}
              </div>
              {selectedCategory !== 'all' && categoryProducts.length === 0 ? (
                <button type="button" onClick={() => selectCategory('')} className="btn-gold mt-4 rounded-xl px-5 py-2.5 font-semibold">
                  View all products
                </button>
              ) : (
                <div className="text-sm">Try adjusting your filters or search query</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
