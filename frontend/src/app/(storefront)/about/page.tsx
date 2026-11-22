import { createPageMetadata } from '@/lib/seo'
import AboutPage from '@/views/AboutPage'

export const metadata = createPageMetadata({
  title: 'About DubazaarMart',
  description: 'Learn about DubazaarMart electronics, product sourcing, and shipping services from China and Dubai to Rwanda.',
  path: '/about',
})

export default function Page() {
  return <AboutPage />
}
