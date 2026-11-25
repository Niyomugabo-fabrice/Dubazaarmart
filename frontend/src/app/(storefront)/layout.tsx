import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { ReactNode } from 'react'

export default function StorefrontLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
