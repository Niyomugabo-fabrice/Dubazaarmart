import type { Metadata } from 'next'
import AccountPage from '@/views/AccountPage'

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AccountPage showSignup />
}
