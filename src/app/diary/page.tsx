'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import { useNetworkAwareLoading } from '@/hooks/useNetworkConnection'
// Mobile performance monitoring removed for build
import wasteCategories from '@/data/thailand-waste-categories.json'
import { storage, preloadStorageData } from '@/lib/storage-performance'
import { PWAManager, OfflineIndicator, usePWA } from '@/components/PWAManager'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import ErrorBoundary from '@/components/ErrorBoundary'
import { OfflineIndicator as EnhancedOfflineIndicator } from '@/components/OfflineIndicator'
// Mobile components will be created
import { notificationManager } from '@/lib/notifications'
import { performanceMonitor, usePerformanceTracking } from '@/lib/performance-monitor'
import { useOnboarding } from '@/hooks/useOnboarding'
import { HelpTooltip, InteractiveTooltip, FeatureHighlight } from '@/components/Tooltip'
import FloatingHelp from '@/components/FloatingHelp'

// Lazy load heavy components with mobile optimization
const WasteScanner = lazy(() => import('@/components/WasteScanner'))
// Mobile optimized scanner will be added later
const GameificationPanel = lazy(() => import('@/components/GameificationPanel'))
const NotificationManager = lazy(() => import('@/components/NotificationManager'))
const NotificationSettings = lazy(() => import('@/components/NotificationSettings'))
const ToastContainer = lazy(() => import('@/components/ToastNotification').then(module => ({ default: module.ToastContainer })))
const SocialShareManager = lazy(() => import('@/components/SocialShareManager'))
const CommunityPanel = lazy(() => import('@/components/CommunityPanelEnhanced'))
const OnboardingTutorial = lazy(() => import('@/components/OnboardingTutorial'))
const DataExport = lazy(() => import('@/components/DataExport'))
const UserPreferencesModal = lazy(() => import('@/components/UserPreferences').then(module => ({ default: module.UserPreferencesModal })))
const QuickActionsWidget = lazy(() => import('@/components/QuickActions').then(module => ({ default: module.QuickActionsWidget })))

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
  const [showDataExport, setShowDataExport] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [allWasteEntries, setAllWasteEntries] = useState<WasteEntry[]>([])
  
  const { showAchievement } = usePWA()
  const { trackWasteAction, getComponentMetrics } = usePerformanceTracking('WasteDiary')
  const networkInfo = useNetworkAwareLoading()
  const { isSlowConnection, networkStrength, shouldEnableAnimations } = networkInfo
  
  // Onboarding state
  const {
    shouldShowTutorial,
    markTutorialCompleted,
    markTutorialSkipped,
    shouldShowFeatureHighlight,
    markFeatureHighlightSeen
  } = useOnboarding()

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
    <ErrorBoundary>
      <div className="notebook-page min-h-screen">
        <PWAManager />
        <EnhancedOfflineIndicator />
      
      {/* Onboarding Tutorial */}
      {shouldShowTutorial && (
        <Suspense fallback={null}>
          <OnboardingTutorial
            onComplete={markTutorialCompleted}
            onSkip={markTutorialSkipped}
          />
        </Suspense>
      )}
      
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-4" />
        
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl sm:text-5xl font-handwritten text-ink">
              Thailand Waste Diary 🗂️
            </h1>
            <HelpTooltip
              title="About Waste Diary"
              content={
                <div className="space-y-2">
                  <p>Track your daily waste to earn carbon credits and help Thailand reach its 2050 carbon neutrality goal.</p>
                  <p><strong>How it works:</strong></p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Scan or manually add waste items</li>
                    <li>Choose disposal method (recycling earns more credits)</li>
                    <li>Watch your environmental impact grow</li>
                    <li>Level up and unlock achievements</li>
                  </ul>
                </div>
              }
              position="bottom"
            />
          </div>
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
              onClick={() => setShowDataExport(!showDataExport)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-sketch"
            >
              📊 Export & Share
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
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-sketch"
            >
              ⚙️ Settings
            </button>
            <InteractiveTooltip
              title="Need Help?"
              content={
                <div className="space-y-3">
                  <p className="text-sm">Get help with the waste diary:</p>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('onboarding_completed')
                      localStorage.removeItem('onboarding_skipped')
                      window.location.reload()
                    }}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    🔄 Restart Tutorial
                  </button>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Quick Tips:</strong></p>
                    <p>• Click stats for detailed explanations</p>
                    <p>• Hover over help icons for tips</p>
                    <p>• Avoid plastic bags for max credits</p>
                    <p>• Choose recycling when possible</p>
                  </div>
                </div>
              }
              position="bottom"
            >
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-sketch">
                ❓ Help
              </button>
            </InteractiveTooltip>
          </div>
        </header>

        {/* Notification Settings */}
        {showNotificationSettings && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6"></div>}>
            <NotificationManager />
          </Suspense>
        )}

        {/* Data Export & Sharing */}
        {showDataExport && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6"></div>}>
            <DataExport 
              wasteEntries={allWasteEntries}
              totalCredits={totalCredits}
              onClose={() => setShowDataExport(false)}
            />
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

        {/* User Preferences Modal */}
        {showPreferences && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6"></div>}>
            <UserPreferencesModal 
              isOpen={showPreferences}
              onClose={() => setShowPreferences(false)}
            />
          </Suspense>
        )}

        {/* Primary Stats - Focus on Today */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InteractiveTooltip
            title="Carbon Credits Explained"
            content={
              <div className="space-y-2">
                <p><strong>Today&apos;s Credits:</strong> {todayCredits}</p>
                <p><strong>Weight Tracked:</strong> {todayWaste.toFixed(1)}kg</p>
                <hr className="my-2" />
                <p className="text-xs">
                  <strong>How Credits Work:</strong>
                </p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li><strong>Positive:</strong> Recycling, composting, avoiding waste</li>
                  <li><strong>Negative:</strong> Landfill disposal, single-use items</li>
                  <li><strong>Formula:</strong> Credits = base_per_kg × weight × method</li>
                </ul>
                <p className="text-xs mt-2 font-bold">
                  💡 Tip: Avoid plastic bags for +67 credits each!
                </p>
              </div>
            }
            position="bottom"
          >
            <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-green-300 text-center hover:bg-green-50/50 transition-colors cursor-pointer">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-3xl font-handwritten text-green-600 mb-1">
                {todayCredits}
              </div>
              <div className="text-lg text-green-700 font-sketch flex items-center gap-1 justify-center">
                Today&apos;s Credits
                <HelpTooltip
                  content="Click for detailed breakdown of how credits are calculated"
                  position="top"
                />
              </div>
              <div className="text-sm text-green-600 mt-1">
                {todayWaste.toFixed(1)}kg waste tracked
              </div>
            </div>
          </InteractiveTooltip>

          <InteractiveTooltip
            title="Trees Saved Calculator"
            content={
              <div className="space-y-2">
                <p><strong>Trees Saved:</strong> {treeEquivalent}</p>
                <p><strong>Total Credits:</strong> {totalCredits}</p>
                <hr className="my-2" />
                <p className="text-xs">
                  <strong>Calculation:</strong> 500 credits = 1 tree saved
                </p>
                <p className="text-xs">
                  This is based on average CO₂ absorption of a mature tree (22kg/year) and TGO emission factors.
                </p>
                <p className="text-xs mt-2 font-bold text-green-700">
                  🌳 Next tree at: {500 - (totalCredits % 500)} more credits!
                </p>
              </div>
            }
            position="bottom"
          >
            <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-blue-300 text-center hover:bg-blue-50/50 transition-colors cursor-pointer">
              <div className="text-4xl mb-3">🌳</div>
              <div className="text-3xl font-handwritten text-blue-600 mb-1">
                {treeEquivalent}
              </div>
              <div className="text-lg text-blue-700 font-sketch flex items-center gap-1 justify-center">
                Trees Saved
                <HelpTooltip
                  content="Click to see how tree equivalency is calculated"
                  position="top"
                />
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {totalCredits} total credits earned
              </div>
            </div>
          </InteractiveTooltip>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <FeatureHighlight
            title="AI Scanner Available!"
            content="Try our AI-powered waste scanner to quickly identify and log your waste items. Currently in demo mode with manual fallback."
            isVisible={shouldShowFeatureHighlight('scanner')}
            onClose={() => markFeatureHighlightSeen('scanner')}
            position="bottom"
          >
            <button
              onClick={() => setShowScanner(true)}
              className={`px-8 py-4 bg-green-leaf text-white text-xl font-sketch rounded-lg hover:bg-green-600 ${
                shouldEnableAnimations() ? 'transform hover:scale-105 transition-all duration-200' : 'transition-colors duration-150'
              } sketch-element flex items-center gap-2 relative`}
            >
              📷 AI Scanner (Demo)
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-1 rounded">
                BETA
              </span>
            </button>
          </FeatureHighlight>
          
          <FeatureHighlight
            title="Manual Entry Recommended!"
            content="Start here! Manual entry lets you precisely select waste types and disposal methods for accurate carbon credit calculation."
            isVisible={shouldShowFeatureHighlight('manualEntry')}
            onClose={() => markFeatureHighlightSeen('manualEntry')}
            position="bottom"
          >
            <Link 
              href="/diary/manual"
              className="px-8 py-4 bg-blue-500 text-white text-xl font-sketch rounded-lg hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 sketch-element flex items-center gap-2 text-center relative"
            >
              ✏️ Manual Entry
              <span className="absolute -top-2 -right-2 bg-green-400 text-white text-xs px-1 rounded">
                ✓
              </span>
            </Link>
          </FeatureHighlight>
          
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
          <FeatureHighlight
            title="Level Up & Achievements!"
            content="Track your progress, earn levels, and unlock achievements as you build eco-friendly habits. See how your daily actions contribute to Thailand's environmental goals!"
            isVisible={shouldShowFeatureHighlight('gamification')}
            onClose={() => markFeatureHighlightSeen('gamification')}
            position="top"
          >
            <Suspense fallback={<GameificationSkeleton />}>
              <GameificationPanel 
                totalCredits={totalCredits}
                todayCredits={todayCredits}
                level={currentLevel}
                achievements={[]}
              />
            </Suspense>
          </FeatureHighlight>
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

      {/* Waste Scanner Modal with Mobile Optimization */}
      {showScanner && (
        <Suspense fallback={<ScannerSkeleton />}>
          <WasteScanner 
            onClose={() => setShowScanner(false)}
            onSave={addWasteEntry}
          />
        </Suspense>
      )}

      {/* Quick Actions Widget */}
      <Suspense fallback={null}>
        <QuickActionsWidget 
          onQuickAdd={addWasteEntry}
        />
      </Suspense>

      {/* Floating Help Button */}
      <FloatingHelp />
      
      {/* Mobile optimizations applied via CSS */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-center h-full text-sm text-gray-600">
          📱 Mobile-optimized Thailand Waste Diary
        </div>
      </div>
    </div>
    </ErrorBoundary>
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