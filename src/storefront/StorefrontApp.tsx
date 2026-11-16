'use client'

import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import AccountPage from './pages/AccountPage'
import CategoriesPage from './pages/CategoriesPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import type { Product } from './data/products'
import { products } from './data/products'

type Page =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'payment-success'
  | 'admin'
  | 'account'
  | 'categories'
  | 'about'
  | 'contact'
  | 'deals'
  | 'wishlist'
  | 'search'

export default function StorefrontApp() {
  const [page, setPage] = useState<Page>('home')
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0])

  function navigate(p: string) {
    if (p === 'admin') {
      window.location.href = '/operations'
      return
    }
    setPage(p as Page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hideNavbar = page === 'admin'

  return (
    <div style={{ background: '#0A0A0B', minHeight: '100vh' }}>
      {!hideNavbar && <Navbar page={page} setPage={navigate} />}

      {page === 'home' && <HomePage setPage={navigate} setSelectedProduct={setSelectedProduct} />}
      {page === 'shop' && <ShopPage setPage={navigate} setSelectedProduct={setSelectedProduct} />}
      {page === 'deals' && <ShopPage setPage={navigate} setSelectedProduct={setSelectedProduct} />}
      {page === 'search' && <ShopPage setPage={navigate} setSelectedProduct={setSelectedProduct} />}
      {page === 'categories' && <CategoriesPage setPage={navigate} />}
      {page === 'product' && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          setPage={navigate}
          setSelectedProduct={setSelectedProduct}
        />
      )}
      {page === 'cart' && <CartPage setPage={navigate} />}
      {page === 'checkout' && <CheckoutPage setPage={navigate} />}
      {page === 'payment-success' && <PaymentSuccessPage setPage={navigate} />}
      {page === 'account' && <AccountPage setPage={navigate} />}
      {page === 'wishlist' && <AccountPage setPage={navigate} />}
      {page === 'about' && <AboutPage setPage={navigate} />}
      {page === 'contact' && <ContactPage />}
    </div>
  )
}
