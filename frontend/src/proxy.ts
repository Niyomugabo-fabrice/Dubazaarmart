import { NextResponse, type NextRequest } from 'next/server'
import { findProductBySlug } from './lib/product-slug'
import { fetchActiveProducts } from './lib/server-products'

export async function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.slice('/products/'.length))
  const products = await fetchActiveProducts()
  const product = findProductBySlug(slug, products)

  if (!product?.slug) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 })
  }

  if (slug !== product.slug) {
    return NextResponse.redirect(
      new URL(`/products/${encodeURIComponent(product.slug)}`, request.url),
      308,
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/products/:slug+'],
}
