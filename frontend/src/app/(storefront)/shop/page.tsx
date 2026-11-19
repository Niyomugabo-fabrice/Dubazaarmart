import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { categories as knownCategories } from '@/data/products'
import { fetchActiveProducts } from '@/lib/server-products'
import ShopPage from '@/views/ShopPage'

type Props = {
  searchParams: Promise<{ category?: string | string[] }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const category = Array.isArray(params.category) ? params.category[0] : params.category
  if (!category) {
    return createPageMetadata({
      title: 'Shop Electronics',
      description: 'Browse DubazaarMart electronics and filter by category, price, rating, and deals.',
      path: '/shop',
    })
  }

  const products = await fetchActiveProducts()
  const categoryProducts = products.filter(
    (product) => product.category.trim().toLowerCase() === category.trim().toLowerCase(),
  )
  if (!categoryProducts.length) {
    return createPageMetadata({
      title: 'Shop Electronics',
      description: 'Browse the DubazaarMart electronics catalog.',
      path: '/shop',
      noIndex: true,
    })
  }

  const knownCategory = knownCategories.find(
    (candidate) => candidate.id.toLowerCase() === category.toLowerCase(),
  )
  const canonicalCategory = categoryProducts[0].category.trim()
  const categoryName = knownCategory?.name ?? category
  const brands = [...new Set(categoryProducts.map((product) => product.brand).filter(Boolean))]
  const description = `Shop ${categoryName} in Rwanda at DubazaarMart. Browse ${categoryProducts.length} products${brands.length ? ` from ${brands.slice(0, 3).join(', ')}` : ''}.`
  return createPageMetadata({
    title: `${categoryName} in Rwanda`,
    description: description.slice(0, 160),
    path: `/shop?category=${encodeURIComponent(canonicalCategory)}`,
  })
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams
  const category = Array.isArray(params.category) ? params.category[0] : params.category
  return <ShopPage initialCategory={category} />
}
