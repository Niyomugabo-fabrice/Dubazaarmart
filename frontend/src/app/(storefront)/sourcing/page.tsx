import type { Metadata } from 'next'
import SourcingPage from '@/views/SourcingPage'

export const metadata: Metadata = {
  title: 'International Sourcing',
  description: 'Source verified products directly from suppliers in China, Dubai, and global markets with DubazaarMart.',
}

export default function Page() {
  return <SourcingPage />
}
