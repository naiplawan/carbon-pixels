'use client'

import React from 'react'

interface SkeletonLoaderProps {
  type: 'card' | 'list' | 'scanner' | 'gamification' | 'stats'
  count?: number
  className?: string
}

export default function SkeletonLoader({ type, count = 1, className = '' }: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded-lg"
  
  const renderCardSkeleton = () => (
    <div className={`${baseClasses} p-4 space-y-3 ${className}`}>
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  )

  const renderListSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${baseClasses} p-3 flex items-center space-x-3`}>
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderScannerSkeleton = () => (
    <div className={`${baseClasses} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-300 rounded w-32"></div>
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
        </div>
      </div>
      
      {/* Camera area */}
      <div className="p-6">
        <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center mb-6">
          <div className="text-4xl text-gray-400">📷</div>
        </div>
        
        {/* Category grid */}
        <div className="grid grid-cols-2 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`${baseClasses} p-3 text-center`}>
              <div className="h-8 w-8 bg-gray-300 rounded mx-auto mb-2"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGamificationSkeleton = () => (
    <div className={`${baseClasses} p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
        <div className="h-16 w-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${baseClasses} p-3 text-center`}>
            <div className="h-6 w-6 bg-gray-300 rounded mx-auto mb-2"></div>
            <div className="h-5 bg-gray-300 rounded w-8 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
      
      {/* Daily goals */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`${baseClasses} p-2 flex justify-between items-center`}>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStatsSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Today's summary */}
      <div className={`${baseClasses} p-4`}>
        <div className="flex justify-between items-center mb-3">
          <div className="h-5 bg-gray-300 rounded w-32"></div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-300 rounded w-12 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent entries */}
      <div className={`${baseClasses} p-4`}>
        <div className="h-5 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return renderCardSkeleton()
      case 'list':
        return renderListSkeleton()
      case 'scanner':
        return renderScannerSkeleton()
      case 'gamification':
        return renderGamificationSkeleton()
      case 'stats':
        return renderStatsSkeleton()
      default:
        return renderCardSkeleton()
    }
  }

  return (
    <div role="status" aria-label="Loading content...">
      {renderSkeleton()}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Optimized skeleton for mobile viewport
export function MobileSkeletonLayout() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header skeleton */}
      <div className="bg-white shadow-sm p-4">
        <div className="animate-pulse flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="p-4 space-y-6">
        <SkeletonLoader type="stats" />
        <SkeletonLoader type="gamification" />
        <SkeletonLoader type="list" count={3} />
      </div>
    </div>
  )
}

// Progressive image placeholder
export function ImageSkeleton({ 
  width = '100%', 
  height = '200px',
  className = '' 
}: {
  width?: string
  height?: string
  className?: string
}) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
      style={{ width, height }}
      role="img"
      aria-label="Loading image..."
    >
      <div className="text-2xl text-gray-400">🖼️</div>
    </div>
  )
}