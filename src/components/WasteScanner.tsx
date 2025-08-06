'use client'

import { useState, useRef } from 'react'
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-handwritten text-ink">Waste Scanner 📷</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          {!showResults ? (
            <>
              {/* Camera View */}
              <div className="relative mb-6">
                <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
                  {!isScanning ? (
                    <div className="text-center text-white">
                      <div className="text-4xl mb-4">📷</div>
                      <p className="mb-4">Point camera at waste item</p>
                      <button
                        onClick={simulateScanning}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg font-sketch hover:bg-green-600"
                      >
                        Start Scanning
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-white">
                      <div className="text-4xl mb-4 animate-pulse">🔍</div>
                      <p className="mb-2">AI Scanning in progress...</p>
                      <p className="text-sm opacity-75">Identifying waste type</p>
                      
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
                <h3 className="font-sketch text-ink mb-3">Or select manually:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {wasteCategories.wasteCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setDetectedCategory(category)
                        setShowResults(true)
                      }}
                      className="p-3 border rounded-lg text-center hover:bg-gray-50 transition-colors"
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
                <label className="block font-sketch text-ink mb-2">How will you dispose of this?</label>
                <select
                  value={selectedDisposal}
                  onChange={(e) => setSelectedDisposal(e.target.value)}
                  className="w-full p-3 border rounded-lg font-sketch focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select disposal method...</option>
                  {Object.keys(detectedCategory.carbonCredits).map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')} 
                      ({detectedCategory.carbonCredits[method] > 0 ? '+' : ''}{detectedCategory.carbonCredits[method]} credits/kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Input */}
              <div className="mb-4">
                <label className="block font-sketch text-ink mb-2">Estimated weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.5"
                  className="w-full p-3 border rounded-lg font-sketch focus:ring-2 focus:ring-green-500"
                />
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
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-sketch rounded-lg hover:bg-gray-50"
                >
                  Scan Again
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedDisposal || !weight}
                  className="flex-1 px-4 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  Save Entry
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}