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
  const base = slugify(product.name)
  return base ? `${base}-${product.id}` : product.id
}

export function findProductBySlug(
  slug: string,
  productList: Product[] = fallbackProducts,
): Product | undefined {
  if (!slug) return undefined
  const decoded = decodeURIComponent(slug).toLowerCase().trim()

  // 1. Direct match on id
  const byId = productList.find(p => p.id.toLowerCase() === decoded)
  if (byId) return byId

  // 2. Direct match on sku
  const bySku = productList.find(p => p.sku && p.sku.toLowerCase() === decoded)
  if (bySku) return bySku

  // 3. Exact slug match
  const bySlug = productList.find(p => getProductSlug(p).toLowerCase() === decoded)
  if (bySlug) return bySlug

  // 4. Name slug match
  const byNameSlug = productList.find(p => slugify(p.name).toLowerCase() === decoded)
  if (byNameSlug) return byNameSlug

  // 5. Match if ends with -{id}
  const bySuffix = productList.find(p => decoded.endsWith(`-${p.id.toLowerCase()}`))
  if (bySuffix) return bySuffix

  return undefined
}
