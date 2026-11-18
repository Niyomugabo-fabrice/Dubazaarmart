import type { Metadata } from 'next'
import CheckoutPage from '@/views/CheckoutPage'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CheckoutPage />
}
