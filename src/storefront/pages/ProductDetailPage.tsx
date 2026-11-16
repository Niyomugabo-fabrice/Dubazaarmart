import { useState } from 'react'
import { cartStore, useCart } from '../store/cartStore'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import type { Product } from '../data/products'

interface Props {
  product: Product
  setPage: (p: string) => void
  setSelectedProduct: (p: Product) => void
}

export default function ProductDetailPage({ product, setPage, setSelectedProduct }: Props) {
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'warranty'>('desc')
  const { wishlist } = useCart()
  const inWishlist = wishlist.includes(product.id)

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  function addAndGo() {
    cartStore.add(product, qty)
    setPage('cart')
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#0A0A0B' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-6 text-sm" style={{ color: '#555560' }}>
          <button onClick={() => setPage('home')} className="hover:text-white transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => setPage('shop')} className="hover:text-white transition-colors">
            Shop
          </button>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div
              className="rounded-3xl overflow-hidden aspect-square mb-4 product-img-wrap"
              style={{ border: '1px solid #2A2A30' }}
            >
              <img
                src={product.images[activeImage] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="w-20 h-20 rounded-xl overflow-hidden"
                    style={{ border: `2px solid ${activeImage === i ? '#D4A843' : '#2A2A30'}` }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {product.badge && (
                <span
                  className="badge px-3 py-1 rounded-full"
                  style={{ background: '#D4A843', color: '#000' }}
                >
                  {product.badge}
                </span>
              )}
              <span
                className="badge px-3 py-1 rounded-full"
                style={{ background: '#1A1A1E', color: '#A0A0A8', border: '1px solid #2A2A30' }}
              >
                {product.condition}
              </span>
            </div>

            <div className="badge mb-2" style={{ color: '#D4A843' }}>
              {product.brand}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={s <= Math.round(product.rating) ? '#D4A843' : '#2A2A30'}
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
              </div>
              <span className="font-bold text-white">{product.rating}</span>
              <span className="text-sm" style={{ color: '#555560' }}>
                ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold gold-text">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-xl line-through" style={{ color: '#555560' }}>
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span
                    className="badge px-2 py-1 rounded"
                    style={{
                      background: 'rgba(212,168,67,0.15)',
                      color: '#D4A843',
                      border: '1px solid rgba(212,168,67,0.3)',
                    }}
                  >
                    Save {formatPrice(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    product.quantity > 5 ? '#22c55e' : product.quantity > 0 ? '#f59e0b' : '#ef4444',
                }}
              />
              <span className="text-sm" style={{ color: '#A0A0A8' }}>
                {product.quantity > 5
                  ? 'In Stock'
                  : product.quantity > 0
                    ? `Only ${product.quantity} left`
                    : 'Out of Stock'}
              </span>
              <span className="badge ml-2" style={{ color: '#555560' }}>
                SKU: {product.sku}
              </span>
            </div>

            {/* Qty + Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ border: '1px solid #2A2A30' }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-white hover:bg-white/5 transition-colors"
                >
                  −
                </button>
                <span className="px-4 font-mono text-white">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.quantity, q + 1))}
                  className="px-4 py-3 text-white hover:bg-white/5 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => cartStore.add(product, qty)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm btn-ghost"
              >
                Add to Cart
              </button>
              <button
                onClick={addAndGo}
                className="flex-1 py-3 rounded-xl font-bold text-sm btn-gold"
              >
                Buy Now
              </button>
              <button
                onClick={() => cartStore.toggleWishlist(product.id)}
                className="p-3 rounded-xl transition-colors"
                style={{
                  border: '1px solid #2A2A30',
                  background: inWishlist ? 'rgba(212,168,67,0.1)' : 'transparent',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill={inWishlist ? '#D4A843' : 'none'}
                  stroke={inWishlist ? '#D4A843' : '#A0A0A8'}
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Warranty */}
            <div
              className="p-4 rounded-xl text-sm"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              <span style={{ color: '#D4A843' }}>🛡️ </span>
              <span style={{ color: '#A0A0A8' }}>{product.warranty}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-16">
          <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#111114' }}>
            {(['desc', 'specs', 'warranty'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
                style={
                  activeTab === tab
                    ? { background: '#D4A843', color: '#000' }
                    : { color: '#A0A0A8' }
                }
              >
                {tab === 'desc' ? 'Description' : tab === 'specs' ? 'Specifications' : 'Warranty'}
              </button>
            ))}
          </div>

          <div
            className="p-6 rounded-2xl"
            style={{ background: '#111114', border: '1px solid #2A2A30' }}
          >
            {activeTab === 'desc' && (
              <p className="leading-relaxed" style={{ color: '#A0A0A8' }}>
                {product.description}
              </p>
            )}
            {activeTab === 'specs' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex gap-4 py-3 px-4 rounded-xl"
                    style={{ background: '#1A1A1E' }}
                  >
                    <span
                      className="text-sm font-medium w-32 flex-shrink-0"
                      style={{ color: '#D4A843' }}
                    >
                      {key}
                    </span>
                    <span className="text-sm" style={{ color: '#A0A0A8' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'warranty' && (
              <p className="leading-relaxed" style={{ color: '#A0A0A8' }}>
                {product.warranty}. Contact us within 7 days for any defects or concerns.
              </p>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => (
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
          </div>
        )}
      </div>
    </div>
  )
}
