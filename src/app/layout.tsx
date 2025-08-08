import type { Metadata } from 'next'
import './globals.css'

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
        
        {/* Optimized font loading with Next.js font optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Patrick+Hand:wght@400&family=Kalam:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload critical font files */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/patrickhand/v18/LDIxapCSOBg7S-QT7q4AOeekkvQ.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Preload critical JSON data */}
        <link rel="modulepreload" href="/src/data/thailand-waste-categories.json" />
      </head>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-leaf text-white px-4 py-2 rounded-lg z-50">
          Skip to main content
        </a>
        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  )
}