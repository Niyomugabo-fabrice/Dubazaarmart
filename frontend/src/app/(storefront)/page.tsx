import { createPageMetadata } from '@/lib/seo'
import { fetchPublicCategoryImages } from '@/lib/categoryImagesApi'
import { fetchActiveProducts } from '@/lib/server-products'
import HomePage from '@/views/HomePage'

export const metadata = createPageMetadata({
  title: 'Electronics & Shipping from China and Dubai',
  description: 'Shop electronics, request product sourcing, or ship purchases from China and Dubai to Rwanda with DubazaarMart.',
  path: '/',
})

export default async function Page() {
  const [productsResult, categoryImagesResult] = await Promise.allSettled([
    fetchActiveProducts(),
    fetchPublicCategoryImages(),
  ])

  if (productsResult.status === 'rejected') {
    console.error('Homepage products could not be preloaded.', productsResult.reason)
  }
  if (categoryImagesResult.status === 'rejected') {
    console.error('Homepage category images could not be preloaded.', categoryImagesResult.reason)
  }

  const initialCategoryImages = categoryImagesResult.status === 'fulfilled'
    ? Object.fromEntries(
        categoryImagesResult.value.map(({ categoryId, imageUrl }) => [categoryId, imageUrl]),
      )
    : undefined

  return (
    <HomePage
      initialProducts={productsResult.status === 'fulfilled' ? productsResult.value : undefined}
      initialCategoryImages={initialCategoryImages}
    />
  )
}
