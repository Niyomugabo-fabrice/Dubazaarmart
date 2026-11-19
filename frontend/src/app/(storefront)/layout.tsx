import Navbar from '@/components/Navbar'
import type { ReactNode } from 'react'

export default function StorefrontLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>{children}</main>
    </>
  )
}
