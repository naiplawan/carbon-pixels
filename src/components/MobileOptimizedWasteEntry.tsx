'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, Mic, MicOff, Search, X, Check, ChevronDown, Volume2 } from 'lucide-react'
import wasteCategories from '@/data/thailand-waste-categories.json'
import { MobileWeightSelector } from './MobileWeightSelector'

interface WasteEntry {
  id: string
  categoryId: string
  categoryName: string
  disposal: string
  weight: number
  carbonCredits: number
  timestamp: Date
  image?: string
  inputMethod?: 'camera' | 'voice' | 'manual'
}

interface MobileOptimizedWasteEntryProps {
  onClose: () => void
  onSave: (entry: WasteEntry) => void
}

// Thai voice commands mapping
const THAI_VOICE_COMMANDS = {
  'เศษอาหาร': 'food_waste',
  'ขวดพลาสติก': 'plastic_bottles', 
  'ถุงพลาสติก': 'plastic_bags',
  'กระดาษ': 'paper_cardboard',
  'ขวดแก้ว': 'glass_bottles',
  'กระป่อง': 'metal_cans',
  'ใบไม้': 'organic_waste',
  'มือถือ': 'electronic_waste',
  // English fallbacks
  'food': 'food_waste',
  'plastic bottle': 'plastic_bottles',
  'plastic bag': 'plastic_bags',
  'paper': 'paper_cardboard',
  'glass': 'glass_bottles',
  'can': 'metal_cans',
  'organic': 'organic_waste',
  'electronic': 'electronic_waste'
}

// Smart suggestions based on time and context
const getContextualSuggestions = () => {
  const hour = new Date().getHours()
  const isWorkday = new Date().getDay() >= 1 && new Date().getDay() <= 5
  
  if (hour >= 6 && hour <= 10) {
    return ['food_waste', 'plastic_bottles', 'paper_cardboard'] // Morning - breakfast, newspapers
  } else if (hour >= 11 && hour <= 14) {
    return ['food_waste', 'plastic_bags', 'metal_cans'] // Lunch time
  } else if (hour >= 17 && hour <= 21) {
    return ['food_waste', 'plastic_bags', 'glass_bottles'] // Dinner time
  } else if (isWorkday && hour >= 9 && hour <= 17) {
    return ['paper_cardboard', 'plastic_bottles', 'electronic_waste'] // Work hours
  }
  
  return wasteCategories.wasteCategories.slice(0, 4).map(c => c.id)
}

export default function MobileOptimizedWasteEntry({ onClose, onSave }: MobileOptimizedWasteEntryProps) {
  const [step, setStep] = useState<'input' | 'category' | 'details' | 'confirmation'>('input')
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedDisposal, setSelectedDisposal] = useState('')
  const [weight, setWeight] = useState(0.5)
  const [searchQuery, setSearchQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [inputMethod, setInputMethod] = useState<'camera' | 'voice' | 'manual'>('manual')
  const [isScanning, setIsScanning] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentCategories, setRecentCategories] = useState<string[]>([])

  const recognitionRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Load recent categories from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentWasteCategories')
    if (recent) {
      setRecentCategories(JSON.parse(recent))
    }
  }, [])

  // Set contextual suggestions on load
  useEffect(() => {
    setSuggestions(getContextualSuggestions())
  }, [])

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'th-TH,en-US' // Support Thai and English

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
          .toLowerCase()

        setVoiceTranscript(transcript)

        if (event.results[0].isFinal) {
          handleVoiceCommand(transcript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const handleVoiceCommand = useCallback((transcript: string) => {
    // Check for direct Thai/English matches
    for (const [command, categoryId] of Object.entries(THAI_VOICE_COMMANDS)) {
      if (transcript.includes(command)) {
        const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
        if (category) {
          setSelectedCategory(category)
          setInputMethod('voice')
          setStep('details')
          speakFeedback(`พบ${category.nameLocal}`)
          return
        }
      }
    }
    
    // Fuzzy matching for partial matches
    const words = transcript.split(' ')
    for (const word of words) {
      const matchedCategory = wasteCategories.wasteCategories.find(c => 
        c.name.toLowerCase().includes(word) ||
        c.nameLocal.includes(word) ||
        c.examples.some(ex => ex.toLowerCase().includes(word))
      )
      
      if (matchedCategory) {
        setSelectedCategory(matchedCategory)
        setInputMethod('voice')
        setStep('details')
        speakFeedback(`พบ${matchedCategory.nameLocal}`)
        return
      }
    }
    
    speakFeedback('ไม่พบข้อมูล กรุณาลองใหม่')
  }, [])

  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'th-TH'
      speechSynthesis.speak(utterance)
    }
  }

  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      setVoiceTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const simulateCameraScanning = () => {
    setIsScanning(true)
    setInputMethod('camera')
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
    
    setTimeout(() => {
      // Simulate AI detection with higher probability for contextual suggestions
      const allCategories = wasteCategories.wasteCategories
      const contextualCats = suggestions.map(id => allCategories.find(c => c.id === id)).filter(Boolean)
      const randomCategory = Math.random() < 0.7 && contextualCats.length 
        ? contextualCats[Math.floor(Math.random() * contextualCats.length)]
        : allCategories[Math.floor(Math.random() * allCategories.length)]
      
      setSelectedCategory(randomCategory)
      setIsScanning(false)
      setStep('details')
      
      // Haptic success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    }, 2500)
  }

  const filteredCategories = wasteCategories.wasteCategories.filter(category =>
    searchQuery === '' ||
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.nameLocal.includes(searchQuery) ||
    category.examples.some(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const calculateCredits = () => {
    if (!selectedCategory || !selectedDisposal) return 0
    const baseCredits = selectedCategory.carbonCredits[selectedDisposal] || 0
    return Math.round(baseCredits * weight)
  }

  const saveRecentCategory = (categoryId: string) => {
    const updated = [categoryId, ...recentCategories.filter(id => id !== categoryId)].slice(0, 5)
    setRecentCategories(updated)
    localStorage.setItem('recentWasteCategories', JSON.stringify(updated))
  }

  const handleSave = () => {
    if (!selectedCategory || !selectedDisposal) return

    saveRecentCategory(selectedCategory.id)

    const entry: WasteEntry = {
      id: Date.now().toString(),
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      disposal: selectedDisposal,
      weight,
      carbonCredits: calculateCredits(),
      timestamp: new Date(),
      inputMethod
    }

    onSave(entry)
    
    // Success haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
    
    onClose()
  }

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-handwritten text-ink mb-2">Add Waste Entry</h2>
        <p className="text-pencil text-sm">เพิ่มรายการขยะ</p>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={simulateCameraScanning}
          disabled={isScanning}
          className="flex flex-col items-center gap-3 p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all duration-200 active:scale-95"
        >
          <Camera className={`w-8 h-8 text-blue-600 ${isScanning ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-handwritten text-blue-800">
            {isScanning ? 'Scanning...' : 'Camera'}
          </span>
          <span className="text-xs text-blue-600">กล้อง</span>
        </button>

        <button
          onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
          className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all duration-200 active:scale-95 ${
            isListening 
              ? 'bg-red-50 hover:bg-red-100 border-red-200' 
              : 'bg-green-50 hover:bg-green-100 border-green-200'
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-red-600 animate-pulse" />
          ) : (
            <Mic className="w-8 h-8 text-green-600" />
          )}
          <span className={`text-sm font-handwritten ${isListening ? 'text-red-800' : 'text-green-800'}`}>
            {isListening ? 'Listening...' : 'Voice'}
          </span>
          <span className={`text-xs ${isListening ? 'text-red-600' : 'text-green-600'}`}>
            เสียง
          </span>
        </button>

        <button
          onClick={() => setStep('category')}
          className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-xl transition-all duration-200 active:scale-95"
        >
          <Search className="w-8 h-8 text-gray-600" />
          <span className="text-sm font-handwritten text-gray-800">Manual</span>
          <span className="text-xs text-gray-600">ด้วยตนเอง</span>
        </button>
      </div>

      {/* Voice Feedback */}
      {isListening && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-green-600 animate-pulse" />
            <div>
              <div className="text-sm font-handwritten text-green-800">
                Say the waste type in Thai or English
              </div>
              <div className="text-xs text-green-600">
                พูดชนิดขยะเป็นภาษาไทยหรือภาษาอังกฤษ
              </div>
              {voiceTranscript && (
                <div className="mt-2 text-sm text-green-700 font-mono">
                  &quot;{voiceTranscript}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanning Feedback */}
      {isScanning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-bounce">📷</div>
            <div className="text-sm font-handwritten text-blue-800 mb-2">
              AI analyzing waste item...
            </div>
            <div className="text-xs text-blue-600">
              AI กำลังวิเคราะห์ขยะ...
            </div>
            <div className="mt-3 bg-blue-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      <div>
        <h3 className="text-sm font-handwritten text-gray-700 mb-3">
          🕐 Suggested for now • แนะนำสำหรับตอนนี้
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {suggestions.slice(0, 4).map(categoryId => {
            const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
            if (!category) return null
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category)
                  setInputMethod('manual')
                  setStep('details')
                }}
                className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 hover:border-green-300 rounded-lg transition-all active:scale-95"
              >
                <span className="text-2xl">{category.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-handwritten text-gray-800">{category.name}</div>
                  <div className="text-xs text-gray-600">{category.nameLocal}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Items */}
      {recentCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-handwritten text-gray-700 mb-3">
            🕐 Recent • ล่าสุด
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentCategories.slice(0, 5).map(categoryId => {
              const category = wasteCategories.wasteCategories.find(c => c.id === categoryId)
              if (!category) return null
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category)
                    setInputMethod('manual')
                    setStep('details')
                  }}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 hover:border-yellow-300 rounded-lg transition-colors min-w-[80px]"
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-xs font-handwritten text-yellow-800 text-center">
                    {category.nameLocal}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const renderCategoryStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep('input')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-handwritten text-ink flex-1">Select Category</h2>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search waste type... / ค้นหาประเภทขยะ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
          inputMode="search"
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredCategories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category)
              setInputMethod('manual')
              setStep('details')
            }}
            className="flex flex-col items-center gap-3 p-4 bg-white border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl transition-all active:scale-95"
          >
            <span className="text-3xl">{category.icon}</span>
            <div className="text-center">
              <div className="text-sm font-handwritten text-gray-800">{category.name}</div>
              <div className="text-xs text-gray-600">{category.nameLocal}</div>
            </div>
            <div className="text-xs text-gray-500 text-center leading-tight">
              {category.examples.slice(0, 2).join(', ')}
            </div>
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-handwritten">No results found</p>
          <p className="text-sm">ไม่พบผลการค้นหา</p>
        </div>
      )}
    </div>
  )

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep('input')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-handwritten text-ink flex-1">Waste Details</h2>
      </div>

      {/* Selected Category Display */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{selectedCategory?.icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-handwritten text-ink">{selectedCategory?.name}</h3>
            <p className="text-sm text-pencil">{selectedCategory?.nameLocal}</p>
            {inputMethod && (
              <div className="mt-2 flex items-center gap-2">
                {inputMethod === 'camera' && <Camera className="w-4 h-4 text-blue-600" />}
                {inputMethod === 'voice' && <Mic className="w-4 h-4 text-green-600" />}
                {inputMethod === 'manual' && <Search className="w-4 h-4 text-gray-600" />}
                <span className="text-xs text-gray-600 capitalize">
                  Detected via {inputMethod} • พบโดย{inputMethod === 'camera' ? 'กล้อง' : inputMethod === 'voice' ? 'เสียง' : 'ด้วยตนเอง'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disposal Method Selection */}
      <div>
        <label className="block text-sm font-handwritten text-ink mb-3">
          How will you dispose? • จะกำจัดอย่างไร?
        </label>
        <div className="space-y-2">
          {Object.entries(selectedCategory?.carbonCredits || {}).map(([method, credits]) => (
            <label
              key={method}
              className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedDisposal === method
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="disposal"
                  value={method}
                  checked={selectedDisposal === method}
                  onChange={(e) => setSelectedDisposal(e.target.value)}
                  className="w-5 h-5 text-green-600"
                />
                <div>
                  <div className="font-handwritten text-gray-800 capitalize">
                    {method.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {method === 'disposed' && 'ทิ้งถังขยะ'}
                    {method === 'recycled' && 'รีไซเคิล'}
                    {method === 'composted' && 'ทำปุ่ย'}
                    {method === 'reused' && 'นำกลับมาใช้'}
                    {method === 'avoided' && 'หลีกเลี่ยง'}
                    {method === 'donated' && 'บริจาค'}
                    {method === 'returned' && 'ส่งคืน'}
                    {method === 'sold' && 'ขาย'}
                    {method === 'trade_in' && 'แลกเปลี่ยน'}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-handwritten ${
                Number(credits) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Number(credits) > 0 ? '+' : ''}{Number(credits)} CC
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Weight Selector */}
      <div>
        <label className="block text-sm font-handwritten text-ink mb-3">
          Weight • น้ำหนัก
        </label>
        <MobileWeightSelector
          value={weight}
          onChange={setWeight}
          showVisualReference={true}
        />
      </div>

      {/* Credits Preview */}
      {selectedDisposal && (
        <div className="bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="text-center">
            <div className="text-sm font-handwritten text-green-800 mb-2">
              Carbon Credits • เครดิตคาร์บอน
            </div>
            <div className={`text-3xl font-handwritten ${
              calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ≈ {Math.abs(calculateCredits())} grams CO₂
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => setStep('confirmation')}
        disabled={!selectedDisposal}
        className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-handwritten text-lg rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed"
      >
        {selectedDisposal ? 'Review Entry • ตรวจสอบรายการ' : 'Select disposal method • เลือกวิธีกำจัด'}
      </button>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-handwritten text-ink mb-2">Confirm Entry</h2>
        <p className="text-sm text-pencil">ยืนยันรายการ</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white border-2 border-green-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{selectedCategory?.icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-handwritten text-ink">{selectedCategory?.name}</h3>
            <p className="text-sm text-pencil">{selectedCategory?.nameLocal}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-100">
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Disposal</div>
            <div className="font-handwritten text-gray-800 capitalize">
              {selectedDisposal.replace('_', ' ')}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Weight</div>
            <div className="font-handwritten text-gray-800">{weight.toFixed(1)}kg</div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-green-100">
          <div className="text-sm text-gray-600 mb-1">Carbon Credits</div>
          <div className={`text-2xl font-handwritten ${
            calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setStep('details')}
          className="py-4 px-6 border-2 border-gray-300 text-gray-700 font-handwritten rounded-xl hover:bg-gray-50 transition-all active:scale-95"
        >
          Edit • แก้ไข
        </button>
        <button
          onClick={handleSave}
          className="py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-handwritten rounded-xl transition-all active:scale-95"
        >
          Save Entry • บันทึก
        </button>
      </div>
    </div>
  )

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waste-entry-title"
    >
      <div 
        ref={modalRef}
        className="bg-white w-full sm:w-full sm:max-w-md sm:mx-4 max-h-[90vh] overflow-y-auto sm:rounded-t-2xl rounded-t-2xl sm:rounded-b-2xl"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div id="waste-entry-title" className="font-handwritten text-lg text-ink">
            {step === 'input' && 'Add Waste'}
            {step === 'category' && 'Choose Category'}
            {step === 'details' && 'Enter Details'}
            {step === 'confirmation' && 'Confirm Entry'}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'input' && renderInputStep()}
          {step === 'category' && renderCategoryStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'confirmation' && renderConfirmationStep()}
        </div>
      </div>
    </div>
  )
}