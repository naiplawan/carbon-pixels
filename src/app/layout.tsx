import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Carbon Footprint Calculator - Interactive Environmental Impact Journey',
  description: 'Discover your carbon footprint through an engaging, hand-drawn interactive experience. Learn about your environmental impact and get personalized tips for sustainable living.',
  keywords: 'carbon footprint, environmental impact, sustainability, climate change, eco-friendly, carbon calculator',
  authors: [{ name: 'Carbon Footprint Calculator Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Carbon Footprint Calculator - Interactive Journey',
    description: 'Discover your environmental impact through an engaging interactive experience',
    type: 'website',
    locale: 'en_US',
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
        <meta name="theme-color" content="#48bb78" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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