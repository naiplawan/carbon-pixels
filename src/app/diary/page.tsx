'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WasteScanner from '@/components/WasteScanner'
import GameificationPanel from '@/components/GameificationPanel'

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

export default function WasteDiaryPage() {
  const [todayEntries, setTodayEntries] = useState<WasteEntry[]>([])
  const [totalCredits, setTotalCredits] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(100)
  const [currentLevel, setCurrentLevel] = useState(1)

  useEffect(() => {
    // Load saved entries from localStorage
    const savedEntries = localStorage.getItem('wasteEntries')
    if (savedEntries) {
      const entries = JSON.parse(savedEntries)
      const today = new Date().toDateString()
      const todayEntries = entries.filter((entry: WasteEntry) => 
        new Date(entry.timestamp).toDateString() === today
      )
      setTodayEntries(todayEntries)
    }

    // Load total credits
    const savedCredits = localStorage.getItem('carbonCredits')
    if (savedCredits) {
      setTotalCredits(parseInt(savedCredits))
    }
  }, [])

  const calculateTodayCredits = () => {
    return todayEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0)
  }

  const calculateTodayWaste = () => {
    return todayEntries.reduce((sum, entry) => sum + entry.weight, 0)
  }

  const getTreeEquivalent = () => {
    return Math.floor(totalCredits / 500) // 500 credits = 1 tree
  }

  const addWasteEntry = (entry: WasteEntry) => {
    const updatedEntries = [...todayEntries, entry]
    setTodayEntries(updatedEntries)
    setTotalCredits(totalCredits + entry.carbonCredits)

    // Save to localStorage
    const allEntries = JSON.parse(localStorage.getItem('wasteEntries') || '[]')
    allEntries.push(entry)
    localStorage.setItem('wasteEntries', JSON.stringify(allEntries))
    localStorage.setItem('carbonCredits', (totalCredits + entry.carbonCredits).toString())
  }

  return (
    <div className="notebook-page min-h-screen">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-handwritten text-ink mb-2">
            Thailand Waste Diary 🗂️
          </h1>
          <p className="text-lg text-pencil font-sketch">
            Track your daily waste, earn carbon credits, save the planet! 🌱
          </p>
        </header>

        {/* Primary Stats - Focus on Today */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-green-300 text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-3xl font-handwritten text-green-600 mb-1">
              {calculateTodayCredits()}
            </div>
            <div className="text-lg text-green-700 font-sketch">Today&apos;s Credits</div>
            <div className="text-sm text-green-600 mt-1">
              {calculateTodayWaste().toFixed(1)}kg waste tracked
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-blue-300 text-center">
            <div className="text-4xl mb-3">🌳</div>
            <div className="text-3xl font-handwritten text-blue-600 mb-1">
              {getTreeEquivalent()}
            </div>
            <div className="text-lg text-blue-700 font-sketch">Trees Saved</div>
            <div className="text-sm text-blue-600 mt-1">
              {totalCredits} total credits earned
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => setShowScanner(true)}
            className="px-8 py-4 bg-green-leaf text-white text-xl font-sketch rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-200 sketch-element flex items-center gap-2 relative"
          >
            📷 AI Scanner (Demo)
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-1 rounded">
              BETA
            </span>
          </button>
          
          <Link 
            href="/diary/manual"
            className="px-8 py-4 bg-blue-500 text-white text-xl font-sketch rounded-lg hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 sketch-element flex items-center gap-2 text-center relative"
          >
            ✏️ Manual Entry
            <span className="absolute -top-2 -right-2 bg-green-400 text-white text-xs px-1 rounded">
              ✓
            </span>
          </Link>
          
          <Link 
            href="/diary/history"
            className="px-8 py-4 bg-purple-500 text-white text-xl font-sketch rounded-lg hover:bg-purple-600 transform hover:scale-105 transition-all duration-200 sketch-element flex items-center gap-2 text-center"
          >
            📚 View History
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Entries */}
          <div className="bg-white/70 p-6 rounded-lg border-2 border-dashed border-pencil">
            <h2 className="text-2xl font-handwritten text-ink mb-4">Today&apos;s Waste Diary 📝</h2>
            
            {todayEntries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-pencil font-sketch">No waste tracked today!</p>
                <p className="text-sm text-gray-600 mt-2">Start by scanning or adding your first item</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(entry.categoryId)}</div>
                      <div>
                        <div className="font-sketch text-ink">{entry.categoryName}</div>
                        <div className="text-sm text-gray-600">
                          {entry.weight}kg • {entry.disposal}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        entry.carbonCredits > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.carbonCredits > 0 ? '+' : ''}{entry.carbonCredits} CC
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gamification Panel */}
          <GameificationPanel 
            totalCredits={totalCredits}
            todayCredits={calculateTodayCredits()}
            level={currentLevel}
            achievements={[]}
          />
        </div>

        {/* Daily Progress - Simplified */}
        {calculateTodayCredits() > 0 && (
          <div className="mt-8">
            <div className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-pencil">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-handwritten text-ink">Daily Goal Progress</h3>
                <span className="text-pencil font-sketch text-sm">
                  {calculateTodayCredits()} / {dailyGoal} Credits
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((calculateTodayCredits() / dailyGoal) * 100, 100)}%` }}
                />
              </div>

              {calculateTodayCredits() >= dailyGoal && (
                <div className="mt-3 text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg">🎉</div>
                  <div className="font-handwritten text-green-800 text-sm">Daily Goal Achieved!</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights Section - Collapsible */}
        <details className="mt-8">
          <summary className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-pencil cursor-pointer hover:bg-white/80 transition-colors">
            <span className="text-lg font-handwritten text-ink">📊 Environmental Impact Insights</span>
            <span className="text-sm text-pencil ml-2">(Click to expand)</span>
          </summary>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200 text-center">
              <div className="text-2xl mb-2">🌍</div>
              <div className="text-sm font-handwritten text-green-800 mb-1">
                CO₂ Impact Today
              </div>
              <div className="text-lg font-semibold text-green-600">
                {(calculateTodayCredits() * 0.001).toFixed(2)}kg saved
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm font-handwritten text-blue-800 mb-1">
                Thailand Ranking
              </div>
              <div className="text-lg font-semibold text-blue-600">
                Top {Math.max(100 - Math.floor(totalCredits / 50), 1)}%
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-handwritten text-purple-800 mb-1">
                Energy Equivalent
              </div>
              <div className="text-lg font-semibold text-purple-600">
                {Math.floor(totalCredits / 10)}kWh saved
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Waste Scanner Modal */}
      {showScanner && (
        <WasteScanner 
          onClose={() => setShowScanner(false)}
          onSave={addWasteEntry}
        />
      )}
    </div>
  )
}

function getCategoryIcon(categoryId: string): string {
  const iconMap: { [key: string]: string } = {
    'food_waste': '🍎',
    'plastic_bottles': '🍾',
    'plastic_bags': '🛍️',
    'paper_cardboard': '📄',
    'glass_bottles': '🫙',
    'metal_cans': '🥫',
    'organic_waste': '🍃',
    'electronic_waste': '📱'
  }
  return iconMap[categoryId] || '🗑️'
}