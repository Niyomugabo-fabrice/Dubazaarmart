import { createPageMetadata } from '@/lib/seo'
import CheckoutPage from '@/views/CheckoutPage'

export const metadata = createPageMetadata({
  title: 'Checkout',
  description: 'Complete your DubazaarMart order securely.',
  path: '/checkout',
  noIndex: true,
})

export default function Page() {
  return <CheckoutPage />
}
