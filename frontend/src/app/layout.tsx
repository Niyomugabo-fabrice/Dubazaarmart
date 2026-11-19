import React from 'react'
import type { Metadata } from 'next'
import '@/index.css'
import AppProviders from '@/providers/AppProviders'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dubazaarmart.vercel.app'),
  title: {
    default: 'DubazaarMart - Premium Dubai Electronics in Rwanda',
    template: '%s | DubazaarMart',
  },
  description:
    'Genuine Dubai-sourced smartphones, laptops, smartwatches, and electronics delivered same-day in Kigali, Rwanda.',
  icons: {
    icon: '/site-icon.png',
    apple: '/site-icon.png',
  },
  openGraph: {
    title: 'DubazaarMart - Dubai Wholesale Electronics',
    description: 'Direct Dubai import electronics with official warranties in Rwanda.',
    type: 'website',
    siteName: 'DubazaarMart',
    locale: 'en_RW',
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
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
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
