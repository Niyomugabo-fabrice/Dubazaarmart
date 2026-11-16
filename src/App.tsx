import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import AdminPage from './pages/AdminPage'
import AccountPage from './pages/AccountPage'
import CategoriesPage from './pages/CategoriesPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import type { Product } from './data/products'
import { products } from './data/products'
import type { CustomerOrderReceipt } from './lib/dashboardApi'

type Page = 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'payment-success' | 'admin' | 'account' | 'categories' | 'about' | 'contact' | 'deals' | 'wishlist' | 'search'

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.replace('#', '') as Page
    const validPages: Page[] = ['home', 'shop', 'product', 'cart', 'checkout', 'payment-success', 'admin', 'account', 'categories', 'about', 'contact', 'deals', 'wishlist', 'search']
    if (hash && validPages.includes(hash)) return hash
    const stored = sessionStorage.getItem('dubazaar_active_page') as Page
    if (stored && validPages.includes(stored)) return stored
    return 'home'
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null)
  const [orderReceipt, setOrderReceipt] = useState<CustomerOrderReceipt | null>(null)

  function navigate(p: string) {
    setPage(p as Page)
    sessionStorage.setItem('dubazaar_active_page', p)
    window.location.hash = p
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hideNavbar = page === 'admin'

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      {!hideNavbar && <Navbar page={page} setPage={navigate} />}

      {page === 'home' && (
        <HomePage setPage={navigate} setSelectedProduct={setSelectedProduct} />
      )}
      {page === 'shop' && (
        <ShopPage setPage={navigate} setSelectedProduct={setSelectedProduct} />
      )}
      {page === 'deals' && (
        <ShopPage setPage={navigate} setSelectedProduct={setSelectedProduct} />
      )}
      {page === 'search' && (
        <ShopPage setPage={navigate} setSelectedProduct={setSelectedProduct} />
      )}
      {page === 'categories' && (
        <CategoriesPage setPage={navigate} />
      )}
      {page === 'product' && selectedProduct && (
        <ProductDetailPage product={selectedProduct} setPage={navigate} setSelectedProduct={setSelectedProduct} />
      )}
      {page === 'cart' && (
        <CartPage setPage={navigate} />
      )}
      {page === 'checkout' && (
        <CheckoutPage setPage={navigate} onOrderPlaced={setOrderReceipt} />
      )}
      {page === 'payment-success' && (
        <PaymentSuccessPage setPage={navigate} order={orderReceipt} />
      )}
      {page === 'account' && (
        <AccountPage setPage={navigate} />
      )}
      {page === 'wishlist' && (
        <AccountPage setPage={navigate} />
      )}
      {page === 'about' && (
        <AboutPage setPage={navigate} />
      )}
      {page === 'contact' && (
        <ContactPage />
      )}
      {page === 'admin' && (
        <AdminPage setPage={navigate} />
      )}
    </div>
  )
}
