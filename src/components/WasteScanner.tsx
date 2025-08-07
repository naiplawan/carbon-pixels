'use client'

import { useState, useRef, useEffect } from 'react'
import wasteCategories from '@/data/thailand-waste-categories.json'

interface WasteScannerProps {
  onClose: () => void
  onSave: (entry: WasteEntry) => void
}

interface WasteEntry {
  id: string
  categoryId: string
  categoryName: string
  disposal: string
  weight: number
  carbonCredits: number
  timestamp: Date
  image?: string
}

export default function WasteScanner({ onClose, onSave }: WasteScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedCategory, setDetectedCategory] = useState<any>(null)
  const [selectedDisposal, setSelectedDisposal] = useState('')
  const [weight, setWeight] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [scanAnimation, setScanAnimation] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-title"
      aria-describedby="scanner-description"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 id="scanner-title" className="text-2xl font-handwritten text-ink">Waste Scanner 📷</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
              aria-label="Close scanner modal"
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
                        onClick={simulateScanning}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg font-sketch hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        aria-label="Start AI waste scanning simulation"
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
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-sketch text-ink">👆 Recommended: Select manually</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-sketch">
                    Most Accurate
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {wasteCategories.wasteCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setDetectedCategory(category)
                        setShowResults(true)
                      }}
                      className="p-3 border rounded-lg text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      aria-label={`Select ${category.name} waste category`}
                    >
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs font-sketch">{category.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Scan Results */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{detectedCategory.icon}</div>
                <h3 className="text-2xl font-handwritten text-ink mb-2">
                  {detectedCategory.name}
                </h3>
                <p className="text-pencil text-sm">{detectedCategory.description}</p>
              </div>

              {/* Disposal Method Selection */}
              <div className="mb-4">
                <label htmlFor="disposal-method" className="block font-sketch text-ink mb-2">How will you dispose of this?</label>
                <select
                  id="disposal-method"
                  value={selectedDisposal}
                  onChange={(e) => setSelectedDisposal(e.target.value)}
                  className="w-full p-3 border rounded-lg font-sketch focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-describedby="disposal-help"
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

              {/* Weight Input */}
              <div className="mb-4">
                <label htmlFor="weight-input" className="block font-sketch text-ink mb-2">Estimated weight (kg)</label>
                <input
                  id="weight-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.5"
                  className="w-full p-3 border rounded-lg font-sketch focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-describedby="weight-help"
                />
                <div id="weight-help" className="sr-only">
                  Enter the estimated weight of this waste item in kilograms.
                </div>
              </div>

              {/* Credits Preview */}
              {selectedDisposal && weight && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
                  <div className="text-center">
                    <div className="font-sketch text-green-800 mb-2">Carbon Credits</div>
                    <div className={`text-3xl font-handwritten ${
                      calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
                    </div>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-yellow-50 p-3 rounded-lg mb-6">
                <h4 className="font-sketch text-yellow-800 mb-2">💡 Tips:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {detectedCategory.tips.map((tip: string, index: number) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResults(false)
                    setDetectedCategory(null)
                    setSelectedDisposal('')
                    setWeight('')
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-sketch rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Clear current selection and scan again"
                >
                  Scan Again
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedDisposal || !weight}
                  className="flex-1 px-4 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                  aria-label={`Save waste entry for ${detectedCategory?.name || 'selected item'}`}
                  aria-describedby={!selectedDisposal || !weight ? 'save-requirements' : undefined}
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