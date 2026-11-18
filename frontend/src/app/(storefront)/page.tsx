import type { Metadata } from 'next'
import HomePage from '@/views/HomePage'

export const metadata: Metadata = {
  title: 'Dubai Wholesale Electronics in Rwanda',
  description: 'Shop genuine Dubai-sourced smartphones, laptops, smartwatches, and electronics delivered across Rwanda.',
}

export default function Page() {
  return <HomePage />
}
