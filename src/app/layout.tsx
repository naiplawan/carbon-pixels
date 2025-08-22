import type { Metadata } from 'next'
import { Patrick_Hand, Kalam } from 'next/font/google'
import './globals.css'

const patrickHand = Patrick_Hand({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-handwritten'
})

const kalam = Kalam({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sketch'
})

export const metadata: Metadata = {
  title: 'Thailand Waste Diary - Carbon Credits Tracker',
  description: 'Track daily waste, earn carbon credits, help Thailand reach 2050 carbon neutrality',
  keywords: 'thailand, waste tracking, carbon credits, sustainability, gamification, eco-friendly',
  authors: [{ name: 'Carbon Pixels Team' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Thailand Waste Diary - Carbon Credits Tracker',
    description: 'Track daily waste, earn carbon credits, help Thailand reach 2050 carbon neutrality',
    type: 'website',
    locale: 'th_TH',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Waste Diary',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

import { MobileNavigationLayout, NavigationStyles } from '@/components/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Waste Diary" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Fonts are now optimized via Next.js font optimization */}
        {/* Preload critical JSON data */}
        <link rel="modulepreload" href="/src/data/thailand-waste-categories.json" />
        
        {/* Mobile viewport optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${patrickHand.variable} ${kalam.variable} overflow-x-hidden`}>
        {/* Inject navigation styles */}
        <NavigationStyles />
        
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-500 text-white px-4 py-2 rounded-lg z-[60] shadow-lg">
          Skip to main content
        </a>
        
        {/* Main navigation layout wrapper */}
        <MobileNavigationLayout>
          <main id="main-content" role="main" className="focus:outline-none">
            {children}
          </main>
        </MobileNavigationLayout>
      </body>
    </html>
  )
}