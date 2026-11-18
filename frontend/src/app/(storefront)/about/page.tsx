import type { Metadata } from 'next'
import AboutPage from '@/views/AboutPage'

export const metadata: Metadata = {
  title: 'About DubazaarMart',
  description: 'Learn about DubazaarMart and our Dubai-sourced electronics in Rwanda.',
}

export default function Page() {
  return <AboutPage />
}
