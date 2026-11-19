import { createPageMetadata } from '@/lib/seo'
import AboutPage from '@/views/AboutPage'

export const metadata = createPageMetadata({
  title: 'About DubazaarMart',
  description: 'Learn about DubazaarMart and our Dubai-sourced electronics in Rwanda.',
  path: '/about',
})

export default function Page() {
  return <AboutPage />
}
