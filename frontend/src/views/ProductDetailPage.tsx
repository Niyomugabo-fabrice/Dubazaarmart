"use client"

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cartStore, useCart } from '../store/cartStore'
import ProductCard from '../components/ProductCard'
import type { Product } from '../data/products'
import { useProducts } from '../store/productsStore'
import { useAppNavigation } from '../lib/navigation'

interface Props {
  product: Product
}

export default function ProductDetailPage({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'warranty'>('desc')
  const { wishlist } = useCart()
  const { products } = useProducts()
  const { navigate } = useAppNavigation()
  const inWishlist = wishlist.includes(product.id)

  const moq = Math.max(1, product.moq ?? 1)
  const isWholesaleTier = Boolean(
    product.wholesalePrice != null &&
    product.wholesalePrice > 0 &&
    product.listingType !== 'retail' &&
    qty >= moq,
  )
  const currentUnitPrice = isWholesaleTier ? product.wholesalePrice! : product.price

  const related = useMemo(
    () => products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4),
    [products, product.category, product.id],
  )

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  function addAndGo() {
    cartStore.add(product, qty)
    navigate('cart')
  }

  return (
    <div className="min-h-screen pt-6 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-6 text-sm" style={{ color: '#0B5B24' }}>
          <Link href="/" className="hover:text-[#111111] transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop" className="hover:text-[#111111] transition-colors">Shop</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#111111]">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="relative rounded-3xl overflow-hidden aspect-square mb-4 product-img-wrap" style={{ border: '1px solid #FFB800' }}>
              <Image
                src={product.images[activeImage] || product.image}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden"
                    style={{ border: `2px solid ${activeImage === i ? '#FF6A00' : '#FFB800'}` }}
                    aria-label={`View product image ${i + 1}`}
                    aria-pressed={activeImage === i}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {product.badge && (
                <span className="badge px-3 py-1 rounded-full" style={{ background: '#FF6A00', color: '#000' }}>{product.badge}</span>
              )}
              <span className="badge px-3 py-1 rounded-full" style={{ background: '#F1FFF0', color: '#111111', border: '1px solid #FFB800' }}>{product.condition}</span>
            </div>

            <div className="badge mb-2" style={{ color: '#FF6A00' }}>{product.brand}</div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#111111] mb-4 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex" role="img" aria-label={`Rated ${product.rating} out of 5`}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(product.rating) ? '#FF6A00' : '#FFB800'}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <span className="font-bold text-[#111111]">{product.rating}</span>
              <span className="text-sm" style={{ color: '#0B5B24' }}>({product.reviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-3">
                {isWholesaleTier ? (
                  <>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-purple-700">Wholesale Price (MOQ {moq} hit!)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-purple-900">{formatPrice(currentUnitPrice)}</span>
                        {product.price > currentUnitPrice && (
                          <span className="text-base line-through text-slate-400">Retail: {formatPrice(product.price)}</span>
                        )}
                      </div>
                    </div>
                    <span className="badge px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-bold text-xs border border-purple-300">
                      Save {formatPrice(product.price - currentUnitPrice)} / unit
                    </span>
                  </>
                ) : (
                  <>
                    {product.originalPrice > product.price && (
                      <span className="text-xl line-through" style={{ color: '#0B5B24' }}>{formatPrice(product.originalPrice)}</span>
                    )}
                    <span className="text-4xl font-bold gold-text">{formatPrice(product.price)}</span>
                    {product.originalPrice > product.price && (
                      <span className="badge px-2 py-1 rounded" style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.3)' }}>
                        Save {formatPrice(product.originalPrice - product.price)}
                      </span>
                    )}
                  </>
                )}
              </div>
              {qty > 1 && (
                <div className="text-xs font-semibold text-[#0B5B24]">
                  Total: {formatPrice(currentUnitPrice * qty)} ({qty} units × {formatPrice(currentUnitPrice)})
                </div>
              )}
            </div>

            {/* Wholesale Tier Notice */}
            {product.wholesalePrice != null && product.listingType !== 'retail' && (
              <div className={`mb-6 rounded-2xl border p-4 transition-colors ${
                isWholesaleTier ? 'border-purple-400 bg-purple-100/70' : 'border-purple-200 bg-purple-50/70'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      {isWholesaleTier ? '✓ Wholesale Pricing Active' : 'Wholesale & Bulk Price'}
                    </span>
                    <div className="mt-0.5 text-xl font-extrabold text-purple-900">
                      {formatPrice(product.wholesalePrice)} <span className="text-xs font-normal text-purple-700">/ unit</span>
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isWholesaleTier ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
                  }`}>
                    MOQ: {moq} units
                  </div>
                </div>
                <p className="mt-1 text-xs text-purple-800">
                  {isWholesaleTier
                    ? `Great news! You reached the MOQ (${moq} units). Wholesale price of ${formatPrice(product.wholesalePrice)} / unit is now applied to this order.`
                    : `Add ${moq - qty} more unit${moq - qty === 1 ? '' : 's'} to hit the MOQ (${moq} units) and unlock wholesale price of ${formatPrice(product.wholesalePrice)} / unit!`
                  }
                </p>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full" style={{ background: product.quantity > 5 ? '#17D719' : product.quantity > 0 ? '#FFB800' : '#FF6A00' }} />
              <span className="text-sm" style={{ color: '#111111' }}>
                {product.quantity > 5 ? 'In Stock' : product.quantity > 0 ? `Only ${product.quantity} left` : 'Out of Stock'}
              </span>
              <span className="badge ml-2" style={{ color: '#0B5B24' }}>SKU: {product.sku}</span>
            </div>

            {/* Qty + Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #FFB800' }}>
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-[#111111] hover:bg-white/5 transition-colors" aria-label="Decrease quantity" disabled={qty <= 1}>−</button>
                <span className="px-4 font-mono text-[#111111]" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(product.quantity, q + 1))} className="px-4 py-3 text-[#111111] hover:bg-white/5 transition-colors" aria-label="Increase quantity" disabled={qty >= product.quantity}>+</button>
              </div>
              <button type="button" onClick={() => cartStore.add(product, qty)} className="flex-1 py-3 rounded-xl font-semibold text-sm btn-ghost" disabled={product.quantity <= 0}>
                Add to Cart
              </button>
              <button type="button" onClick={addAndGo} className="flex-1 py-3 rounded-xl font-bold text-sm btn-gold" disabled={product.quantity <= 0}>
                Buy Now
              </button>
              <button type="button" onClick={() => cartStore.toggleWishlist(product.id)} className="p-3 rounded-xl transition-colors" style={{ border: '1px solid #FFB800', background: inWishlist ? 'rgba(255,106,0,0.1)' : 'transparent' }} aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`} aria-pressed={inWishlist}>
                <svg width="18" height="18" fill={inWishlist ? '#FF6A00' : 'none'} stroke={inWishlist ? '#FF6A00' : '#111111'} strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* Warranty */}
            <div className="p-4 rounded-xl text-sm" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
              <span style={{ color: '#FF6A00' }}>🛡️ </span>
              <span style={{ color: '#111111' }}>{product.warranty}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-16">
          <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#FFF7E8' }}>
            {(['desc', 'specs', 'warranty'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
                style={activeTab === tab ? { background: '#FF6A00', color: '#000' } : { color: '#111111' }}
              >
                {tab === 'desc' ? 'Description' : tab === 'specs' ? 'Specifications' : 'Warranty'}
              </button>
            ))}
          </div>

          <div className="p-6 rounded-2xl" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
            {activeTab === 'desc' && (
              <p className="leading-relaxed" style={{ color: '#111111' }}>{product.description}</p>
            )}
            {activeTab === 'specs' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex gap-4 py-3 px-4 rounded-xl" style={{ background: '#F1FFF0' }}>
                    <span className="text-sm font-medium w-32 flex-shrink-0" style={{ color: '#FF6A00' }}>{key}</span>
                    <span className="text-sm" style={{ color: '#111111' }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'warranty' && (
              <p className="leading-relaxed" style={{ color: '#111111' }}>{product.warranty}. Contact us within 7 days for any defects or concerns.</p>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#111111] mb-6">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
