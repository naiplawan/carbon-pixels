'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import wasteCategories from '@/data/thailand-waste-categories.json'
import MobileCategorySelector from '@/components/MobileCategorySelector'
import { MobileWeightSelector } from '@/components/MobileWeightSelector'

// Touch feedback utilities
const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    };
    navigator.vibrate(patterns[type]);
  }
};

const addTouchFeedback = (element: HTMLElement) => {
  element.style.transition = 'all 0.1s ease-out';
  element.style.transform = 'scale(0.98)';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
};

interface WasteEntry {
  id: string
  categoryId: string
  categoryName: string
  disposal: string
  weight: number
  carbonCredits: number
  timestamp: Date
}

export default function ManualEntryPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDisposal, setSelectedDisposal] = useState('')
  const [weight, setWeight] = useState(0.1)
  const [notes, setNotes] = useState('')

  const getSelectedCategoryData = () => {
    return wasteCategories.wasteCategories.find(cat => cat.id === selectedCategory)
  }

  const calculateCredits = () => {
    const categoryData = getSelectedCategoryData()
    if (!categoryData || !selectedDisposal || !weight) return 0
    
    const baseCredits = (categoryData.carbonCredits as any)[selectedDisposal] || 0
    return Math.round(baseCredits * weight)
  }

  const handleSave = () => {
    const categoryData = getSelectedCategoryData()
    if (!categoryData || !selectedDisposal || weight <= 0) return

    const entry: WasteEntry = {
      id: Date.now().toString(),
      categoryId: selectedCategory,
      categoryName: categoryData.name,
      disposal: selectedDisposal,
      weight: weight,
      carbonCredits: calculateCredits(),
      timestamp: new Date()
    }

    // Save to localStorage
    const allEntries = JSON.parse(localStorage.getItem('wasteEntries') || '[]')
    allEntries.push(entry)
    localStorage.setItem('wasteEntries', JSON.stringify(allEntries))

    // Update total credits
    const currentCredits = parseInt(localStorage.getItem('carbonCredits') || '0')
    localStorage.setItem('carbonCredits', (currentCredits + entry.carbonCredits).toString())

    router.push('/diary')
  }

  return (
    <div className="notebook-page min-h-screen">
      <div className="max-w-2xl mx-auto p-3 sm:p-6 md:p-8">
        {/* Header - Mobile optimized */}
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-handwritten text-ink mb-3">
            Manual Waste Entry ✏️
          </h1>
          <p className="text-base sm:text-lg text-pencil font-sketch">
            Add waste items manually to your diary
          </p>
        </header>

        <div className="bg-white/80 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-pencil shadow-lg">
          {/* Category Selection - Mobile optimized */}
          <div className="mb-8">
            <MobileCategorySelector
              selectedCategory={selectedCategory}
              onCategorySelect={(categoryId) => {
                setSelectedCategory(categoryId);
                setSelectedDisposal(''); // Reset disposal when category changes
              }}
              showDetails={true}
            />
          </div>

          {/* Category info is now included in MobileCategorySelector */}

          {/* Disposal Method - Mobile optimized */}
          {selectedCategory && (
            <div className="mb-8">
              <label className="block font-handwritten text-ink mb-4 text-lg text-center">
                How did you dispose of it? ♻️
              </label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries((getSelectedCategoryData()?.carbonCredits as any) || {}).map(([method, credits]) => (
                  <button
                    key={method}
                    onClick={(e) => {
                      hapticFeedback('medium');
                      addTouchFeedback(e.currentTarget);
                      setSelectedDisposal(method);
                    }}
                    className={`min-h-[64px] p-4 text-left rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md active:shadow-sm ${
                      selectedDisposal === method
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 ring-2 ring-green-200'
                        : 'border-gray-300 bg-white hover:border-green-400 hover:bg-gradient-to-r hover:from-green-25 hover:to-green-50 active:border-green-500'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                    aria-label={`Select ${method.replace('_', ' ')} disposal method`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-sketch capitalize text-base font-semibold">
                        {method.replace('_', ' ')}
                      </div>
                      <div className={`font-bold px-3 py-1 rounded-full text-sm ${
                        (credits as number) > 0 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {(credits as number) > 0 ? '+' : ''}{(credits as number)} CC/kg
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weight Input - Mobile optimized */}
          {selectedDisposal && (
            <div className="mb-8">
              <div className="text-center mb-4">
                <label className="font-handwritten text-ink text-lg">
                  How much did it weigh? ⚖️
                </label>
              </div>
              <MobileWeightSelector
                value={weight}
                onChange={setWeight}
                showVisualReference={true}
                className=""
              />
            </div>
          )}

          {/* Credits Preview - Enhanced */}
          {selectedCategory && selectedDisposal && weight > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-green-200 shadow-inner">
              <div className="text-center">
                <div className="font-sketch text-green-800 mb-3 text-lg font-semibold">
                  Carbon Credits Earned
                </div>
                <div className={`text-5xl font-handwritten mb-3 ${
                  calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
                </div>
                <div className="text-base text-gray-600 font-sketch bg-white/60 rounded-lg p-3">
                  {weight.toFixed(1)}kg × {(getSelectedCategoryData()?.carbonCredits as any)?.[selectedDisposal]} credits/kg
                </div>
                <div className="mt-3 text-sm text-gray-600 font-sketch">
                  {calculateCredits() > 0 
                    ? '🌱 Positive impact on the environment!' 
                    : '⚠️ Consider better disposal methods for more credits'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Tips - Enhanced */}
          {selectedCategory && getSelectedCategoryData()?.tips && (
            <div className="mb-8 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 shadow-inner">
              <h4 className="font-handwritten text-yellow-800 mb-4 text-lg flex items-center justify-center gap-2">
                <span className="text-xl">💡</span>
                <span>Tips for {getSelectedCategoryData()?.name}</span>
              </h4>
              <ul className="space-y-3">
                {getSelectedCategoryData()?.tips.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl">
                    <span className="text-yellow-600 font-bold text-lg mt-0.5">•</span>
                    <span className="text-sm text-yellow-800 font-sketch leading-relaxed flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes (Optional) - Mobile optimized */}
          <div className="mb-8">
            <label className="block font-handwritten text-ink mb-3 text-lg text-center">
              Notes (optional) 📝
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={() => hapticFeedback('light')}
              placeholder="Any additional details..."
              className="w-full p-4 border-2 border-gray-300 rounded-xl font-sketch focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:border-green-500 outline-none bg-white min-h-[88px] text-base resize-none"
              style={{ fontSize: '16px', touchAction: 'manipulation' }}
            />
          </div>

          {/* Action Buttons - Mobile optimized */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/diary"
              className="flex-1 min-h-[56px] px-6 py-4 border-2 border-gray-400 text-gray-700 font-sketch rounded-xl hover:bg-gray-50 active:bg-gray-100 text-center flex items-center justify-center transition-all duration-200 bg-white shadow-sm text-base"
              style={{ touchAction: 'manipulation' }}
            >
              Cancel
            </Link>
            <button
              onClick={(e) => {
                if (!selectedCategory || !selectedDisposal || !weight) return;
                hapticFeedback('heavy');
                addTouchFeedback(e.currentTarget);
                handleSave();
              }}
              disabled={!selectedCategory || !selectedDisposal || !weight}
              className="flex-1 min-h-[56px] px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-sketch rounded-xl hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-200 shadow-lg disabled:shadow-none text-base font-semibold"
              style={{ touchAction: 'manipulation' }}
              aria-label="Save waste entry to diary"
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}