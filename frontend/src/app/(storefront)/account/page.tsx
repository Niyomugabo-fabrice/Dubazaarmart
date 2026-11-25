import type { Metadata } from 'next'
import AccountPage from '@/views/AccountPage'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'View your order history, wishlist, and DubazaarMart account details.',
}

export default function Page() {
  return <AccountPage />
}
