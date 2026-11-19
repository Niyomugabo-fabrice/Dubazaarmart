import { createPageMetadata } from '@/lib/seo'
import ShopPage from '@/views/ShopPage'

export const metadata = createPageMetadata({
  title: 'Shop Electronics',
  description: 'Browse DubazaarMart electronics and filter by category, price, rating, and deals.',
  path: '/shop',
})

type Props = {
  searchParams: Promise<{ category?: string | string[] }>
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams
  const category = Array.isArray(params.category) ? params.category[0] : params.category
  return <ShopPage initialCategory={category} />
}
