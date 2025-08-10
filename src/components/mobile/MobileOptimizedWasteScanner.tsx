'use client'

import React, { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useNetworkAwareLoading, useBatteryAwareOptimizations } from '@/hooks/useNetworkConnection'
import { BatteryOptimizedAnimation, OptimizedLoadingSpinner, OptimizedInteraction } from './BatteryOptimizedAnimations'
import SkeletonLoader from './SkeletonLoader'
import { performanceMonitor } from '@/lib/performance-monitor'
import { WasteEntry } from '@/types/waste'

// Lazy load the full waste scanner for better performance
const FullWasteScanner = lazy(() => import('@/components/WasteScanner'))

interface MobileWasteScannerProps {
  onClose: () => void
  onSave: (entry: WasteEntry) => void | Promise<void>
  wasteCategories: any[]
}

export default function MobileOptimizedWasteScanner({ 
  onClose, 
  onSave, 
  wasteCategories 
}: MobileWasteScannerProps) {
  const [loadingMode, setLoadingMode] = useState<'skeleton' | 'simple' | 'full'>('skeleton')
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showFullScanner, setShowFullScanner] = useState(false)
  
  const { isOnline, isSlowConnection, networkStrength, shouldPreload } = useNetworkAwareLoading()
  const { getBatteryOptimizations } = useBatteryAwareOptimizations()
  const batteryOpts = getBatteryOptimizations()
  
  const scanStartTime = useRef<number>(0)

  useEffect(() => {
    // Start performance tracking
    const trackScan = performanceMonitor.trackScannerAction('scanner_modal_open')
    
    // Determine loading strategy based on device capabilities
    const determineLoadingStrategy = async () => {
      // Always start with skeleton
      setLoadingMode('skeleton')

      if (batteryOpts.useMinimalUI || isSlowConnection) {
        // Use simple interface for constrained devices
        setTimeout(() => setLoadingMode('simple'), 500)
      } else if (shouldPreload('medium')) {
        // Load full scanner for capable devices
        setTimeout(() => setLoadingMode('full'), 300)
      } else {
        // Default to simple interface
        setTimeout(() => setLoadingMode('simple'), 800)
      }
    }

    determineLoadingStrategy()
    
    return () => {
      trackScan() // End performance tracking
    }
  }, [isSlowConnection, batteryOpts.useMinimalUI, shouldPreload])

  const handleCategorySelect = (category: any) => {
    const trackSelect = performanceMonitor.trackScannerAction('category_select')
    setSelectedCategory(category)
    trackSelect()

    // Haptic feedback for mobile users
    if ('vibrate' in navigator && !batteryOpts.reduceCPUUsage) {
      navigator.vibrate(10)
    }
  }

  const handleSimulatedScan = () => {
    const trackScan = performanceMonitor.trackScannerAction('simulate_scan')
    scanStartTime.current = performance.now()
    setIsScanning(true)

    // Simulate AI scanning with reduced time for mobile
    const scanDuration = batteryOpts.reduceCPUUsage ? 1500 : 2000
    
    setTimeout(() => {
      // Random category selection
      const randomCategory = wasteCategories[Math.floor(Math.random() * wasteCategories.length)]
      setSelectedCategory(randomCategory)
      setIsScanning(false)
      trackScan()
      
      // Track scan performance
      const scanTime = performance.now() - scanStartTime.current
      console.log(`📱 Scan completed in ${scanTime.toFixed(0)}ms`)
    }, scanDuration)
  }

  const renderSimpleInterface = () => (
    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-handwritten text-ink">Waste Scanner 📷</h2>
          <OptimizedInteraction onTap={onClose}>
            <button className="text-gray-500 hover:text-gray-700 text-xl p-2">✕</button>
          </OptimizedInteraction>
        </div>

        {/* Battery/Network Status */}
        {(batteryOpts.useMinimalUI || isSlowConnection) && (
          <BatteryOptimizedAnimation type="fade">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                {batteryOpts.useMinimalUI && <span>🔋 Battery Saver</span>}
                {isSlowConnection && <span>🐌 Slow Network</span>}
                <span className="ml-auto">Simplified Mode</span>
              </div>
            </div>
          </BatteryOptimizedAnimation>
        )}

        {!selectedCategory ? (
          <>
            {/* Quick Scan Button */}
            <div className="text-center mb-4">
              <OptimizedInteraction
                onTap={handleSimulatedScan}
                hapticFeedback={!batteryOpts.reduceCPUUsage}
                disabled={isScanning}
              >
                <div className="bg-green-500 text-white rounded-lg p-4 text-center">
                  {isScanning ? (
                    <div className="flex items-center justify-center gap-2">
                      <OptimizedLoadingSpinner size="small" color="gray" />
                      <span className="font-sketch">Scanning...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">🤖</div>
                      <div className="font-sketch">Quick AI Scan</div>
                      <div className="text-xs opacity-90">Tap to identify waste</div>
                    </>
                  )}
                </div>
              </OptimizedInteraction>
            </div>

            {/* Category Grid - Optimized for touch */}
            <div className="border-t pt-4">
              <h3 className="font-sketch text-ink mb-3">Or select manually:</h3>
              <div className="grid grid-cols-2 gap-3">
                {wasteCategories.map((category) => (
                  <OptimizedInteraction
                    key={category.id}
                    onTap={() => handleCategorySelect(category)}
                    hapticFeedback={!batteryOpts.reduceCPUUsage}
                  >
                    <div className="border rounded-lg p-3 text-center bg-white">
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs font-sketch text-gray-700">
                        {category.name}
                      </div>
                    </div>
                  </OptimizedInteraction>
                ))}
              </div>
            </div>
          </>
        ) : (
          <MobileWasteEntryForm 
            category={selectedCategory}
            onSave={onSave}
            onBack={() => setSelectedCategory(null)}
            onClose={onClose}
            batteryOptimized={batteryOpts.reduceCPUUsage}
          />
        )}

        {/* Network-aware upgrade option */}
        {loadingMode === 'simple' && networkStrength === 'excellent' && !batteryOpts.useMinimalUI && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowFullScanner(true)}
              className="text-blue-600 text-sm font-sketch underline"
            >
              Switch to Full Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Render based on loading mode and capabilities
  if (loadingMode === 'skeleton') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <SkeletonLoader type="scanner" />
      </div>
    )
  }

  if (showFullScanner && loadingMode === 'full') {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SkeletonLoader type="scanner" />
        </div>
      }>
        <FullWasteScanner onClose={onClose} onSave={onSave} />
      </Suspense>
    )
  }

  return (
    <BatteryOptimizedAnimation type="fade" disabled={batteryOpts.reduceAnimations}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {renderSimpleInterface()}
      </div>
    </BatteryOptimizedAnimation>
  )
}

// Mobile-optimized waste entry form component
function MobileWasteEntryForm({
  category,
  onSave,
  onBack,
  onClose,
  batteryOptimized
}: {
  category: any
  onSave: (entry: WasteEntry) => void
  onBack: () => void
  onClose: () => void
  batteryOptimized: boolean
}) {
  const [selectedDisposal, setSelectedDisposal] = useState('')
  const [weight, setWeight] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculateCredits = () => {
    if (!selectedDisposal || !weight) return 0
    const weightNum = parseFloat(weight)
    const baseCredits = category.carbonCredits[selectedDisposal] || 0
    return Math.round(baseCredits * weightNum)
  }

  const handleSubmit = async () => {
    if (!selectedDisposal || !weight) return

    const trackSubmit = performanceMonitor.trackScannerAction('entry_save')
    setIsSubmitting(true)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, batteryOptimized ? 200 : 500))

    const entry: WasteEntry = {
      id: Date.now().toString(),
      categoryId: category.id,
      categoryName: category.name,
      disposal: selectedDisposal,
      weight: parseFloat(weight),
      carbonCredits: calculateCredits(),
      timestamp: new Date().toISOString()
    }

    onSave(entry)
    trackSubmit()
    onClose()
  }

  const commonWeights = ['0.1', '0.2', '0.5', '1.0', '2.0']

  return (
    <BatteryOptimizedAnimation type="slide" disabled={batteryOptimized}>
      <div className="space-y-4">
        {/* Category Display */}
        <div className="text-center">
          <div className="text-4xl mb-2">{category.icon}</div>
          <h3 className="text-lg font-handwritten text-ink">{category.name}</h3>
          <p className="text-sm text-gray-600">{category.nameLocal}</p>
        </div>

        {/* Disposal Method */}
        <div>
          <label className="block font-sketch text-ink mb-2">
            How will you dispose of this?
          </label>
          <div className="space-y-2">
            {Object.entries(category.carbonCredits).map(([method, credits]) => (
              <OptimizedInteraction
                key={method}
                onTap={() => setSelectedDisposal(method)}
                disabled={isSubmitting}
              >
                <div className={`border rounded-lg p-3 ${
                  selectedDisposal === method 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-sketch capitalize">
                      {method.replace('_', ' ')}
                    </span>
                    <span className={`text-sm ${
                      (credits as number) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(credits as number) > 0 ? '+' : ''}{credits as number} CC/kg
                    </span>
                  </div>
                </div>
              </OptimizedInteraction>
            ))}
          </div>
        </div>

        {/* Weight Selection - Mobile Optimized */}
        <div>
          <label className="block font-sketch text-ink mb-2">
            Weight (kg)
          </label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {commonWeights.map(w => (
              <OptimizedInteraction
                key={w}
                onTap={() => setWeight(w)}
                disabled={isSubmitting}
              >
                <div className={`border rounded p-2 text-center text-sm ${
                  weight === w ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}>
                  {w}
                </div>
              </OptimizedInteraction>
            ))}
          </div>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Custom weight"
            className="w-full p-2 border rounded-lg text-center font-sketch"
            disabled={isSubmitting}
          />
        </div>

        {/* Credits Preview */}
        {selectedDisposal && weight && (
          <BatteryOptimizedAnimation type="fade" disabled={batteryOptimized}>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg text-center">
              <div className="font-sketch text-green-800 mb-1">Carbon Credits</div>
              <div className={`text-2xl font-handwritten ${
                calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
              </div>
            </div>
          </BatteryOptimizedAnimation>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <OptimizedInteraction onTap={onBack} disabled={isSubmitting}>
            <button className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-sketch rounded-lg">
              Back
            </button>
          </OptimizedInteraction>
          <OptimizedInteraction onTap={handleSubmit} disabled={!selectedDisposal || !weight || isSubmitting}>
            <button 
              className="flex-1 px-4 py-3 bg-green-500 text-white font-sketch rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <OptimizedLoadingSpinner size="small" color="gray" />
                  Saving...
                </div>
              ) : (
                'Save Entry'
              )}
            </button>
          </OptimizedInteraction>
        </div>
      </div>
    </BatteryOptimizedAnimation>
  )
}