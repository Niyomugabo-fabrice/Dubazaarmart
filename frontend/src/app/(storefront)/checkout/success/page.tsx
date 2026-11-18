import type { Metadata } from 'next'
import PaymentSuccessPage from '@/views/PaymentSuccessPage'

export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <PaymentSuccessPage />
}
