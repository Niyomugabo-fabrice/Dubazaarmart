import type { Metadata } from 'next'
import HomePage from '@/views/HomePage'

export const metadata: Metadata = {
  title: 'DubazaarMart — Discover. Trade. Grow.',
  description:
    'Your one-stop platform for international sourcing, global shipping, wholesale distribution, and retail shopping in Rwanda.',
}

export default function Page() {
  return <HomePage />
}
