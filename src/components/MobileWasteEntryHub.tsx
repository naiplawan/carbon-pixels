'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, Mic, Edit3, Sparkles, X, ArrowLeft } from 'lucide-react'
import MobileOptimizedWasteEntry from './MobileOptimizedWasteEntry'
import ThaiVoiceInput from './ThaiVoiceInput'
import MobileCameraScanner from './MobileCameraScanner'
import TouchFriendlyForm from './TouchFriendlyForm'
import SmartInputSuggestions from './SmartInputSuggestions'
import { getCulturalContext, getContextualWasteSuggestions } from '@/utils/thai-input-utils'

interface WasteEntry {
  id: string
  categoryId: string
  categoryName: string
  disposal: string
  weight: number
  carbonCredits: number
  timestamp: Date
  image?: string
  inputMethod?: 'camera' | 'voice' | 'manual' | 'smart'
  location?: string
  notes?: string
}

interface VoiceRecognitionResult {
  category?: any
  confidence: number
  transcript: string
  language: 'th' | 'en'
  alternatives?: string[]
}

interface CameraScanResult {
  category: any
  confidence: number
  boundingBox?: { x: number; y: number; width: number; height: number }
  imageData?: string
  processingTime: number
}

interface MobileWasteEntryHubProps {
  isOpen: boolean
  onClose: () => void
  onEntryAdded: (entry: WasteEntry) => void
  recentEntries?: WasteEntry[]
  userPreferences?: {
    preferredLanguage: 'th' | 'en' | 'auto'
    preferredInputMethod: 'camera' | 'voice' | 'manual' | 'smart'
    enableHapticFeedback: boolean
    enableVoiceFeedback: boolean
  }
}

type InputMethod = 'selection' | 'camera' | 'voice' | 'manual' | 'smart'

export default function MobileWasteEntryHub({
  isOpen,
  onClose,
  onEntryAdded,
  recentEntries = [],
  userPreferences = {
    preferredLanguage: 'auto',
    preferredInputMethod: 'smart',
    enableHapticFeedback: true,
    enableVoiceFeedback: true
  }
}: MobileWasteEntryHubProps) {
  const [currentMethod, setCurrentMethod] = useState<InputMethod>('selection')
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [formData, setFormData] = useState<Partial<WasteEntry>>({})
  const [culturalContext, setCulturalContext] = useState(getCulturalContext())
  const [hasShownTips, setHasShownTips] = useState(false)

  // Update cultural context periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCulturalContext(getCulturalContext())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Show contextual tips on first open
  useEffect(() => {
    if (isOpen && !hasShownTips) {
      const showTips = localStorage.getItem('mobileWasteEntryTipsShown') !== 'true'
      if (showTips) {
        setHasShownTips(true)
        localStorage.setItem('mobileWasteEntryTipsShown', 'true')
      }
    }
  }, [isOpen, hasShownTips])

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback((pattern: number | number[]) => {
    if (userPreferences.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [userPreferences.enableHapticFeedback])

  // Voice feedback helper
  const speakFeedback = useCallback((text: string, language: 'th' | 'en' = 'th') => {
    if (userPreferences.enableVoiceFeedback && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'th' ? 'th-TH' : 'en-US'
      speechSynthesis.speak(utterance)
    }
  }, [userPreferences.enableVoiceFeedback])

  // Handle voice recognition result
  const handleVoiceResult = (result: VoiceRecognitionResult) => {
    triggerHapticFeedback(100)
    
    if (result.category) {
      setSelectedCategory(result.category)
      setFormData(prev => ({
        ...prev,
        categoryId: result.category.id,
        categoryName: result.category.name,
        inputMethod: 'voice'
      }))
      setCurrentMethod('manual')
      
      speakFeedback(`พบ${result.category.nameLocal}`)
    } else {
      speakFeedback('ไม่พบข้อมูล กรุณาลองใหม่')
    }
  }

  // Handle camera scan result
  const handleCameraResult = (result: CameraScanResult) => {
    triggerHapticFeedback([100, 50, 100])
    
    setSelectedCategory(result.category)
    setFormData(prev => ({
      ...prev,
      categoryId: result.category.id,
      categoryName: result.category.name,
      inputMethod: 'camera',
      image: result.imageData
    }))
    setCurrentMethod('manual')
    
    speakFeedback(`พบ${result.category.nameLocal} ความมั่นใจ ${Math.round(result.confidence * 100)} เปอร์เซ็นต์`)
  }

  // Handle smart suggestion selection
  const handleSuggestionSelect = (category: any) => {
    triggerHapticFeedback(50)
    
    setSelectedCategory(category)
    setFormData(prev => ({
      ...prev,
      categoryId: category.id,
      categoryName: category.name,
      inputMethod: 'smart'
    }))
    setCurrentMethod('manual')
  }

  // Handle manual form submission
  const handleManualFormSubmit = (data: any) => {
    const entry: WasteEntry = {
      id: Date.now().toString(),
      ...data,
      timestamp: new Date(),
      inputMethod: formData.inputMethod || 'manual',
      image: formData.image
    }

    triggerHapticFeedback([200, 100, 200])
    onEntryAdded(entry)
    resetForm()
    onClose()
  }

  // Handle unified waste entry
  const handleWasteEntrySubmit = (entry: WasteEntry) => {
    triggerHapticFeedback([200, 100, 200])
    onEntryAdded(entry)
    resetForm()
    onClose()
  }

  // Reset form state
  const resetForm = () => {
    setSelectedCategory(null)
    setFormData({})
    setCurrentMethod('selection')
  }

  // Go back to method selection
  const goBack = () => {
    if (currentMethod === 'manual') {
      setCurrentMethod('selection')
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  // Method Selection Screen
  if (currentMethod === 'selection') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-handwritten text-ink">Add Waste Entry</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Smart Suggestions */}
          <SmartInputSuggestions
            onSuggestionSelect={handleSuggestionSelect}
            recentEntries={recentEntries}
          />

          {/* Input Method Cards */}
          <div>
            <h2 className="text-lg font-handwritten text-ink mb-4">
              Choose Input Method • เลือกวิธีการป้อนข้อมูล
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Camera Method */}
              <button
                onClick={() => setCurrentMethod('camera')}
                className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-300 rounded-2xl transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-handwritten text-blue-800 text-lg">Camera</div>
                  <div className="text-sm text-blue-600">กล้อง</div>
                  <div className="text-xs text-blue-500 mt-1">AI Recognition</div>
                </div>
              </button>

              {/* Voice Method */}
              <button
                onClick={() => setCurrentMethod('voice')}
                className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 rounded-2xl transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-handwritten text-green-800 text-lg">Voice</div>
                  <div className="text-sm text-green-600">เสียง</div>
                  <div className="text-xs text-green-500 mt-1">Thai + English</div>
                </div>
              </button>

              {/* Manual Method */}
              <button
                onClick={() => setCurrentMethod('manual')}
                className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
                  <Edit3 className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-handwritten text-gray-800 text-lg">Manual</div>
                  <div className="text-sm text-gray-600">ด้วยตนเอง</div>
                  <div className="text-xs text-gray-500 mt-1">Most Accurate</div>
                </div>
              </button>

              {/* Unified Smart Method */}
              <button
                onClick={() => setCurrentMethod('smart')}
                className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 rounded-2xl transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-handwritten text-purple-800 text-lg">Smart</div>
                  <div className="text-sm text-purple-600">อัจฉริยะ</div>
                  <div className="text-xs text-purple-500 mt-1">All-in-One</div>
                </div>
              </button>
            </div>
          </div>

          {/* Contextual Tips */}
          {culturalContext && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-handwritten text-yellow-800 mb-2">
                💡 Context Tips • เคล็ดลับเชิงบริบท
              </h3>
              <div className="text-sm text-yellow-700 space-y-1">
                {culturalContext.isLunchTime && (
                  <div>🍽️ Lunch time - expect food waste and packaging</div>
                )}
                {culturalContext.isMarketDay && (
                  <div>🏪 Market day - fresh food and plastic bags common</div>
                )}
                {culturalContext.isWorkingHour && (
                  <div>🏢 Work hours - paper, bottles, and electronics likely</div>
                )}
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          {recentEntries.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-handwritten text-green-800 mb-2">
                📊 Your Activity • กิจกรรมของคุณ
              </h3>
              <div className="text-sm text-green-700">
                <div>📝 {recentEntries.length} entries this week</div>
                <div>🌳 {Math.floor(recentEntries.reduce((sum, entry) => sum + Math.abs(entry.carbonCredits), 0) / 500)} trees equivalent</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Camera Scanner
  if (currentMethod === 'camera') {
    return (
      <MobileCameraScanner
        isOpen={true}
        onResult={handleCameraResult}
        onClose={goBack}
      />
    )
  }

  // Voice Input
  if (currentMethod === 'voice') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-200">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-100 rounded-full mr-3"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-handwritten text-ink">Voice Input</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <ThaiVoiceInput
            isOpen={true}
            onResult={handleVoiceResult}
            onCancel={goBack}
          />
        </div>
      </div>
    )
  }

  // Manual Form
  if (currentMethod === 'manual') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-200">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-100 rounded-full mr-3"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-handwritten text-ink">Manual Entry</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <TouchFriendlyForm
            onSubmit={handleManualFormSubmit}
            onCancel={goBack}
            initialData={formData}
          />
        </div>
      </div>
    )
  }

  // Smart/Unified Method
  if (currentMethod === 'smart') {
    return (
      <MobileOptimizedWasteEntry
        onClose={goBack}
        onSave={handleWasteEntrySubmit}
      />
    )
  }

  return null
}

// Hook for managing mobile waste entry state
export function useMobileWasteEntry() {
  const [isOpen, setIsOpen] = useState(false)
  const [recentEntries, setRecentEntries] = useState<WasteEntry[]>([])

  // Load recent entries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentWasteEntries')
    if (stored) {
      try {
        const entries = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
        setRecentEntries(entries)
      } catch (error) {
        console.error('Error loading recent entries:', error)
      }
    }
  }, [])

  // Save entry and update recents
  const addEntry = (entry: WasteEntry) => {
    const updated = [entry, ...recentEntries].slice(0, 50) // Keep last 50 entries
    setRecentEntries(updated)
    
    // Save to localStorage
    try {
      localStorage.setItem('recentWasteEntries', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving entries:', error)
    }
  }

  return {
    isOpen,
    setIsOpen,
    recentEntries,
    addEntry
  }
}