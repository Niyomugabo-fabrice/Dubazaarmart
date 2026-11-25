import type { Metadata } from 'next'
import WholesalePage from '@/views/WholesalePage'

export const metadata: Metadata = {
  title: 'Wholesale & Distribution',
  description: 'Bulk purchasing with flexible MOQ and quantity-based wholesale pricing in Rwanda.',
}

export default function Page() {
  return <WholesalePage />
}
