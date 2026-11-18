import type { Metadata } from 'next'
import ShopPage from '@/views/ShopPage'

export const metadata: Metadata = {
  title: 'Deals',
  description: 'Browse current DubazaarMart electronics deals.',
}

export default function Page() {
  return <ShopPage />
}
