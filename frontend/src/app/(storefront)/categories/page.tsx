import type { Metadata } from 'next'
import CategoriesPage from '@/views/CategoriesPage'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse DubazaarMart electronics by category.',
}

export default function Page() {
  return <CategoriesPage />
}
