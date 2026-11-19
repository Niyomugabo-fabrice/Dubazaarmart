'use client'

import ProductDetailPage from '../views/ProductDetailPage'
import type { Product } from '../data/products'
import { useProducts } from '../store/productsStore'

export default function ProductRoute({ initialProduct }: { initialProduct: Product }) {
  const { products } = useProducts()
  const product = products.find((candidate) => candidate.id === initialProduct.id) ?? initialProduct
  return <ProductDetailPage key={product.id} product={product} />
}
