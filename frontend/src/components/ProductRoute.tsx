'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductDetailPage from '../views/ProductDetailPage'
import type { Product } from '../data/products'
import { findProductBySlug } from '../lib/product-slug'
import { fetchProductsFromBackend, useProducts } from '../store/productsStore'

const SELECTED_PRODUCT_KEY = 'dubazaar_selected_product'

export default function ProductRoute({ slug }: { slug: string }) {
  const { products, loading, error, refresh } = useProducts()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [catalogLoaded, setCatalogLoaded] = useState(false)

  useEffect(() => {
    let active = true
    setCatalogLoaded(false)

    try {
      const stored = window.sessionStorage.getItem(SELECTED_PRODUCT_KEY)
      if (stored) {
        const product = JSON.parse(stored) as Product
        const matchingProduct = findProductBySlug(slug, [product])
        if (matchingProduct) setSelectedProduct(matchingProduct)
      }
    } catch {
      setSelectedProduct(null)
    }

    void fetchProductsFromBackend().finally(() => {
      if (active) setCatalogLoaded(true)
    })

    return () => {
      active = false
    }
  }, [slug])

  const cachedProduct = selectedProduct ? findProductBySlug(slug, [selectedProduct]) : undefined
  const product = findProductBySlug(slug, products) ?? cachedProduct
  if (product) return <ProductDetailPage key={product.id} product={product} />

  if (loading || !catalogLoaded) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" role="status" aria-live="polite">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FFB800] border-t-transparent" />
        <span className="sr-only">Loading product</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 text-center" style={{ background: '#FFFFFF' }}>
        <div>
          <h1 className="text-2xl font-bold text-[#111111] mb-3">Product could not be loaded</h1>
          <p className="text-sm mb-6" style={{ color: '#0B5B24' }}>{error}</p>
          <button onClick={() => void refresh()} className="rounded-xl px-6 py-3 font-bold btn-gold">Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 text-center" style={{ background: '#FFFFFF' }}>
      <div>
        <h1 className="text-2xl font-bold text-[#111111] mb-3">Product not found</h1>
        <p className="text-sm mb-6" style={{ color: '#0B5B24' }}>This product may no longer be available.</p>
        <Link href="/shop" className="inline-block rounded-xl px-6 py-3 font-bold btn-gold">Browse Products</Link>
      </div>
    </div>
  )
}
