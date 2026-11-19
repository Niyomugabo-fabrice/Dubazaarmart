'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cartStore } from '../store/cartStore'
import { useCart } from '../store/cartStore'
import type { Product } from '../data/products'
import { getProductSlug } from '../lib/product-slug'
import { rememberProductSelection } from '../lib/navigation'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { wishlist } = useCart()
  const inWishlist = wishlist.includes(product.id)
  const productHref = `/products/${getProductSlug(product)}`

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  function rememberSelection() {
    rememberProductSelection(product)
  }

  return (
    <article
      className="card-hover rounded-2xl overflow-hidden group flex flex-col"
      style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square product-img-wrap">
        <Link
          href={productHref}
          onClick={rememberSelection}
          aria-label={`View ${product.name} product details`}
          className="absolute inset-0"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 33vw, 50vw"
            unoptimized={product.image.includes('images.unsplash.com')}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.badge && (
            <span className="absolute top-3 left-3 badge px-2 py-1 rounded-md font-semibold" style={{ background: '#FF6A00', color: '#000' }}>
              {product.badge}
            </span>
          )}
          {product.discount > 0 && (
            <span className="absolute top-3 right-3 badge px-2 py-1 rounded-md" style={{ background: 'rgba(0,0,0,0.7)', color: '#FFB800', border: '1px solid rgba(255,106,0,0.3)' }}>
              -{product.discount}%
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => cartStore.toggleWishlist(product.id)}
          className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid #FFB800' }}
          aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
          aria-pressed={inWishlist}
        >
          <svg aria-hidden="true" width="16" height="16" fill={inWishlist ? '#FF6A00' : 'none'} stroke={inWishlist ? '#FF6A00' : '#111111'} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="badge mb-1" style={{ color: '#FF6A00' }}>{product.brand}</div>
        <Link href={productHref} onClick={rememberSelection} className="mb-2 flex-1 leading-snug">
          <h3 className="text-sm font-semibold text-[#111111] line-clamp-2">{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex" role="img" aria-label={`Rated ${product.rating} out of 5`}>
            {[1,2,3,4,5].map(s => (
              <svg key={s} aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill={s <= Math.round(product.rating) ? '#FF6A00' : '#FFB800'}>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            ))}
          </div>
          <span className="text-xs" style={{ color: '#0B5B24' }} aria-label={`${product.reviews} reviews`}>({product.reviews})</span>
          <span className="text-xs ml-auto" style={{ color: '#0B5B24' }}>{product.warranty}</span>
        </div>

        {/* Price & Cart */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
          <Link href={productHref} onClick={rememberSelection}>
            <div className="text-base font-bold text-[#111111]">{formatPrice(product.price)}</div>
            {product.originalPrice > product.price && (
              <div className="text-xs line-through" style={{ color: '#0B5B24' }}>{formatPrice(product.originalPrice)}</div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => cartStore.add(product)}
            className="w-8 h-8 rounded-xl flex items-center justify-center btn-gold text-xs font-bold transition-transform active:scale-90"
            aria-label={`Add ${product.name} to cart`}
          >
            +
          </button>
        </div>
      </div>
    </article>
  )
}
