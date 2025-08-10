/**
 * Performance optimization utilities for Thailand Waste Diary
 * Optimized for low-end Android devices and 2G/3G networks
 */

import React from 'react'

interface DeviceCapabilities {
  isLowEnd: boolean
  memoryGB: number
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown'
  effectiveType: string
  saveData: boolean
  cores: number
  battery?: {
    level: number
    charging: boolean
  }
}

interface PerformanceSettings {
  enableAnimations: boolean
  imageQuality: 'low' | 'medium' | 'high'
  enableHaptics: boolean
  enableSounds: boolean
  maxConcurrentRequests: number
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal'
  lazyLoading: boolean
  virtualScrolling: boolean
}

class PerformanceOptimizer {
  private capabilities: DeviceCapabilities
  private settings: PerformanceSettings
  private observers: Map<string, PerformanceObserver> = new Map()
  private metrics: Map<string, number> = new Map()

  constructor() {
    this.capabilities = this.detectDeviceCapabilities()
    this.settings = this.generateOptimalSettings()
    this.initializePerformanceMonitoring()
  }

  /**
   * Detect device capabilities for Thai mobile market
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const capabilities: DeviceCapabilities = {
      isLowEnd: false,
      memoryGB: 4, // Default assumption
      connectionType: 'unknown',
      effectiveType: 'unknown',
      saveData: false,
      cores: navigator.hardwareConcurrency || 2
    }

    // Detect memory (if supported)
    if ('memory' in navigator) {
      capabilities.memoryGB = (navigator as any).memory.jsHeapSizeLimit / (1024 ** 3)
    }

    // Detect low-end devices (common in Thailand)
    capabilities.isLowEnd = 
      capabilities.memoryGB < 2 || 
      capabilities.cores <= 2 ||
      /Android [4-6]/.test(navigator.userAgent) ||
      /Android.*[Gg]o/.test(navigator.userAgent) // Android Go

    // Detect connection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      capabilities.connectionType = connection.effectiveType || 'unknown'
      capabilities.effectiveType = connection.effectiveType
      capabilities.saveData = connection.saveData || false
    }

    // Detect battery (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        capabilities.battery = {
          level: battery.level,
          charging: battery.charging
        }
      })
    }

    console.log('[Performance] Device capabilities:', capabilities)
    return capabilities
  }

  /**
   * Generate optimal settings based on device capabilities
   */
  private generateOptimalSettings(): PerformanceSettings {
    const { isLowEnd, connectionType, saveData } = this.capabilities
    
    const settings: PerformanceSettings = {
      enableAnimations: !isLowEnd && connectionType !== 'slow-2g',
      imageQuality: saveData || isLowEnd ? 'low' : connectionType === '2g' ? 'medium' : 'high',
      enableHaptics: !isLowEnd,
      enableSounds: !isLowEnd,
      maxConcurrentRequests: isLowEnd ? 2 : connectionType === '2g' ? 3 : 6,
      cacheStrategy: saveData ? 'minimal' : isLowEnd ? 'moderate' : 'aggressive',
      lazyLoading: true,
      virtualScrolling: isLowEnd
    } as PerformanceSettings

    console.log('[Performance] Optimal settings:', settings)
    return settings
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    // Monitor Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.set('lcp', lastEntry.startTime)
        
        // Optimize if LCP is poor (> 2.5s)
        if (lastEntry.startTime > 2500) {
          this.handlePoorLCP()
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)
    } catch (e) {
      console.warn('[Performance] LCP observer not supported')
    }

    // Monitor First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const processingStart = (entry as any).processingStart || entry.startTime
          this.metrics.set('fid', processingStart - entry.startTime)
          
          // Optimize if FID is poor (> 100ms)
          if ((processingStart - entry.startTime) > 100) {
            this.handlePoorFID()
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)
    } catch (e) {
      console.warn('[Performance] FID observer not supported')
    }

    // Monitor Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.metrics.set('cls', clsValue)
        
        // Optimize if CLS is poor (> 0.1)
        if (clsValue > 0.1) {
          this.handlePoorCLS()
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    } catch (e) {
      console.warn('[Performance] CLS observer not supported')
    }
  }

  /**
   * Handle poor LCP performance
   */
  private handlePoorLCP(): void {
    console.warn('[Performance] Poor LCP detected, optimizing...')
    
    // Reduce image quality
    if (this.settings.imageQuality !== 'low') {
      this.settings.imageQuality = 'low'
      this.notifySettingsChange()
    }
    
    // Disable non-critical animations
    if (this.settings.enableAnimations) {
      this.settings.enableAnimations = false
      this.notifySettingsChange()
    }
  }

  /**
   * Handle poor FID performance
   */
  private handlePoorFID(): void {
    console.warn('[Performance] Poor FID detected, optimizing...')
    
    // Reduce concurrent requests
    this.settings.maxConcurrentRequests = Math.max(1, this.settings.maxConcurrentRequests - 1)
    
    // Disable haptics and sounds
    this.settings.enableHaptics = false
    this.settings.enableSounds = false
    
    this.notifySettingsChange()
  }

  /**
   * Handle poor CLS performance
   */
  private handlePoorCLS(): void {
    console.warn('[Performance] Poor CLS detected, optimizing...')
    
    // Enable virtual scrolling for better layout stability
    this.settings.virtualScrolling = true
    this.notifySettingsChange()
  }

  /**
   * Notify components of settings changes
   */
  private notifySettingsChange(): void {
    window.dispatchEvent(new CustomEvent('performance-settings-changed', {
      detail: this.settings
    }))
  }

  /**
   * Get current performance settings
   */
  getSettings(): PerformanceSettings {
    return { ...this.settings }
  }

  /**
   * Get device capabilities
   */
  getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Optimize image URL based on current settings
   */
  optimizeImageUrl(url: string, width?: number, height?: number): string {
    if (!url) return url

    const quality = this.getImageQuality()
    const format = this.getOptimalImageFormat()
    
    // For Next.js Image optimization
    if (url.startsWith('/')) {
      const params = new URLSearchParams()
      
      if (width) params.set('w', width.toString())
      if (height) params.set('h', height.toString())
      params.set('q', quality.toString())
      
      return `/_next/image?url=${encodeURIComponent(url)}&${params.toString()}`
    }
    
    return url
  }

  /**
   * Get optimal image quality based on settings
   */
  private getImageQuality(): number {
    switch (this.settings.imageQuality) {
      case 'low': return 50
      case 'medium': return 75
      case 'high': return 90
      default: return 75
    }
  }

  /**
   * Get optimal image format based on browser support
   */
  private getOptimalImageFormat(): string {
    // Check for AVIF support (best compression)
    if (this.supportsImageFormat('image/avif')) return 'avif'
    
    // Check for WebP support (good compression)
    if (this.supportsImageFormat('image/webp')) return 'webp'
    
    // Fallback to JPEG
    return 'jpeg'
  }

  /**
   * Check if browser supports image format
   */
  private supportsImageFormat(mimeType: string): boolean {
    const canvas = document.createElement('canvas')
    return canvas.toDataURL(mimeType).indexOf(`data:${mimeType}`) === 0
  }

  /**
   * Debounce function calls for performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * Throttle function calls for performance
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * Schedule low priority work
   */
  scheduleWork(callback: () => void, options: { timeout?: number } = {}): void {
    const { timeout = 5000 } = options

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(callback, 16)
    }
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources(): void {
    const criticalResources = [
      '/data/thailand-waste-categories.json',
      '/fonts/Patrick_Hand/PatrickHand-Regular.ttf',
      '/icons/icon-192x192.png'
    ]

    criticalResources.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      
      if (url.endsWith('.json')) {
        link.as = 'fetch'
        link.setAttribute('crossorigin', '')
      } else if (url.endsWith('.ttf')) {
        link.as = 'font'
        link.type = 'font/ttf'
        link.setAttribute('crossorigin', '')
      } else if (url.includes('icon')) {
        link.as = 'image'
      }
      
      link.href = url
      document.head.appendChild(link)
    })
  }

  /**
   * Monitor memory usage and clean up if needed
   */
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      const usagePercent = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
      
      if (usagePercent > 0.8) {
        console.warn('[Performance] High memory usage detected:', usagePercent)
        this.triggerMemoryCleanup()
      }
    }
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup(): void {
    // Suggest garbage collection
    if ('gc' in window) {
      (window as any).gc()
    }
    
    // Clear unnecessary caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('temp') || cacheName.includes('old')) {
            caches.delete(cacheName)
          }
        })
      })
    }
    
    // Notify components to clean up
    window.dispatchEvent(new CustomEvent('memory-pressure'))
  }

  /**
   * Cleanup performance observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// React hook for performance optimization
import { useEffect, useState } from 'react'

export const usePerformanceOptimization = () => {
  const [settings, setSettings] = useState(performanceOptimizer.getSettings())
  const [capabilities] = useState(performanceOptimizer.getCapabilities())
  const [metrics, setMetrics] = useState(performanceOptimizer.getMetrics())

  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      setSettings(event.detail)
    }

    const updateMetrics = () => {
      setMetrics(performanceOptimizer.getMetrics())
    }

    window.addEventListener('performance-settings-changed', handleSettingsChange as EventListener)
    
    // Update metrics periodically
    const metricsInterval = setInterval(updateMetrics, 5000)

    return () => {
      window.removeEventListener('performance-settings-changed', handleSettingsChange as EventListener)
      clearInterval(metricsInterval)
    }
  }, [])

  return {
    settings,
    capabilities,
    metrics,
    optimizeImageUrl: performanceOptimizer.optimizeImageUrl.bind(performanceOptimizer),
    debounce: performanceOptimizer.debounce.bind(performanceOptimizer),
    throttle: performanceOptimizer.throttle.bind(performanceOptimizer),
    scheduleWork: performanceOptimizer.scheduleWork.bind(performanceOptimizer)
  }
}

// Utility functions for components
export const createOptimizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  options: { memo?: boolean; lazy?: boolean } = {}
) => {
  const { memo = true, lazy = false } = options
  
  let OptimizedComponent = Component
  
  if (memo) {
    OptimizedComponent = React.memo(Component) as React.ComponentType<P>
  }
  
  if (lazy) {
    const LazyComponent = React.lazy(() => Promise.resolve({ default: OptimizedComponent }))
    const LazyWrapper = (props: P) => 
      React.createElement(
        React.Suspense,
        { fallback: React.createElement('div', { className: 'animate-pulse h-8 bg-gray-200 rounded' }) },
        React.createElement(LazyComponent, props)
      )
    LazyWrapper.displayName = `LazyOptimized(${Component.displayName || Component.name})`
    return LazyWrapper
  }
  
  return OptimizedComponent
}

export default performanceOptimizer