import type { Metadata } from 'next'
import ProductRoute from '@/components/ProductRoute'
import { findProductBySlug } from '@/lib/product-slug'
import { createPageMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = findProductBySlug(slug)
  return createPageMetadata({
    title: product ? product.name : 'Product Details',
    description: product?.description ?? 'View product details and availability at DubazaarMart.',
    path: `/products/${encodeURIComponent(slug)}`,
  })
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <ProductRoute slug={slug} />
}
