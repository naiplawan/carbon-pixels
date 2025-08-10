'use client'

import { useState, useRef, useEffect } from 'react'
import wasteCategories from '@/data/thailand-waste-categories.json'
import { triggerHaptic } from '@/lib/haptic-feedback'
import { applyTouchFeedback } from '@/lib/touch-feedback'
import { WasteEntry, WasteCategory, DisposalMethod } from '@/types/waste'

interface WasteScannerProps {
  onClose: () => void
  onSave: (entry: WasteEntry) => void
}

// WasteEntry interface is now imported from types

export default function WasteScanner({ onClose, onSave }: WasteScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedCategory, setDetectedCategory] = useState<WasteCategory | null>(null)
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalMethod>('disposed')
  const [weight, setWeight] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [scanAnimation, setScanAnimation] = useState(false)
  const [showMobileOptimized, setShowMobileOptimized] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Focus management and keyboard handling
  useEffect(() => {
    // Focus the close button when modal opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus()
    }

    // Handle Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Trap focus within modal
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [onClose])

  const simulateScanning = () => {
    setIsScanning(true)
    setScanAnimation(true)
    
    // Simulate AI recognition delay
    setTimeout(() => {
      // Randomly select a category for demo
      const categories = wasteCategories.wasteCategories
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      setDetectedCategory(randomCategory)
      setIsScanning(false)
      setShowResults(true)
      setScanAnimation(false)
    }, 3000)
  }

  const calculateCredits = () => {
    if (!detectedCategory || !selectedDisposal || !weight) return 0
    
    const weightNum = parseFloat(weight)
    const baseCredits = detectedCategory.carbonCredits[selectedDisposal] || 0
    return Math.round(baseCredits * weightNum)
  }

  const handleSave = () => {
    if (!detectedCategory || !selectedDisposal || !weight) return

    const entry: WasteEntry = {
      id: Date.now().toString(),
      categoryId: detectedCategory.id,
      categoryName: detectedCategory.name,
      disposal: selectedDisposal,
      weight: parseFloat(weight),
      carbonCredits: calculateCredits(),
      timestamp: new Date()
    }

    onSave(entry)
    onClose()
  }

  // Use mobile optimized version on small screens
  useEffect(() => {
    if (isMobile) {
      setShowMobileOptimized(true)
    }
  }, [isMobile])

  // Import mobile component dynamically
  const MobileWasteEntryHub = showMobileOptimized ? require('./MobileWasteEntryHub').default : null

  if (showMobileOptimized && MobileWasteEntryHub) {
    return (
      <MobileWasteEntryHub
        isOpen={true}
        onClose={onClose}
        onEntryAdded={onSave}
        recentEntries={[]}
        userPreferences={{
          preferredLanguage: 'auto',
          preferredInputMethod: 'smart',
          enableHapticFeedback: true,
          enableVoiceFeedback: true
        }}
      />
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-title"
      aria-describedby="scanner-description"
      style={{ touchAction: 'manipulation' }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl"
        style={{ 
          minHeight: '400px',
          maxWidth: 'calc(100vw - 16px)'
        }}
      >
        <div className="p-4 sm:p-6">
          {/* Header - Mobile optimized */}
          <div className="flex justify-between items-center mb-6">
            <h2 id="scanner-title" className="text-2xl sm:text-3xl font-handwritten text-ink">Waste Scanner 📷</h2>
            <button
              ref={closeButtonRef}
              onClick={(e) => {
                triggerHaptic('medium');
                addTouchFeedback(e.currentTarget);
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] w-12 h-12 flex items-center justify-center text-gray-600 hover:text-gray-800 active:text-gray-900 text-xl focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 shadow-sm"
              aria-label="Close scanner modal"
              style={{ touchAction: 'manipulation' }}
            >
              ✕
            </button>
          </div>
          <div id="scanner-description" className="sr-only">
            Scan or manually select waste items to track your environmental impact
          </div>

          {!showResults ? (
            <>
              {/* Camera View */}
              <div className="relative mb-6">
                <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
                  {/* Simulation Notice */}
                  <div className="absolute top-2 left-2 right-2">
                    <div className="bg-yellow-400 text-black text-xs font-sketch px-2 py-1 rounded flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Demo Mode - Simulated AI Recognition</span>
                    </div>
                  </div>

                  {!isScanning ? (
                    <div className="text-center text-white">
                      <div className="text-4xl mb-4">📷</div>
                      <p className="mb-2">Demo: AI Waste Recognition</p>
                      <p className="text-sm opacity-75 mb-4">Currently simulated for demonstration</p>
                      <button
                        onClick={(e) => {
                          triggerHaptic('heavy');
                          addTouchFeedback(e.currentTarget);
                          simulateScanning();
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-sketch hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 transition-all duration-200 shadow-lg active:shadow-md min-h-[56px] text-lg"
                        aria-label="Start AI waste scanning simulation"
                        style={{ touchAction: 'manipulation' }}
                      >
                        🚀 Try Demo Scan
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-white">
                      <div className="text-4xl mb-4 animate-pulse">🔍</div>
                      <p className="mb-2">Simulating AI Recognition...</p>
                      <p className="text-sm opacity-75">Demo: Random category will be selected</p>
                      
                      {/* Scanning animation */}
                      <div className="absolute inset-0">
                        <div className={`w-full h-1 bg-green-400 absolute top-0 transition-all duration-1000 ${
                          scanAnimation ? 'animate-pulse' : ''
                        }`} />
                        <div className={`w-full h-1 bg-green-400 absolute bottom-0 transition-all duration-1000 delay-500 ${
                          scanAnimation ? 'animate-pulse' : ''
                        }`} />
                        <div className={`w-1 h-full bg-green-400 absolute left-0 transition-all duration-1000 delay-1000 ${
                          scanAnimation ? 'animate-pulse' : ''
                        }`} />
                        <div className={`w-1 h-full bg-green-400 absolute right-0 transition-all duration-1000 delay-1500 ${
                          scanAnimation ? 'animate-pulse' : ''
                        }`} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Category Selection */}
              <div className="border-t-2 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                  <h3 className="font-sketch text-ink text-lg">👆 Recommended: Select manually</h3>
                  <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm px-3 py-1 rounded-full font-sketch shadow-sm">
                    Most Accurate
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {wasteCategories.wasteCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={(e) => {
                        triggerHaptic('medium');
                        addTouchFeedback(e.currentTarget);
                        setDetectedCategory(category);
                        setShowResults(true);
                      }}
                      className="p-4 border-2 border-gray-200 rounded-xl text-center hover:border-green-400 hover:bg-green-50 active:border-green-500 active:bg-green-100 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 bg-white shadow-sm hover:shadow-md min-h-[80px] flex flex-col items-center justify-center gap-2"
                      aria-label={`Select ${category.name} waste category`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className="text-3xl">{category.icon}</div>
                      <div className="text-sm font-sketch text-gray-800">{category.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Scan Results - Enhanced */}
              <div className="text-center mb-6 bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-2xl border-2 border-blue-200">
                <div className="text-7xl mb-4">{detectedCategory.icon}</div>
                <h3 className="text-3xl font-handwritten text-ink mb-3">
                  {detectedCategory.name}
                </h3>
                <p className="text-pencil text-base leading-relaxed">{detectedCategory.description}</p>
                {detectedCategory.nameLocal && (
                  <p className="text-sm text-gray-600 font-sketch mt-2">{detectedCategory.nameLocal}</p>
                )}
              </div>

              {/* Disposal Method Selection - Mobile optimized */}
              <div className="mb-6">
                <label htmlFor="disposal-method" className="block font-sketch text-ink mb-3 text-lg">How will you dispose of this?</label>
                <select
                  id="disposal-method"
                  value={selectedDisposal}
                  onChange={(e) => {
                    triggerHaptic('light');
                    setSelectedDisposal(e.target.value);
                  }}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl font-sketch focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:border-green-500 outline-none bg-white text-base min-h-[56px] appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23374151%22%3E%3Cpath fill-rule=%22evenodd%22 d=%22M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z%22 clip-rule=%22evenodd%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-3 pr-12"
                  aria-describedby="disposal-help"
                  style={{ touchAction: 'manipulation', fontSize: '16px' }}
                >
                  <option value="">Select disposal method...</option>
                  {Object.keys(detectedCategory.carbonCredits).map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')} 
                      ({detectedCategory.carbonCredits[method] > 0 ? '+' : ''}{detectedCategory.carbonCredits[method]} credits/kg)
                    </option>
                  ))}
                </select>
                <div id="disposal-help" className="sr-only">
                  Choose how you plan to dispose of this waste item. Different methods earn different carbon credits.
                </div>
              </div>

              {/* Weight Input - Mobile optimized */}
              <div className="mb-6">
                <label htmlFor="weight-input" className="block font-sketch text-ink mb-3 text-lg">Estimated weight (kg)</label>
                <input
                  id="weight-input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onFocus={(e) => {
                    triggerHaptic('light');
                    e.target.select();
                  }}
                  placeholder="0.5"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl font-sketch focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:border-green-500 outline-none bg-white text-base min-h-[56px]"
                  aria-describedby="weight-help"
                  style={{ fontSize: '16px', touchAction: 'manipulation' }}
                />
                <div id="weight-help" className="sr-only">
                  Enter the estimated weight of this waste item in kilograms.
                </div>
                
                {/* Quick weight suggestions */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {['0.1', '0.2', '0.5', '1.0', '2.0'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={(e) => {
                        triggerHaptic('light');
                        addTouchFeedback(e.currentTarget);
                        setWeight(suggestion);
                      }}
                      className="min-h-[40px] px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full hover:from-gray-200 hover:to-gray-300 active:from-gray-300 active:to-gray-400 font-sketch transition-all duration-150 shadow-sm active:shadow-none"
                      style={{ touchAction: 'manipulation' }}
                      aria-label={`Set weight to ${suggestion} kilograms`}
                    >
                      {suggestion}kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Credits Preview - Enhanced */}
              {selectedDisposal && weight && (
                <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-5 rounded-2xl mb-6 border-2 border-green-200 shadow-inner">
                  <div className="text-center">
                    <div className="font-sketch text-green-800 mb-2 text-lg">Carbon Credits Earned</div>
                    <div className={`text-4xl font-handwritten mb-2 ${
                      calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
                    </div>
                    <div className="text-sm text-gray-600 font-sketch">
                      {parseFloat(weight)}kg × {detectedCategory?.carbonCredits?.[selectedDisposal]} credits/kg
                    </div>
                  </div>
                </div>
              )}

              {/* Tips - Enhanced */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl mb-6 border border-yellow-200 shadow-sm">
                <h4 className="font-sketch text-yellow-800 mb-3 text-base flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>Tips for {detectedCategory.name}:</span>
                </h4>
                <ul className="text-sm text-yellow-700 space-y-2">
                  {detectedCategory.tips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons - Mobile optimized */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={(e) => {
                    triggerHaptic('medium');
                    addTouchFeedback(e.currentTarget);
                    setShowResults(false);
                    setDetectedCategory(null);
                    setSelectedDisposal('');
                    setWeight('');
                  }}
                  className="flex-1 min-h-[56px] px-6 py-4 border-2 border-gray-400 text-gray-700 font-sketch rounded-xl hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 bg-white shadow-sm text-base"
                  aria-label="Clear current selection and scan again"
                  style={{ touchAction: 'manipulation' }}
                >
                  Scan Again
                </button>
                <button
                  onClick={(e) => {
                    if (!selectedDisposal || !weight) return;
                    triggerHaptic('heavy');
                    addTouchFeedback(e.currentTarget);
                    handleSave();
                  }}
                  disabled={!selectedDisposal || !weight}
                  className="flex-1 min-h-[56px] px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-sketch rounded-xl hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-200 shadow-lg disabled:shadow-none text-base font-semibold"
                  aria-label={`Save waste entry for ${detectedCategory?.name || 'selected item'}`}
                  aria-describedby={!selectedDisposal || !weight ? 'save-requirements' : undefined}
                  style={{ touchAction: 'manipulation' }}
                >
                  Save Entry
                </button>
              </div>
              {(!selectedDisposal || !weight) && (
                <div id="save-requirements" className="sr-only">
                  To save this entry, please select a disposal method and enter the weight.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}