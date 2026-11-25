import type { Metadata } from 'next'
import ShippingPage from '@/views/ShippingPage'

export const metadata: Metadata = {
  title: 'Import & Logistics',
  description: 'Air and sea freight shipping from China, Dubai, and global markets to Rwanda with DubazaarMart.',
}

export default function Page() {
  return <ShippingPage />
}
