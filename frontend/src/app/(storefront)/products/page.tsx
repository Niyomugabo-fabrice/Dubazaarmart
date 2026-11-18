import type { Metadata } from 'next'
import ShopPage from '@/views/ShopPage'

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse the DubazaarMart electronics catalog.',
}

export default function Page() {
  return <ShopPage />
}
