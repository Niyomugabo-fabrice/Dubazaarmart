import { cartStore } from '../store/cartStore'
import { useCart } from '../store/cartStore'
import type { Product } from '../data/products'

interface Props {
  product: Product
  onView: (p: Product) => void
}

export default function ProductCard({ product, onView }: Props) {
  const { wishlist } = useCart()
  const inWishlist = wishlist.includes(product.id)
  const inCart = cartStore.getItems().some((i) => i.product.id === product.id)

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  return (
    <div
      className="card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col"
      style={{ background: '#111114', border: '1px solid #2A2A30' }}
      onClick={() => onView(product)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square product-img-wrap">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badge */}
        {product.badge && (
          <span
            className="absolute top-3 left-3 badge px-2 py-1 rounded-md font-semibold"
            style={{ background: '#D4A843', color: '#000' }}
          >
            {product.badge}
          </span>
        )}
        {product.discount > 0 && (
          <span
            className="absolute top-3 right-3 badge px-2 py-1 rounded-md"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#F0C060',
              border: '1px solid rgba(212,168,67,0.3)',
            }}
          >
            -{product.discount}%
          </span>
        )}
        {/* Wishlist btn */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            cartStore.toggleWishlist(product.id)
          }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid #2A2A30' }}
        >
          <svg
            width="16"
            height="16"
            fill={inWishlist ? '#D4A843' : 'none'}
            stroke={inWishlist ? '#D4A843' : '#A0A0A8'}
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="badge mb-1" style={{ color: '#D4A843' }}>
          {product.brand}
        </div>
        <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 flex-1 leading-snug">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill={s <= Math.round(product.rating) ? '#D4A843' : '#2A2A30'}
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>
          <span className="text-xs" style={{ color: '#555560' }}>
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-base font-bold" style={{ color: '#D4A843' }}>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs line-through" style={{ color: '#555560' }}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            cartStore.add(product)
          }}
          className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
          style={
            inCart
              ? {
                  background: 'rgba(212,168,67,0.15)',
                  color: '#D4A843',
                  border: '1px solid rgba(212,168,67,0.4)',
                }
              : { background: '#1A1A1E', color: '#F5F5F0', border: '1px solid #2A2A30' }
          }
        >
          {inCart ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
