'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import { storage, preloadStorageData } from '@/lib/storage-performance'
import { PWAManager, OfflineIndicator, usePWA } from '@/components/PWAManager'
import { notificationManager } from '@/lib/notifications'
import { performanceMonitor, usePerformanceTracking } from '@/lib/performance-monitor'

// Lazy load heavy components
const WasteScanner = lazy(() => import('@/components/WasteScanner'))
const GameificationPanel = lazy(() => import('@/components/GameificationPanel'))
const NotificationManager = lazy(() => import('@/components/NotificationManager'))
const SocialShareManager = lazy(() => import('@/components/SocialShareManager'))
const CommunityPanel = lazy(() => import('@/components/CommunityPanelEnhanced'))

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
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showSocialShare, setShowSocialShare] = useState(false)
  const [showCommunity, setShowCommunity] = useState(false)
  const [allWasteEntries, setAllWasteEntries] = useState<WasteEntry[]>([])
  
  const { showAchievement } = usePWA()
  const { trackWasteAction, getComponentMetrics } = usePerformanceTracking('WasteDiary')

  // Preload data on component mount
  useEffect(() => {
    preloadStorageData()
  }, [])

  // Load data asynchronously without blocking render
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      const endTiming = trackWasteAction('data_load')
      
      try {
        const [todayEntries, totalCredits, allEntries] = await Promise.all([
          storage.getTodayEntries(),
          storage.getItem('carbonCredits', 0),
          storage.getItem('wasteEntries', [])
        ])
        
        if (isMounted) {
          setTodayEntries(todayEntries)
          setTotalCredits(totalCredits)
          setAllWasteEntries(allEntries)
        }
        
        endTiming() // Track data loading performance
      } catch (error) {
        console.error('Failed to load diary data:', error)
        endTiming() // Still track timing even on error
      }
    }

    loadData()
    
    return () => {
      isMounted = false
    }
  }, [trackWasteAction])

  // Memoized calculations to prevent re-computation
  const todayCredits = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0)
  }, [todayEntries])

  const todayWaste = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.weight, 0)
  }, [todayEntries])

  const treeEquivalent = useMemo(() => {
    return Math.floor(totalCredits / 500) // 500 credits = 1 tree
  }, [totalCredits])

  const progressToGoal = useMemo(() => {
    return Math.min((todayCredits / dailyGoal) * 100, 100)
  }, [todayCredits, dailyGoal])

  // Optimized entry addition with async storage and notifications
  const addWasteEntry = useCallback(async (entry: WasteEntry) => {
    const endTiming = trackWasteAction('add_entry')
    const previousCredits = totalCredits

    // Optimistic UI update
    setTodayEntries(prev => [...prev, entry])
    setTotalCredits(prev => prev + entry.carbonCredits)

    try {
      // Async storage operation
      await storage.addWasteEntry(entry)
      
      // Check for achievements and notify
      await checkForAchievements(previousCredits, totalCredits + entry.carbonCredits, entry)
      
      // Schedule engagement notifications
      notificationManager.scheduleEngagementNotifications()
      
      endTiming() // Track successful entry addition
    } catch (error) {
      console.error('Failed to save waste entry:', error)
      // Rollback on error
      setTodayEntries(prev => prev.filter(e => e.id !== entry.id))
      setTotalCredits(prev => prev - entry.carbonCredits)
      endTiming() // Track timing even on error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCredits, showAchievement])

  // Achievement checking function
  const checkForAchievements = useCallback(async (prevCredits: number, newCredits: number, entry: WasteEntry) => {
    const achievements = []

    // First entry achievement
    if (todayEntries.length === 0) {
      achievements.push({
        id: 'first-entry',
        title: 'First Entry Today! 🌱',
        description: 'Great start! You\'ve logged your first waste item today.',
        credits: entry.carbonCredits
      })
    }

    // Tree milestone achievements
    const prevTrees = Math.floor(prevCredits / 500)
    const newTrees = Math.floor(newCredits / 500)
    
    if (newTrees > prevTrees) {
      achievements.push({
        id: `tree-${newTrees}`,
        title: `${newTrees} Tree${newTrees > 1 ? 's' : ''} Saved! 🌳`,
        description: `Amazing! You've saved ${newTrees} tree equivalent${newTrees > 1 ? 's' : ''} through your waste tracking!`,
        credits: newCredits
      })
    }

    // Credit milestones
    const milestones = [100, 500, 1000, 2500, 5000, 10000]
    for (const milestone of milestones) {
      if (prevCredits < milestone && newCredits >= milestone) {
        achievements.push({
          id: `credits-${milestone}`,
          title: `${milestone} Credits Earned! 🎉`,
          description: `You've reached ${milestone} carbon credits! Keep up the great work!`,
          credits: newCredits
        })
      }
    }

    // Positive impact achievement (for recycling/composting)
    if (entry.carbonCredits > 0) {
      achievements.push({
        id: 'positive-impact',
        title: 'Positive Impact! 💚',
        description: `Great choice! You earned ${entry.carbonCredits} credits for sustainable disposal.`,
        credits: entry.carbonCredits
      })
    }

    // Show achievements
    for (const achievement of achievements) {
      if (showAchievement) {
        await showAchievement(achievement)
      }
      
      // Also show browser notification if available
      await notificationManager.showNotification({
        id: achievement.id,
        title: achievement.title,
        body: achievement.description,
        requiresPermission: true,
        tag: 'achievement'
      })
    }
  }, [todayEntries.length, showAchievement])

  return (
    <div className="notebook-page min-h-screen">
      <PWAManager />
      <OfflineIndicator />
      
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-handwritten text-ink mb-2">
            Thailand Waste Diary 🗂️
          </h1>
          <p className="text-lg text-pencil font-sketch">
            Track your daily waste, earn carbon credits, save the planet! 🌱
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-sketch"
            >
              🔔 Notifications
            </button>
            <button
              onClick={() => setShowSocialShare(!showSocialShare)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-sketch"
            >
              🚀 Share Impact
            </button>
            <button
              onClick={() => setShowCommunity(!showCommunity)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-sketch"
            >
              🌍 Community
            </button>
          </div>
        </header>

        {/* Notification Settings */}
        {showNotificationSettings && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6"></div>}>
            <NotificationManager />
          </Suspense>
        )}

        {/* Social Share Manager */}
        {showSocialShare && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6"></div>}>
            <SocialShareManager 
              totalCredits={totalCredits}
              wasteEntries={allWasteEntries}
              onClose={() => setShowSocialShare(false)}
            />
          </Suspense>
        )}

        {/* Community Panel */}
        {showCommunity && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6"></div>}>
            <CommunityPanel 
              totalCredits={totalCredits}
              onClose={() => setShowCommunity(false)}
            />
          </Suspense>
        )}

        {/* Primary Stats - Focus on Today */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-green-300 text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-3xl font-handwritten text-green-600 mb-1">
              {todayCredits}
            </div>
            <div className="text-lg text-green-700 font-sketch">Today&apos;s Credits</div>
            <div className="text-sm text-green-600 mt-1">
              {todayWaste.toFixed(1)}kg waste tracked
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-blue-300 text-center">
            <div className="text-4xl mb-3">🌳</div>
            <div className="text-3xl font-handwritten text-blue-600 mb-1">
              {treeEquivalent}
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

          {/* Gamification Panel with Suspense */}
          <Suspense fallback={<GameificationSkeleton />}>
            <GameificationPanel 
              totalCredits={totalCredits}
              todayCredits={todayCredits}
              level={currentLevel}
              achievements={[]}
            />
          </Suspense>
        </div>

        {/* Daily Progress - Simplified */}
        {todayCredits > 0 && (
          <div className="mt-8">
            <div className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-pencil">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-handwritten text-ink">Daily Goal Progress</h3>
                <span className="text-pencil font-sketch text-sm">
                  {todayCredits} / {dailyGoal} Credits
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressToGoal}%` }}
                />
              </div>

              {todayCredits >= dailyGoal && (
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
                {(todayCredits * 0.001).toFixed(2)}kg saved
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

      {/* Waste Scanner Modal with Suspense */}
      {showScanner && (
        <Suspense fallback={<ScannerSkeleton />}>
          <WasteScanner 
            onClose={() => setShowScanner(false)}
            onSave={addWasteEntry}
          />
        </Suspense>
      )}
    </div>
  )
}

// Performance: Memoized category icon lookup
const getCategoryIcon = (() => {
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
  return (categoryId: string): string => iconMap[categoryId] || '🗑️'
})()

// Loading skeleton components for better perceived performance
function GameificationSkeleton() {
  return (
    <div className="bg-white/70 p-6 rounded-lg border-2 border-dashed border-pencil animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-16 bg-gray-100 rounded"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
      </div>
    </div>
  )
}

function ScannerSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-100 rounded mb-4"></div>
        <div className="h-10 bg-gray-100 rounded"></div>
      </div>
    </div>
  )
}