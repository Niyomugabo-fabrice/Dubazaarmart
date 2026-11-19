import { apiUrl, mediaUrl } from '../services/api-client'
import type { Product } from '../data/products'

const CATALOG_REVALIDATE_SECONDS = 300

type PublicProduct = Product & { slug: string }

export async function fetchActiveProducts(): Promise<PublicProduct[]> {
  const response = await fetch(apiUrl('/api/products'), {
    next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ['product-catalog'] },
  })
  if (!response.ok) {
    throw new Error(`The product catalog could not be loaded (HTTP ${response.status}).`)
  }

  const payload: unknown = await response.json()
  if (!isRecord(payload) || !Array.isArray(payload.products)) {
    throw new Error('The product catalog returned an invalid response.')
  }

  return payload.products.map(normalizeProduct).filter((product) => product.active)
}

export async function fetchPublicCurrency(): Promise<string> {
  const response = await fetch(apiUrl('/api/settings'), {
    next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ['store-settings'] },
  })
  if (!response.ok) {
    throw new Error(`Store currency could not be loaded (HTTP ${response.status}).`)
  }

  const payload: unknown = await response.json()
  if (
    !isRecord(payload) ||
    !isRecord(payload.settings) ||
    typeof payload.settings.currency !== 'string' ||
    !payload.settings.currency.trim()
  ) {
    throw new Error('Store settings returned an invalid currency.')
  }
  return payload.settings.currency.trim().toUpperCase()
}

function normalizeProduct(value: unknown): PublicProduct {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.category !== 'string' ||
    typeof value.brand !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.sku !== 'string' ||
    typeof value.price !== 'number' ||
    typeof value.originalPrice !== 'number' ||
    typeof value.discount !== 'number' ||
    typeof value.quantity !== 'number' ||
    typeof value.active !== 'boolean' ||
    typeof value.featured !== 'boolean' ||
    typeof value.rating !== 'number' ||
    typeof value.reviews !== 'number' ||
    (value.condition !== 'New' && value.condition !== 'Refurbished')
  ) {
    throw new Error('The product catalog contains an invalid product record.')
  }

  const image = typeof value.image === 'string' ? mediaUrl(value.image) : ''
  const images = Array.isArray(value.images)
    ? value.images.filter((image): image is string => typeof image === 'string').map(mediaUrl)
    : []
  const specs: Record<string, string> = {}
  if (isRecord(value.specs)) {
    for (const [key, spec] of Object.entries(value.specs)) {
      if (typeof spec === 'string' || typeof spec === 'number') specs[key] = String(spec)
    }
  }

  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
    category: value.category,
    brand: value.brand,
    description: value.description,
    price: value.price,
    originalPrice: value.originalPrice,
    discount: value.discount,
    image,
    images: images.length ? images : image ? [image] : [],
    quantity: value.quantity,
    sku: value.sku,
    condition: value.condition,
    specs,
    warranty: typeof value.warranty === 'string' ? value.warranty : '',
    featured: value.featured,
    active: value.active,
    rating: value.rating,
    reviews: value.reviews,
    ...(typeof value.badge === 'string' ? { badge: value.badge } : {}),
    ...(typeof value.createdAt === 'string' ? { createdAt: value.createdAt } : {}),
    ...(typeof value.updatedAt === 'string' ? { updatedAt: value.updatedAt } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
