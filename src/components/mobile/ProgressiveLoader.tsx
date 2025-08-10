'use client'

import React, { Suspense, lazy, useState, useEffect, memo } from 'react'
import SkeletonLoader from './SkeletonLoader'
import { useNetworkConnection } from '@/hooks/useNetworkConnection'

interface ProgressiveLoaderProps {
  children: React.ReactNode
  skeletonType: 'card' | 'list' | 'scanner' | 'gamification' | 'stats'
  priority?: 'high' | 'medium' | 'low'
  delay?: number
  className?: string
  fallback?: React.ReactNode
}

// Progressive loading wrapper with network awareness
export default function ProgressiveLoader({
  children,
  skeletonType,
  priority = 'medium',
  delay = 0,
  className = '',
  fallback
}: ProgressiveLoaderProps) {
  const [shouldRender, setShouldRender] = useState(priority === 'high')
  const { connectionSpeed, isSlowConnection } = useNetworkConnection()

  useEffect(() => {
    if (priority === 'high') return // Already rendered

    // Adjust delay based on network speed and priority
    let adjustedDelay = delay

    if (isSlowConnection) {
      adjustedDelay = priority === 'medium' ? delay + 500 : delay + 1000
    }

    const timer = setTimeout(() => {
      setShouldRender(true)
    }, adjustedDelay)

    return () => clearTimeout(timer)
  }, [priority, delay, isSlowConnection])

  if (!shouldRender) {
    return fallback || <SkeletonLoader type={skeletonType} className={className} />
  }

  return (
    <Suspense fallback={fallback || <SkeletonLoader type={skeletonType} className={className} />}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  )
}

// HOC for lazy loading components with mobile optimization
export function withProgressiveLoading<P extends object>(
  Component: React.ComponentType<P>,
  skeletonType: 'card' | 'list' | 'scanner' | 'gamification' | 'stats' = 'card',
  options: { priority?: 'high' | 'medium' | 'low'; delay?: number } = {}
) {
  const WrappedComponent = memo((props: P) => (
    <ProgressiveLoader 
      skeletonType={skeletonType} 
      priority={options.priority}
      delay={options.delay}
    >
      <Component {...props} />
    </ProgressiveLoader>
  ))

  WrappedComponent.displayName = `withProgressiveLoading(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Lazy load heavy components for mobile
export const LazyWasteScanner = lazy(() => import('@/components/WasteScanner'))
export const LazyGameificationPanel = lazy(() => import('@/components/GameificationPanel'))
export const LazyThailandCarbonCanvas = lazy(() => import('@/components/ThailandCarbonCanvas'))

// Progressive component loader with viewport detection
export function ViewportProgressiveLoader({
  children,
  skeletonType,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}: {
  children: React.ReactNode
  skeletonType: 'card' | 'list' | 'scanner' | 'gamification' | 'stats'
  threshold?: number
  rootMargin?: string
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, threshold, rootMargin, isVisible])

  return (
    <div ref={setRef} className={className}>
      {isVisible ? (
        <Suspense fallback={<SkeletonLoader type={skeletonType} />}>
          {children}
        </Suspense>
      ) : (
        <SkeletonLoader type={skeletonType} />
      )}
    </div>
  )
}

// Adaptive loading based on device capabilities
export function AdaptiveLoader({
  children,
  skeletonType,
  className = ''
}: {
  children: React.ReactNode
  skeletonType: 'card' | 'list' | 'scanner' | 'gamification' | 'stats'
  className?: string
}) {
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    memory: 4, // GB
    cores: 4,
    connectionSpeed: 'fast'
  })

  useEffect(() => {
    // Detect device capabilities
    const getDeviceInfo = async () => {
      const memory = (navigator as any)?.deviceMemory || 4
      const cores = navigator.hardwareConcurrency || 4
      const connection = (navigator as any)?.connection?.effectiveType || 'fast'

      setDeviceCapabilities({
        memory,
        cores,
        connectionSpeed: connection
      })
    }

    getDeviceInfo()
  }, [])

  // Determine loading strategy based on capabilities
  const shouldUseProgressive = deviceCapabilities.memory < 4 || 
                             deviceCapabilities.cores < 4 ||
                             ['slow-2g', '2g', '3g'].includes(deviceCapabilities.connectionSpeed)

  if (shouldUseProgressive) {
    return (
      <ViewportProgressiveLoader 
        skeletonType={skeletonType} 
        className={className}
        threshold={0.25} // Load when 25% visible for low-end devices
        rootMargin="25px" // Smaller preload margin
      >
        {children}
      </ViewportProgressiveLoader>
    )
  }

  return (
    <ProgressiveLoader 
      skeletonType={skeletonType} 
      priority="high"
      className={className}
    >
      {children}
    </ProgressiveLoader>
  )
}

// Image progressive loading with WebP/AVIF support
export function ProgressiveImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  onError
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')

  useEffect(() => {
    // Check for WebP/AVIF support and serve appropriate format
    const checkFormatSupport = async () => {
      const supportsWebP = await new Promise(resolve => {
        const webP = new Image()
        webP.onload = webP.onerror = () => resolve(webP.height === 2)
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      })

      const supportsAVIF = await new Promise(resolve => {
        const avif = new Image()
        avif.onload = avif.onerror = () => resolve(avif.height === 2)
        avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      })

      // Use the best available format
      let finalSrc = src
      if (supportsAVIF && src.includes('image/')) {
        finalSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.avif')
      } else if (supportsWebP && src.includes('image/')) {
        finalSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      }

      setImageSrc(finalSrc)
    }

    checkFormatSupport()
  }, [src])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    // Fallback to original format
    if (imageSrc !== src) {
      setImageSrc(src)
      setHasError(false)
    } else {
      onError?.()
    }
  }

  if (hasError && imageSrc === src) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div 
          className={`absolute inset-0 animate-pulse bg-gray-200 ${className}`}
          style={{ width, height }}
        />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}