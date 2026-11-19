import { createPageMetadata } from '@/lib/seo'
import PaymentSuccessPage from '@/views/PaymentSuccessPage'

export const metadata = createPageMetadata({
  title: 'Order Confirmation',
  description: 'Your DubazaarMart order confirmation.',
  path: '/checkout/success',
  noIndex: true,
})

export default function Page() {
  return <PaymentSuccessPage />
}
