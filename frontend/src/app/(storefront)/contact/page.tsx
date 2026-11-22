import { createPageMetadata } from '@/lib/seo'
import ContactPage from '@/views/ContactPage'

export const metadata = createPageMetadata({
  title: 'Contact DubazaarMart',
  description: 'Contact DubazaarMart for product sourcing and shipping quotes from China or Dubai to Rwanda.',
  path: '/contact',
})

export default function Page() {
  return <ContactPage />
}
