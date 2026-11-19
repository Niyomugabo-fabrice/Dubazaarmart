"use client"

import { useState, useMemo, useEffect } from 'react'
import { categories } from '../data/products'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../store/productsStore'
import { useCategoryImages } from '../store/categoryImagesStore'
import Image from 'next/image'

interface Props {
  initialCategory?: string
  initialQuery?: string
}

export default function ShopPage({ initialCategory, initialQuery = '' }: Props = {}) {
  const { products: liveProducts, loading, error, refresh } = useProducts()
  const { categoryImages } = useCategoryImages()
  const products = liveProducts

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3_000_000])
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => setSelectedCategory(initialCategory || 'all'), [initialCategory])
  useEffect(() => setSearchQuery(initialQuery), [initialQuery])

  function formatPrice(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    return `${(n / 1000).toFixed(0)}K`
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (selectedCategory !== 'all') list = list.filter(p => p.category === selectedCategory)
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'discount') list.sort((a, b) => b.discount - a.discount)
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    return list
  }, [products, selectedCategory, sortBy, priceRange, searchQuery])

  const Sidebar = () => (
    <div className="w-64 flex-shrink-0">
      {/* Categories */}
      <div className="p-5 rounded-2xl mb-4" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
        <h3 className="font-bold text-[#111111] mb-4 text-sm">Categories</h3>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
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
              onClick={() => setSelectedCategory(cat.id)}
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
    <div className="min-h-screen pt-20" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="badge mb-2" style={{ color: '#FF6A00' }}>SHOP</div>
        <h1 className="text-4xl font-bold text-[#111111] mb-6">All Electronics</h1>

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
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" className="absolute inset-0 h-full w-full cursor-default" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)} aria-label="Close product filters" />
            <aside id="mobile-product-filters" aria-label="Product filters" className="absolute left-0 top-0 bottom-0 w-72 p-4 overflow-y-auto" style={{ background: '#FFFFFF' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-[#111111]">Filters</h2>
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg px-3 py-2 text-sm btn-ghost" aria-label="Close product filters">Close</button>
              </div>
              <Sidebar />
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
              <div className="text-5xl mb-4">🔍</div>
              <div className="text-lg font-medium text-[#111111] mb-2">No products found</div>
              <div className="text-sm">Try adjusting your filters or search query</div>
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
