import { createPageMetadata } from '@/lib/seo'
import CartPage from '@/views/CartPage'

export const metadata = createPageMetadata({
  title: 'Shopping Cart',
  description: 'Review items in your DubazaarMart shopping cart.',
  path: '/cart',
  noIndex: true,
})

export default function Page() {
  return <CartPage />
}
