import { createPageMetadata } from '@/lib/seo'
import ShopPage from '@/views/ShopPage'

export const metadata = createPageMetadata({
  title: 'Products',
  description: 'Browse the DubazaarMart electronics catalog.',
  path: '/products',
})

export default function Page() {
  return <ShopPage />
}
