import type { Metadata } from 'next'
import ShopPage from '@/views/ShopPage'

type Props = {
  searchParams: Promise<{ q?: string | string[] }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const query = Array.isArray(params.q) ? params.q[0] : params.q
  return {
    title: query ? `Search: ${query}` : 'Search Products',
    description: 'Search the DubazaarMart electronics catalog.',
  }
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams
  const query = Array.isArray(params.q) ? params.q[0] : params.q
  return <ShopPage key={query ?? 'all'} initialQuery={query ?? ''} />
}
