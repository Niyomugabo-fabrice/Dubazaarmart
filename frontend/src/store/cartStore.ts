import { useState, useEffect } from 'react'
import type { Product } from '../data/products'

export interface CartItem {
  product: Product
  quantity: number
}

const CART_KEY = 'dubazaarmart_cart'
const WISHLIST_KEY = 'dubazaarmart_wishlist'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function loadWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWishlist(ids: string[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
}

let cartListeners: (() => void)[] = []
let items: CartItem[] = loadCart()
let wishlistIds: string[] = loadWishlist()

function notify() {
  cartListeners.forEach(fn => fn())
}

export const cartStore = {
  getItems: () => items,
  getWishlist: () => wishlistIds,
  add(product: Product, qty = 1) {
    const existing = items.find(i => i.product.id === product.id)
    if (existing) {
      existing.quantity += qty
    } else {
      items = [...items, { product, quantity: qty }]
    }
    saveCart(items)
    notify()
  },
  remove(productId: string) {
    items = items.filter(i => i.product.id !== productId)
    saveCart(items)
    notify()
  },
  updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      this.remove(productId)
      return
    }
    items = items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    saveCart(items)
    notify()
  },
  clear() {
    items = []
    saveCart(items)
    notify()
  },
  toggleWishlist(productId: string) {
    if (wishlistIds.includes(productId)) {
      wishlistIds = wishlistIds.filter(id => id !== productId)
    } else {
      wishlistIds = [...wishlistIds, productId]
    }
    saveWishlist(wishlistIds)
    notify()
  },
  subscribe(fn: () => void) {
    cartListeners.push(fn)
    return () => { cartListeners = cartListeners.filter(l => l !== fn) }
  },
}

export function useCart() {
  const [, forceUpdate] = useState(0)
  useEffect(() => cartStore.subscribe(() => forceUpdate(n => n + 1)), [])
  const cartItems = cartStore.getItems()
  const wishlist = cartStore.getWishlist()
  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const delivery = cartItems.length > 0 ? 10_000 : 0
  const total = subtotal + delivery
  const count = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  return { cartItems, wishlist, subtotal, delivery, total, count }
}
