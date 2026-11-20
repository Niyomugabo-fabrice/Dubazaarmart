import { createPageMetadata } from '@/lib/seo'
import { fetchPublicCategoryImages } from '@/lib/categoryImagesApi'
import CategoriesPage from '@/views/CategoriesPage'

export const metadata = createPageMetadata({
  title: 'Categories',
  description: 'Browse DubazaarMart electronics by category.',
  path: '/categories',
})

export default async function Page() {
  const imagesResult = await Promise.allSettled([fetchPublicCategoryImages()])
  const initialCategoryImages = imagesResult[0].status === 'fulfilled'
    ? Object.fromEntries(imagesResult[0].value.map(({ categoryId, imageUrl }) => [categoryId, imageUrl]))
    : undefined

  return <CategoriesPage initialCategoryImages={initialCategoryImages} />
}
