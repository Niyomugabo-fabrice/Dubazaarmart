import { useState, useEffect } from 'react'
import { products as initialProducts, type Product } from '../data/products'

let currentProducts: Product[] = []
let listeners: Array<() => void> = []

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export async function fetchProductsFromBackend(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products')
    if (!res.ok) return currentProducts
    const data = await res.json()
    if (Array.isArray(data.products)) {
      currentProducts = data.products
      notify()
      return currentProducts
    }
  } catch (err) {
    console.warn('Backend products fetch fallback:', err)
  }
  return currentProducts
}

export async function addProductToBackend(productData: Partial<Product>): Promise<Product | null> {
  try {
    const res = await fetch('/api/products', {
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
    const newProduct: Product = data.product

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
    const res = await fetch(`/api/admin/products/${id}`, {
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

// Automatically trigger background fetch once loaded
fetchProductsFromBackend()

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
