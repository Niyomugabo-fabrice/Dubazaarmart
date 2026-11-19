import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'
import { fetchActiveProducts } from '@/lib/server-products'

const publicRoutes = [
  { path: '/', priority: 1 },
  { path: '/shop', priority: 0.9 },
  { path: '/categories', priority: 0.8 },
  { path: '/deals', priority: 0.8 },
  { path: '/about', priority: 0.5 },
  { path: '/contact', priority: 0.5 },
]

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchActiveProducts()
  const routes: MetadataRoute.Sitemap = publicRoutes.map(({ path, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority,
  }))

  const categories = [
    ...new Map(
      products
        .map((product) => product.category.trim())
        .filter(Boolean)
        .map((category) => [category.toLowerCase(), category]),
    ).values(),
  ]
  for (const category of categories) {
    routes.push({
      url: new URL(`/shop?category=${encodeURIComponent(category)}`, siteUrl).toString(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  for (const product of products) {
    const lastModified = product.updatedAt || product.createdAt
    const parsedDate = lastModified ? new Date(lastModified) : null
    routes.push({
      url: new URL(`/products/${encodeURIComponent(product.slug)}`, siteUrl).toString(),
      ...(parsedDate && !Number.isNaN(parsedDate.getTime()) ? { lastModified: parsedDate } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  return routes
}
