import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

const publicRoutes = [
  { path: '/', priority: 1 },
  { path: '/shop', priority: 0.9 },
  { path: '/products', priority: 0.9 },
  { path: '/categories', priority: 0.8 },
  { path: '/deals', priority: 0.8 },
  { path: '/about', priority: 0.5 },
  { path: '/contact', priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ path, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority,
  }))
}
