'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { Product } from '../data/products'
import { getProductSlug } from './product-slug'

export function pageToPath(page: string): string {
  switch (page) {
    case 'home':
      return '/'
    case 'shop':
      return '/shop'
    case 'products':
      return '/products'
    case 'categories':
      return '/categories'
    case 'deals':
      return '/deals'
    case 'search':
      return '/search'
    case 'about':
      return '/about'
    case 'contact':
      return '/contact'
    case 'cart':
      return '/cart'
    case 'checkout':
      return '/checkout'
    case 'payment-success':
      return '/checkout/success'
    case 'wishlist':
      return '/wishlist'
    case 'admin':
      return '/admin'
    default:
      if (page.startsWith('/')) return page
      return `/${page}`
  }
}

export function useAppNavigation() {
  const router = useRouter()

  const navigate = useCallback((page: string) => {
    const path = pageToPath(page)
    router.push(path)
  }, [router])

  const navigateToProduct = useCallback((product: Product) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('dubazaar_selected_product', JSON.stringify(product))
      } catch {
        // ignore
      }
    }
    const slug = getProductSlug(product)
    router.push(`/products/${slug}`)
  }, [router])

  return { navigate, navigateToProduct, router }
}
