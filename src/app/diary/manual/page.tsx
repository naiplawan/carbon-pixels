'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import wasteCategories from '@/data/thailand-waste-categories.json'

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
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  const getSelectedCategoryData = () => {
    return wasteCategories.wasteCategories.find(cat => cat.id === selectedCategory)
  }

  const calculateCredits = () => {
    const categoryData = getSelectedCategoryData()
    if (!categoryData || !selectedDisposal || !weight) return 0
    
    const weightNum = parseFloat(weight)
    const baseCredits = (categoryData.carbonCredits as any)[selectedDisposal] || 0
    return Math.round(baseCredits * weightNum)
  }

  const handleSave = () => {
    const categoryData = getSelectedCategoryData()
    if (!categoryData || !selectedDisposal || !weight) return

    const entry: WasteEntry = {
      id: Date.now().toString(),
      categoryId: selectedCategory,
      categoryName: categoryData.name,
      disposal: selectedDisposal,
      weight: parseFloat(weight),
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
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-handwritten text-ink mb-4">
            Manual Waste Entry ✏️
          </h1>
          <p className="text-lg text-pencil font-sketch">
            Add waste items manually to your diary
          </p>
        </header>

        <div className="bg-white/70 p-6 rounded-lg border-2 border-dashed border-pencil">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block font-sketch text-ink mb-3">What type of waste? 🗑️</label>
            <div className="grid grid-cols-2 gap-3">
              {wasteCategories.wasteCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSelectedDisposal('') // Reset disposal when category changes
                  }}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedCategory === category.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-sketch text-sm">{category.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{category.nameLocal}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Info */}
          {selectedCategory && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">{getSelectedCategoryData()?.icon}</div>
                <div>
                  <div className="font-sketch text-blue-800">{getSelectedCategoryData()?.name}</div>
                  <div className="text-sm text-blue-600">{getSelectedCategoryData()?.description}</div>
                </div>
              </div>
              <div className="text-xs text-blue-600">
                Examples: {getSelectedCategoryData()?.examples.join(', ')}
              </div>
            </div>
          )}

          {/* Disposal Method */}
          {selectedCategory && (
            <div className="mb-6">
              <label className="block font-sketch text-ink mb-3">How did you dispose of it? ♻️</label>
              <div className="space-y-2">
                {Object.entries((getSelectedCategoryData()?.carbonCredits as any) || {}).map(([method, credits]) => (
                  <button
                    key={method}
                    onClick={() => setSelectedDisposal(method)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedDisposal === method
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-sketch capitalize">
                        {method.replace('_', ' ')}
                      </div>
                      <div className={`font-semibold ${
                        (credits as number) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(credits as number) > 0 ? '+' : ''}{(credits as number)} CC/kg
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weight Input */}
          {selectedDisposal && (
            <div className="mb-6">
              <label className="block font-sketch text-ink mb-3">How much did it weigh? ⚖️</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.5"
                  className="flex-1 p-3 border rounded-lg font-sketch focus:ring-2 focus:ring-green-500"
                />
                <div className="flex items-center px-3 bg-gray-100 rounded-lg font-sketch text-gray-600">
                  kg
                </div>
              </div>
              
              {/* Common weight suggestions */}
              <div className="mt-2 flex gap-2 flex-wrap">
                {['0.1', '0.2', '0.5', '1.0', '2.0'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setWeight(suggestion)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 font-sketch"
                  >
                    {suggestion}kg
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Credits Preview */}
          {selectedCategory && selectedDisposal && weight && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-center">
                <div className="font-sketch text-green-800 mb-2">Carbon Credits Earned</div>
                <div className={`text-4xl font-handwritten ${
                  calculateCredits() > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {calculateCredits() > 0 ? '+' : ''}{calculateCredits()} CC
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {parseFloat(weight)}kg × {(getSelectedCategoryData()?.carbonCredits as any)?.[selectedDisposal]} credits/kg
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          {selectedCategory && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-sketch text-yellow-800 mb-2">💡 Tips for {getSelectedCategoryData()?.name}:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {getSelectedCategoryData()?.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes (Optional) */}
          <div className="mb-6">
            <label className="block font-sketch text-ink mb-3">Notes (optional) 📝</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              className="w-full p-3 border rounded-lg font-sketch focus:ring-2 focus:ring-green-500 h-20 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              href="/diary"
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-sketch rounded-lg hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={!selectedCategory || !selectedDisposal || !weight}
              className="flex-1 px-4 py-3 bg-green-leaf text-white font-sketch rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}