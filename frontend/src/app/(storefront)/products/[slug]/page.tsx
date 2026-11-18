import type { Metadata } from 'next'
import ProductRoute from '@/components/ProductRoute'
import { findProductBySlug } from '@/lib/product-slug'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = findProductBySlug(slug)
  return {
    title: product ? product.name : 'Product Details',
    description: product?.description ?? 'View product details and availability at DubazaarMart.',
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <ProductRoute slug={slug} />
}
