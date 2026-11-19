import { createPageMetadata } from '@/lib/seo'
import CategoriesPage from '@/views/CategoriesPage'

export const metadata = createPageMetadata({
  title: 'Categories',
  description: 'Browse DubazaarMart electronics by category.',
  path: '/categories',
})

export default function Page() {
  return <CategoriesPage />
}
