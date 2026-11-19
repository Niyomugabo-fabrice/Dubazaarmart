import { createPageMetadata } from '@/lib/seo'
import ContactPage from '@/views/ContactPage'

export const metadata = createPageMetadata({
  title: 'Contact DubazaarMart',
  description: 'Contact DubazaarMart customer support in Rwanda.',
  path: '/contact',
})

export default function Page() {
  return <ContactPage />
}
