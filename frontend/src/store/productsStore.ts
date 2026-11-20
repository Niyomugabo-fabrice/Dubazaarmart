import { useState, useEffect } from 'react'
import type { Product } from '../data/products'
import { apiFetch, apiUrl, mediaUrl } from '../services/api-client'

let currentProducts: Product[] = []
let listeners: Array<() => void> = []
let productsLoading = true
let productsInitialized = false
let productsError: string | null = null
let productsRequest: Promise<Product[]> | null = null

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    image: mediaUrl(product.image),
    images: Array.isArray(product.images)
      ? product.images.map(mediaUrl)
      : [mediaUrl(product.image)],
  }
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export async function fetchProductsFromBackend(): Promise<Product[]> {
  if (productsRequest) return productsRequest

  productsLoading = !productsInitialized
  productsError = null
  notify()

  productsRequest = (async () => {
    try {
      const res = await apiFetch(apiUrl('/api/products'))
      if (!res.ok) {
        productsError = `Could not load products (HTTP ${res.status}).`
        return currentProducts
      }
      const data = await res.json()
      if (Array.isArray(data.products)) {
        currentProducts = data.products.map(normalizeProduct)
        productsInitialized = true
        return currentProducts
      }
      productsError = 'The product catalog response was invalid.'
    } catch (err) {
      productsError = 'Could not load products. Check your connection and try again.'
      console.warn('Backend products fetch failed:', err)
    } finally {
      productsLoading = false
      productsRequest = null
      notify()
    }
    return currentProducts
  })()

  return productsRequest
}

export async function addProductToBackend(productData: Partial<Product>): Promise<Product | null> {
  try {
    const res = await apiFetch(apiUrl('/api/products'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to add product')
    }

    const data = await res.json()
    const newProduct = normalizeProduct(data.product)

    // Prepend to current products in memory and notify all components
    currentProducts = [newProduct, ...currentProducts.filter(p => p.id !== newProduct.id)]
    notify()
    return newProduct
  } catch (err) {
    console.error('Error adding product:', err)
    throw err
  }
}

export async function deleteProductFromBackend(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(apiUrl(`/api/admin/products/${id}`), {
      method: 'DELETE',
    })
    if (res.ok) {
      currentProducts = currentProducts.filter(p => p.id !== id)
      notify()
      return true
    }
  } catch (err) {
    console.error('Error deleting product:', err)
  }
  return false
}

export function useProducts(initialProducts?: Product[]) {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts ?? currentProducts)
  const [loading, setLoading] = useState(initialProducts === undefined && productsLoading)
  const [error, setError] = useState<string | null>(initialProducts === undefined ? productsError : null)

  useEffect(() => {
    if (initialProducts !== undefined && currentProducts.length === 0 && !productsRequest) {
      currentProducts = initialProducts
      productsInitialized = true
      productsLoading = false
      productsError = null
    }

    const update = () => {
      setProductsList([...currentProducts])
      setLoading(productsLoading)
      setError(productsError)
    }
    listeners.push(update)
    update()

    // Sync on mount
    fetchProductsFromBackend()

    return () => {
      listeners = listeners.filter(l => l !== update)
    }
  }, [])

  return {
    products: productsList,
    loading,
    error,
    refresh: fetchProductsFromBackend,
    addProduct: addProductToBackend,
    deleteProduct: deleteProductFromBackend,
  }
}
