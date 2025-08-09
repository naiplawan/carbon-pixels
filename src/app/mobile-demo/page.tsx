'use client'

import { useState } from 'react'
import { Plus, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'
import MobileWasteEntryHub, { useMobileWasteEntry } from '@/components/MobileWasteEntryHub'
import SmartInputSuggestions from '@/components/SmartInputSuggestions'
import { MobileWeightSelector } from '@/components/MobileWeightSelector'
import ThaiVoiceInput from '@/components/ThaiVoiceInput'

export default function MobileDemoPage() {
  const { isOpen, setIsOpen, recentEntries, addEntry } = useMobileWasteEntry()
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [weight, setWeight] = useState(0.5)
  const [totalCredits, setTotalCredits] = useState(0)

  const handleEntryAdded = (entry: any) => {
    addEntry(entry)
    setTotalCredits(prev => prev + entry.carbonCredits)
    
    // Show success notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Waste Entry Added!', {
        body: `${entry.categoryName} - ${entry.carbonCredits > 0 ? '+' : ''}${entry.carbonCredits} CC`,
        icon: '/favicon.ico'
      })
    }
  }

  const handleVoiceResult = (result: any) => {
    if (result.category) {
      console.log('Voice detected:', result)
    }
    setShowVoiceInput(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-handwritten text-ink">
                Mobile Waste Diary
              </h1>
              <p className="text-sm text-pencil">
                Enhanced mobile input experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-handwritten text-green-600 mb-1">
                {recentEntries.length}
              </div>
              <div className="text-sm text-gray-600">Entries</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-center">
              <div className={`text-2xl font-handwritten mb-1 ${
                totalCredits > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalCredits > 0 ? '+' : ''}{totalCredits}
              </div>
              <div className="text-sm text-gray-600">Credits</div>
            </div>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-6 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg font-handwritten">
            Add Waste Entry • เพิ่มรายการขยะ
          </span>
        </button>

        {/* Component Showcase */}
        <div className="space-y-6">
          <h2 className="text-xl font-handwritten text-ink text-center">
            Component Showcase
          </h2>

          {/* Smart Suggestions */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-handwritten text-ink mb-3">Smart Suggestions</h3>
            <SmartInputSuggestions
              onSuggestionSelect={(category) => {
                console.log('Suggestion selected:', category)
              }}
              recentEntries={recentEntries}
            />
          </div>

          {/* Mobile Weight Selector */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-handwritten text-ink mb-3">Weight Selector</h3>
            <MobileWeightSelector
              value={weight}
              onChange={setWeight}
              showVisualReference={true}
            />
          </div>

          {/* Voice Input Demo */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-handwritten text-ink mb-3">Thai Voice Input</h3>
            <button
              onClick={() => setShowVoiceInput(true)}
              className="w-full bg-green-100 hover:bg-green-200 text-green-800 rounded-xl p-4 font-handwritten transition-colors"
            >
              🎤 Test Voice Recognition
            </button>
          </div>
        </div>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-handwritten text-ink mb-3">
              Recent Entries • รายการล่าสุด
            </h3>
            <div className="space-y-3">
              {recentEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {/* Find category icon */}
                      {entry.categoryId === 'food_waste' && '🍎'}
                      {entry.categoryId === 'plastic_bottles' && '🍾'}
                      {entry.categoryId === 'plastic_bags' && '🛍️'}
                      {entry.categoryId === 'paper_cardboard' && '📄'}
                      {entry.categoryId === 'glass_bottles' && '🫙'}
                      {entry.categoryId === 'metal_cans' && '🥫'}
                      {entry.categoryId === 'organic_waste' && '🍃'}
                      {entry.categoryId === 'electronic_waste' && '📱'}
                    </span>
                    <div>
                      <div className="text-sm font-handwritten text-gray-800">
                        {entry.categoryName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {entry.weight}kg • {entry.disposal}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-handwritten ${
                    entry.carbonCredits > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.carbonCredits > 0 ? '+' : ''}{entry.carbonCredits} CC
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-handwritten text-ink mb-3">
            🚀 Mobile Features • ฟีเจอร์มือถือ
          </h3>
          <div className="space-y-2">
            {[
              { feature: 'AI Camera Recognition', thai: 'การจดจำด้วยกล้อง AI', status: 'active' },
              { feature: 'Thai Voice Input', thai: 'ป้อนข้อมูลด้วยเสียงไทย', status: 'active' },
              { feature: 'Touch-Friendly Forms', thai: 'ฟอร์มเหมาะสำหรับสัมผัส', status: 'active' },
              { feature: 'Smart Suggestions', thai: 'คำแนะนำอัจฉริยะ', status: 'active' },
              { feature: 'Haptic Feedback', thai: 'การสั่นสะเทือนตอบกลับ', status: 'active' },
              { feature: 'Cultural Context', thai: 'บริบททางวัฒนธรรม', status: 'active' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                {item.status === 'active' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {item.feature}
                  </div>
                  <div className="text-xs text-gray-600">
                    {item.thai}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-lg font-handwritten text-blue-800 mb-2">
            💡 How to Use • วิธีใช้งาน
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <div>1. Tap &quot;Add Waste Entry&quot; button</div>
            <div>2. Choose camera, voice, or manual input</div>
            <div>3. Follow the guided steps</div>
            <div>4. Earn carbon credits for eco-friendly choices!</div>
          </div>
        </div>
      </div>

      {/* Mobile Waste Entry Hub */}
      <MobileWasteEntryHub
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onEntryAdded={handleEntryAdded}
        recentEntries={recentEntries}
        userPreferences={{
          preferredLanguage: 'auto',
          preferredInputMethod: 'smart',
          enableHapticFeedback: true,
          enableVoiceFeedback: true
        }}
      />

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ThaiVoiceInput
              isOpen={true}
              onResult={handleVoiceResult}
              onCancel={() => setShowVoiceInput(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}