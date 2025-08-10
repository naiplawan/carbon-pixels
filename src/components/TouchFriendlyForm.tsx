'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Search, X, Star, Zap } from 'lucide-react'
import { MobileWeightSelector } from './MobileWeightSelector'
import wasteCategories from '@/data/thailand-waste-categories.json'

interface TouchFriendlyFormProps {
  onSubmit: (data: WasteFormData) => void
  onCancel?: () => void
  initialData?: Partial<WasteFormData>
  className?: string
}

interface WasteFormData {
  categoryId: string
  categoryName: string
  disposal: string
  weight: number
  notes?: string
  location?: string
}

// Thai input method support
const THAI_DISPOSAL_METHODS = {
  'disposed': 'ทิ้งถังขยะ',
  'recycled': 'รีไซเคิล',
  'composted': 'ทำปุ่ย',
  'reused': 'นำกลับมาใช้',
  'avoided': 'หลีกเลี่ยง',
  'donated': 'บริจาค',
  'returned': 'ส่งคืน',
  'sold': 'ขาย',
  'trade_in': 'แลกเปลี่ยน',
  'animalFeed': 'อาหารสัตว์',
  'biogas': 'ก๊าซชีวภาพ',
  'mulch': 'หมักปุ่ย',
  'refurbished': 'ปรับปรุงใหม่',
  'proper_disposal': 'กำจัดอย่างถูกต้อง'
}

// Common Thai locations
const THAI_LOCATIONS = [
  { en: 'Home', th: 'บ้าน', icon: '🏠' },
  { en: 'Office', th: 'ออฟฟิศ', icon: '🏢' },
  { en: 'Restaurant', th: 'ร้านอาหาร', icon: '🍽️' },
  { en: 'Market', th: 'ตลาด', icon: '🏪' },
  { en: 'School', th: 'โรงเรียน', icon: '🏫' },
  { en: 'Park', th: 'สวนสาธารณะ', icon: '🌳' },
  { en: 'Street', th: 'ถนน', icon: '🛣️' },
  { en: 'Mall', th: 'ห้างสรรพสินค้า', icon: '🏬' }
]

export default function TouchFriendlyForm({
  onSubmit,
  onCancel,
  initialData,
  className = ''
}: TouchFriendlyFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedDisposal, setSelectedDisposal] = useState('')
  const [weight, setWeight] = useState(0.5)
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showDisposalPicker, setShowDisposalPicker] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [inputLanguage, setInputLanguage] = useState<'th' | 'en'>('th')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categoryPickerRef = useRef<HTMLDivElement>(null)
  const disposalPickerRef = useRef<HTMLDivElement>(null)
  const locationPickerRef = useRef<HTMLDivElement>(null)
  const notesInputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize from initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.categoryId) {
        const category = wasteCategories.wasteCategories.find(c => c.id === initialData.categoryId)
        setSelectedCategory(category)
      }
      setSelectedDisposal(initialData.disposal || '')
      setWeight(initialData.weight || 0.5)
      setNotes(initialData.notes || '')
      setLocation(initialData.location || '')
    }
  }, [initialData])

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target as Node)) {
        setShowCategoryPicker(false)
      }
      if (disposalPickerRef.current && !disposalPickerRef.current.contains(event.target as Node)) {
        setShowDisposalPicker(false)
      }
      if (locationPickerRef.current && !locationPickerRef.current.contains(event.target as Node)) {
        setShowLocationPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-resize textarea
  const handleNotesChange = (value: string) => {
    setNotes(value)
    if (notesInputRef.current) {
      notesInputRef.current.style.height = 'auto'
      notesInputRef.current.style.height = `${notesInputRef.current.scrollHeight}px`
    }
  }

  // Filter categories based on search
  const filteredCategories = wasteCategories.wasteCategories.filter(category => {
    if (!searchQuery) return true
    return (
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.nameLocal.includes(searchQuery) ||
      category.examples.some(ex => 
        ex.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  })

  // Get available disposal methods for selected category
  const getAvailableDisposalMethods = () => {
    if (!selectedCategory) return []
    return Object.keys(selectedCategory.carbonCredits).map(method => ({
      id: method,
      name: method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
      nameThai: THAI_DISPOSAL_METHODS[method as keyof typeof THAI_DISPOSAL_METHODS] || method,
      credits: selectedCategory.carbonCredits[method]
    }))
  }

  // Calculate total carbon credits
  const calculateCredits = () => {
    if (!selectedCategory || !selectedDisposal) return 0
    const baseCredits = selectedCategory.carbonCredits[selectedDisposal] || 0
    return Math.round(baseCredits * weight)
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedCategory) {
      newErrors.category = 'Please select a waste category'
    }

    if (!selectedDisposal) {
      newErrors.disposal = 'Please select disposal method'
    }

    if (weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Haptic feedback for error
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 100, 100])
      }
      return
    }

    setIsSubmitting(true)

    try {
      const formData: WasteFormData = {
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        disposal: selectedDisposal,
        weight,
        notes: notes.trim(),
        location: location.trim()
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }

      onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
      // Error haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 100, 100, 100, 100])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-handwritten text-ink">Add Waste Entry</h2>
          <p className="text-sm text-pencil">เพิ่มรายการขยะ</p>
        </div>
        
        {/* Language Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setInputLanguage('th')}
            className={`px-3 py-1 rounded text-sm font-handwritten transition-colors ${
              inputLanguage === 'th' ? 'bg-white text-green-600 shadow' : 'text-gray-600'
            }`}
          >
            🇹🇭 ไทย
          </button>
          <button
            onClick={() => setInputLanguage('en')}
            className={`px-3 py-1 rounded text-sm font-handwritten transition-colors ${
              inputLanguage === 'en' ? 'bg-white text-green-600 shadow' : 'text-gray-600'
            }`}
          >
            🇺🇸 EN
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="relative" ref={categoryPickerRef}>
          <label className="block text-sm font-handwritten text-ink mb-2">
            Waste Category • ประเภทขยะ *
          </label>
          <button
            type="button"
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
              errors.category 
                ? 'border-red-300 bg-red-50' 
                : showCategoryPicker 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {selectedCategory ? (
                <>
                  <span className="text-2xl">{selectedCategory.icon}</span>
                  <div className="text-left">
                    <div className="font-handwritten text-gray-800">
                      {inputLanguage === 'th' ? selectedCategory.nameLocal : selectedCategory.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {inputLanguage === 'th' ? selectedCategory.name : selectedCategory.nameLocal}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 font-handwritten">
                  {inputLanguage === 'th' ? 'เลือกประเภทขยะ' : 'Select waste category'}
                </div>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              showCategoryPicker ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Category Picker Dropdown */}
          {showCategoryPicker && (
            <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="search"
                    placeholder={inputLanguage === 'th' ? 'ค้นหา...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
                    inputMode="search"
                  />
                </div>
              </div>

              {/* Categories List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowCategoryPicker(false)
                      setSearchQuery('')
                      setErrors(prev => ({ ...prev, category: '' }))
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1">
                      <div className="font-handwritten text-gray-800">
                        {inputLanguage === 'th' ? category.nameLocal : category.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {category.examples.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    {selectedCategory?.id === category.id && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {errors.category && (
            <div className="text-red-600 text-sm mt-1">{errors.category}</div>
          )}
        </div>

        {/* Disposal Method Selection */}
        {selectedCategory && (
          <div className="relative" ref={disposalPickerRef}>
            <label className="block text-sm font-handwritten text-ink mb-2">
              Disposal Method • วิธีกำจัด *
            </label>
            <button
              type="button"
              onClick={() => setShowDisposalPicker(!showDisposalPicker)}
              className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                errors.disposal 
                  ? 'border-red-300 bg-red-50' 
                  : showDisposalPicker 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex-1 text-left">
                {selectedDisposal ? (
                  <div>
                    <div className="font-handwritten text-gray-800 capitalize">
                      {inputLanguage === 'th' 
                        ? THAI_DISPOSAL_METHODS[selectedDisposal as keyof typeof THAI_DISPOSAL_METHODS]
                        : selectedDisposal.replace('_', ' ')
                      }
                    </div>
                    <div className="text-xs text-gray-600">
                      {selectedCategory.carbonCredits[selectedDisposal] > 0 ? '+' : ''}
                      {selectedCategory.carbonCredits[selectedDisposal]} credits/kg
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 font-handwritten">
                    {inputLanguage === 'th' ? 'เลือกวิธีกำจัด' : 'Select disposal method'}
                  </div>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                showDisposalPicker ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Disposal Method Picker */}
            {showDisposalPicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {getAvailableDisposalMethods().map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setSelectedDisposal(method.id)
                      setShowDisposalPicker(false)
                      setErrors(prev => ({ ...prev, disposal: '' }))
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <div className="font-handwritten text-gray-800">
                        {inputLanguage === 'th' ? method.nameThai : method.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {inputLanguage === 'th' ? method.name : method.nameThai}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-handwritten ${
                        method.credits > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {method.credits > 0 ? '+' : ''}{method.credits} CC
                      </div>
                      {selectedDisposal === method.id && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {errors.disposal && (
              <div className="text-red-600 text-sm mt-1">{errors.disposal}</div>
            )}
          </div>
        )}

        {/* Weight Selection */}
        <div>
          <label className="block text-sm font-handwritten text-ink mb-2">
            Weight • น้ำหนัก *
          </label>
          <MobileWeightSelector
            value={weight}
            onChange={setWeight}
            showVisualReference={true}
          />
          {errors.weight && (
            <div className="text-red-600 text-sm mt-1">{errors.weight}</div>
          )}
        </div>

        {/* Location Selection */}
        <div className="relative" ref={locationPickerRef}>
          <label className="block text-sm font-handwritten text-ink mb-2">
            Location • สถานที่ (Optional)
          </label>
          <button
            type="button"
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
              showLocationPicker 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              {location ? (
                <div className="font-handwritten text-gray-800">{location}</div>
              ) : (
                <div className="text-gray-500 font-handwritten">
                  {inputLanguage === 'th' ? 'เลือกสถานที่' : 'Select location'}
                </div>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
              showLocationPicker ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Location Picker */}
          {showLocationPicker && (
            <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
              {THAI_LOCATIONS.map(loc => (
                <button
                  key={loc.en}
                  type="button"
                  onClick={() => {
                    setLocation(inputLanguage === 'th' ? loc.th : loc.en)
                    setShowLocationPicker(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-xl">{loc.icon}</span>
                  <div>
                    <div className="font-handwritten text-gray-800">
                      {inputLanguage === 'th' ? loc.th : loc.en}
                    </div>
                    <div className="text-xs text-gray-600">
                      {inputLanguage === 'th' ? loc.en : loc.th}
                    </div>
                  </div>
                  {(location === loc.en || location === loc.th) && (
                    <Check className="w-5 h-5 text-green-500 ml-auto" />
                  )}
                </button>
              ))}
              
              {/* Custom location input */}
              <div className="p-3 border-t border-gray-100">
                <input
                  type="text"
                  placeholder={inputLanguage === 'th' ? 'สถานที่อื่น...' : 'Other location...'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setShowLocationPicker(false)
                    }
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
                  inputMode="text"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-handwritten text-ink mb-2">
            Notes • หมายเหตุ (Optional)
          </label>
          <textarea
            ref={notesInputRef}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={inputLanguage === 'th' 
              ? 'รายละเอียดเพิ่มเติม...' 
              : 'Additional details...'
            }
            className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none font-handwritten text-gray-800 placeholder-gray-500 min-h-[80px]"
            rows={3}
            inputMode="text"
          />
        </div>

        {/* Credits Preview */}
        {selectedCategory && selectedDisposal && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-green-600" />
                <div className="text-sm font-handwritten text-green-800">
                  Carbon Credits Preview
                </div>
              </div>
              <div className={`text-3xl font-handwritten ${
                calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
              </div>
              <div className="text-xs text-gray-600 mt-1">
                ≈ {Math.abs(calculateCredits())} grams CO₂ impact
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-700 font-handwritten rounded-xl hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel • ยกเลิก
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !selectedCategory || !selectedDisposal}
            className="flex-1 py-4 px-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-handwritten rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {inputLanguage === 'th' ? 'บันทึกรายการ' : 'Save Entry'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Tips */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
        <h4 className="text-sm font-handwritten text-yellow-800 mb-2">
          💡 {inputLanguage === 'th' ? 'เคล็ดลับ' : 'Quick Tips'}:
        </h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• {inputLanguage === 'th' 
            ? 'เลือกวิธีกำจัดที่ดีที่สุดเพื่อรับเครดิตสูงสุด' 
            : 'Choose the best disposal method for maximum credits'
          }</li>
          <li>• {inputLanguage === 'th' 
            ? 'การรีไซเคิลและหลีกเลี่ยงขยะให้เครดิตบวก' 
            : 'Recycling and avoiding waste gives positive credits'
          }</li>
          <li>• {inputLanguage === 'th' 
            ? 'น้ำหนักที่แม่นยำช่วยคำนวณผลกระทบได้ถูกต้อง' 
            : 'Accurate weight helps calculate environmental impact'
          }</li>
        </ul>
      </div>
    </div>
  )
}