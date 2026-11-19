import { createPageMetadata } from '@/lib/seo'
import ShopPage from '@/views/ShopPage'

export const metadata = createPageMetadata({
  title: 'Deals',
  description: 'Browse current DubazaarMart electronics deals.',
  path: '/deals',
})

export default function Page() {
  return <ShopPage />
}
