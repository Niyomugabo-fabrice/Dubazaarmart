import React from 'react'
import type { Metadata } from 'next'
import '@/index.css'
import AppProviders from '@/providers/AppProviders'

export const metadata: Metadata = {
  title: {
    default: 'DubazaarMart - Premium Dubai Electronics in Rwanda',
    template: '%s | DubazaarMart',
  },
  description:
    'Genuine Dubai-sourced smartphones, laptops, smartwatches, and electronics delivered same-day in Kigali, Rwanda.',
  icons: {
    icon: '/site-logo.png?v=9cb290eb',
    apple: '/site-logo.png?v=9cb290eb',
  },
  openGraph: {
    title: 'DubazaarMart - Dubai Wholesale Electronics',
    description: 'Direct Dubai import electronics with official warranties in Rwanda.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-[#111111] antialiased">
        <div id="root">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  )
}
