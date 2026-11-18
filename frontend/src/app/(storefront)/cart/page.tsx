import type { Metadata } from 'next'
import CartPage from '@/views/CartPage'

export const metadata: Metadata = {
  title: 'Shopping Cart',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CartPage />
}
