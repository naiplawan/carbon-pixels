/**
 * PWA Test Page - Test all PWA features for Thailand Waste Diary
 */

'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the PWA test component to prevent SSR issues
const PWATestContent = dynamic(
  () => import('./PWATestContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PWA Test Suite...</p>
        </div>
      </div>
    )
  }
)

export default function PWATestPage() {
  return <PWATestContent />
}