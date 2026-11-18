import type { Metadata } from 'next'
import ContactPage from '@/views/ContactPage'

export const metadata: Metadata = {
  title: 'Contact DubazaarMart',
  description: 'Contact DubazaarMart customer support in Rwanda.',
}

export default function Page() {
  return <ContactPage />
}
