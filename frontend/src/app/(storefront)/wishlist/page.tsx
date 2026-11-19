import { createPageMetadata } from '@/lib/seo'
import WishlistPage from '@/views/WishlistPage'

export const metadata = createPageMetadata({
  title: 'Wishlist',
  description: 'View your saved DubazaarMart products.',
  path: '/wishlist',
  noIndex: true,
})

export default function Page() {
  return <WishlistPage />
}
