import type { Product } from '../data/products'
import { products as fallbackProducts } from '../data/products'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getProductSlug(product: Product): string {
  if (product.slug?.trim()) return product.slug.trim().toLowerCase()
  const base = slugify(product.name)
  const catalog = fallbackProducts.some((item) => item.id === product.id)
    ? fallbackProducts
    : [...fallbackProducts, product]
  const duplicateName = catalog.filter((item) => slugify(item.name) === base).length > 1
  return base ? (duplicateName ? `${base}-${product.id}` : base) : product.id
}

export function findProductBySlug(
  slug: string,
  productList: Product[] = fallbackProducts,
): Product | undefined {
  if (!slug) return undefined
  const decoded = slug.toLowerCase().trim()

  const byCanonicalSlug = productList.find((product) => getProductSlug(product) === decoded)
  if (byCanonicalSlug) return byCanonicalSlug

  const byId = productList.find((product) => product.id.toLowerCase() === decoded)
  if (byId) return byId

  const bySku = productList.find((product) => product.sku && product.sku.toLowerCase() === decoded)
  if (bySku) return bySku

  return productList.find((product) =>
    decoded === `${slugify(product.name)}-${product.id.toLowerCase()}` ||
    decoded === `${slugify(product.name)}-${product.sku.toLowerCase()}` ||
    decoded.endsWith(`-${product.id.toLowerCase()}`),
  )
}
