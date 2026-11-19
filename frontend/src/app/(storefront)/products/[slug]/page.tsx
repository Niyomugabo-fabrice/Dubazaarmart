import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import ProductRoute from '@/components/ProductRoute'
import { findProductBySlug } from '@/lib/product-slug'
import { createProductMetadata, siteUrl } from '@/lib/seo'
import { fetchActiveProducts, fetchPublicCurrency } from '@/lib/server-products'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const products = await fetchActiveProducts()
  const product = findProductBySlug(slug, products)
  if (!product?.slug) notFound()

  const duplicateName = products.filter(
    (candidate) =>
      candidate.name.trim().toLowerCase() === product.name.trim().toLowerCase() &&
      candidate.brand.trim().toLowerCase() === product.brand.trim().toLowerCase(),
  ).length > 1

  return createProductMetadata(product, product.slug, duplicateName)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const products = await fetchActiveProducts()
  const product = findProductBySlug(slug, products)
  if (!product?.slug) notFound()
  if (slug !== product.slug) permanentRedirect(`/products/${encodeURIComponent(product.slug)}`)

  const currency = await fetchPublicCurrency()
  const productUrl = new URL(`/products/${encodeURIComponent(product.slug)}`, siteUrl).toString()
  const images = product.images.filter((image) => /^https?:\/\//i.test(image))
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(images.length ? { image: images } : {}),
    ...(Number.isFinite(product.price) && product.price >= 0 && /^[A-Z]{3}$/.test(currency)
      ? {
          offers: {
            '@type': 'Offer',
            url: productUrl,
            price: product.price,
            priceCurrency: currency,
            availability: product.quantity > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            itemCondition: product.condition === 'New'
              ? 'https://schema.org/NewCondition'
              : 'https://schema.org/RefurbishedCondition',
            seller: { '@type': 'Organization', name: 'DubazaarMart' },
          },
        }
      : {}),
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', siteUrl).toString() },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: new URL('/shop', siteUrl).toString() },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  }
  const jsonLd = JSON.stringify([productJsonLd, breadcrumbJsonLd]).replace(/</g, '\\u003c')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ProductRoute initialProduct={product} />
    </>
  )
}
