'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cartStore, useCart } from '../store/cartStore'
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
    <article className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#F8FAFC]">
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.badge && (
            <span className="badge absolute left-3 top-3 rounded-md bg-[#FF6A00] px-2 py-1 font-semibold text-white">
              {product.badge}
            </span>
          )}
          {product.discount > 0 && (
            <span className="badge absolute right-3 top-3 rounded-md bg-[#0A1F44]/85 px-2 py-1 font-semibold text-white">
              -{product.discount}%
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => cartStore.toggleWishlist(product.id)}
          className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white/95 opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
          aria-pressed={inWishlist}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            fill={inWishlist ? '#FF6A00' : 'none'}
            stroke={inWishlist ? '#FF6A00' : '#0A1F44'}
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="badge mb-1 font-semibold text-[#FF6A00]">{product.brand}</div>
        <Link href={productHref} onClick={rememberSelection} className="mb-2 flex-1 leading-snug">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#0A1F44]">{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className="mb-3 flex items-center gap-1.5">
          <div className="flex" role="img" aria-label={`Rated ${product.rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                aria-hidden="true"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill={s <= Math.round(product.rating) ? '#FF6A00' : '#CBD5E1'}
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-[#475569]" aria-label={`${product.reviews} reviews`}>
            ({product.reviews})
          </span>
          <span className="ml-auto text-xs text-[#475569]">{product.warranty}</span>
        </div>

        {/* Price & Cart */}
        <div className="flex flex-col gap-2 border-t border-[#E2E8F0] pt-2.5">
          <Link href={productHref} onClick={rememberSelection}>
            {product.originalPrice > product.price && (
              <div className="text-xs text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
            <div className="text-base font-extrabold text-[#0A1F44]">
              {formatPrice(product.price)}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => cartStore.add(product)}
            className="flex w-full items-center justify-center rounded-full bg-[#FF6A00] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#E55A00] active:scale-95"
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}
