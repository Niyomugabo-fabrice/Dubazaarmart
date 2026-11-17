import { useState, useEffect } from 'react'
import { products as initialProducts, type Product } from '../data/products'
import { apiFetch, apiUrl, mediaUrl } from '../services/api-client'

let currentProducts: Product[] = []
let listeners: Array<() => void> = []

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
  try {
    const res = await apiFetch(apiUrl('/api/products'))
    if (!res.ok) return currentProducts
    const data = await res.json()
    if (Array.isArray(data.products)) {
      currentProducts = data.products.map(normalizeProduct)
      notify()
      return currentProducts
    }
  } catch (err) {
    console.warn('Backend products fetch fallback:', err)
  }
  return currentProducts
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('dubazaar_admin_auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` }
      }
    }
  } catch {
    // Malformed or unavailable local session data is treated as unauthenticated.
  }
  return {}
}

export async function addProductToBackend(productData: Partial<Product>): Promise<Product | null> {
  try {
    const res = await apiFetch(apiUrl('/api/products'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
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
      headers: {
        ...getAuthHeader(),
      },
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

// Automatically trigger background fetch once loaded in browser
if (typeof window !== 'undefined') {
  fetchProductsFromBackend()
}

export function useProducts() {
  const [productsList, setProductsList] = useState<Product[]>(currentProducts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const update = () => setProductsList([...currentProducts])
    listeners.push(update)

    // Sync on mount
    fetchProductsFromBackend()

    return () => {
      listeners = listeners.filter(l => l !== update)
    }
  }, [])

  return {
    products: productsList,
    loading,
    refresh: fetchProductsFromBackend,
    addProduct: addProductToBackend,
    deleteProduct: deleteProductFromBackend,
  }
}
