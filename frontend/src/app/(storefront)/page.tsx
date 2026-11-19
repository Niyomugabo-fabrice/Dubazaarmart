import { createPageMetadata } from '@/lib/seo'
import HomePage from '@/views/HomePage'

export const metadata = createPageMetadata({
  title: 'Dubai Wholesale Electronics in Rwanda',
  description: 'Shop genuine Dubai-sourced smartphones, laptops, smartwatches, and electronics delivered across Rwanda.',
  path: '/',
})

export default function Page() {
  return <HomePage />
}
