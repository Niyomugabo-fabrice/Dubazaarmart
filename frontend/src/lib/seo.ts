import type { Metadata } from 'next'

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
