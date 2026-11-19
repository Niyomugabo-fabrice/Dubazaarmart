import type { Metadata } from 'next'
import type { Product } from '../data/products'

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://dubazaarmart.vercel.app'

interface PageMetadataOptions {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  if (noIndex) {
    return {
      title,
      description,
      robots: { index: false, follow: false },
    }
  }

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: 'DubazaarMart',
      locale: 'en_RW',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export function createProductMetadata(
  product: Product,
  canonicalSlug: string,
  duplicateName: boolean,
): Metadata {
  const title = [
    product.name,
    product.brand,
    duplicateName ? `SKU ${product.sku}` : '',
  ].filter(Boolean).join(' | ')
  const description = product.description.trim()
    ? `${product.description.trim()}${duplicateName ? ` SKU ${product.sku}.` : ''}`.slice(0, 160)
    : `Shop ${product.name}${product.brand ? ` by ${product.brand}` : ''} in Rwanda. Check current price and availability${duplicateName ? ` (SKU ${product.sku})` : ''}.`
  const image = product.images[0] || product.image
  const imageUrl = image && /^https?:\/\//i.test(image) ? new URL(image, siteUrl).toString() : undefined
  const path = `/products/${encodeURIComponent(canonicalSlug)}`

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: 'DubazaarMart',
      locale: 'en_RW',
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.name }] } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.name }] } : {}),
    },
  }
}
