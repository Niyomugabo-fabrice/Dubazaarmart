import type { Metadata } from 'next'
import AccountPage from '@/views/AccountPage'

export const metadata: Metadata = {
  title: 'Wishlist',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AccountPage initialTab="wishlist" />
}
