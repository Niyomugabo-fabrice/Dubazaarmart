import { useEffect, useSyncExternalStore } from 'react'
import type { Product } from '../data/products'

export interface CartItem {
  product: Product
  quantity: number
}

const EMPTY_CART_ITEMS: CartItem[] = []
const EMPTY_WISHLIST: string[] = []
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
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // Keep the in-memory cart usable when browser storage is unavailable or full.
  }
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
let items: CartItem[] = []
let wishlistIds: string[] = []
let hasHydrated = false

function notify() {
  cartListeners.forEach(fn => fn())
}

function hydrate() {
  if (hasHydrated || typeof window === 'undefined') return
  items = loadCart()
  wishlistIds = loadWishlist()
  hasHydrated = true
  notify()
}

export const cartStore = {
  getItems: () => items,
  getWishlist: () => wishlistIds,
  hydrate,
  add(product: Product, qty = 1) {
    hydrate()
    const existing = items.find(i => i.product.id === product.id)
    if (existing) {
      items = items.map(item => item.product.id === product.id
        ? { ...item, quantity: item.quantity + qty }
        : item)
    } else {
      items = [...items, { product, quantity: qty }]
    }
    saveCart(items)
    notify()
  },
  remove(productId: string) {
    hydrate()
    items = items.filter(i => i.product.id !== productId)
    saveCart(items)
    notify()
  },
  updateQty(productId: string, qty: number) {
    hydrate()
    if (qty <= 0) {
      this.remove(productId)
      return
    }
    items = items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    saveCart(items)
    notify()
  },
  clear() {
    hydrate()
    items = []
    saveCart(items)
    notify()
  },
  toggleWishlist(productId: string) {
    hydrate()
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

export function getProductUnitPrice(product: Product, quantity: number): number {
  const moq = Math.max(1, product.moq ?? 1)
  if (product.wholesalePrice != null && product.wholesalePrice > 0 && quantity >= moq) {
    return product.wholesalePrice
  }
  return product.price
}

export function isWholesalePriceApplied(product: Product, quantity: number): boolean {
  const moq = Math.max(1, product.moq ?? 1)
  return Boolean(product.wholesalePrice != null && product.wholesalePrice > 0 && quantity >= moq)
}

export function useCart() {
  useEffect(() => cartStore.hydrate(), [])
  const cartItems = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getItems,
    () => EMPTY_CART_ITEMS,
  )
  const wishlist = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getWishlist,
    () => EMPTY_WISHLIST,
  )
  const subtotal = cartItems.reduce((sum, i) => {
    const unitPrice = getProductUnitPrice(i.product, i.quantity)
    return sum + unitPrice * i.quantity
  }, 0)
  const delivery = cartItems.length > 0 ? 10_000 : 0
  const total = subtotal + delivery
  const count = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  return { cartItems, wishlist, subtotal, delivery, total, count }
}
