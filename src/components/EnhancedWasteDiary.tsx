'use client';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { WasteEntry } from '@/types/waste';
import Link from 'next/link';
import { storage, preloadStorageData } from '@/lib/storage-performance';
import { PWAManager, OfflineIndicator, usePWA } from '@/components/PWAManager';
import { notificationManager } from '@/lib/notifications';
import { performanceMonitor, usePerformanceTracking } from '@/lib/performance-monitor';
import NotificationSystem, { NotificationPreferences } from '@/components/NotificationSystem';
import NotificationSettings from '@/components/NotificationSettings';
import { ToastContainer, useToast } from '@/components/ToastNotification';

// Lazy load heavy components
const WasteScanner = lazy(() => import('@/components/WasteScanner'));
const GameificationPanel = lazy(() => import('@/components/GameificationPanel'));
const SocialShareManager = lazy(() => import('@/components/SocialShareManager'));
const CommunityPanel = lazy(() => import('@/components/CommunityPanelEnhanced'));

// WasteEntry interface imported from @/types/waste

export default function EnhancedWasteDiary() {
  const [todayEntries, setTodayEntries] = useState<WasteEntry[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [allWasteEntries, setAllWasteEntries] = useState<WasteEntry[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [previousLevelCredits, setPreviousLevelCredits] = useState(0);

  const { showAchievement } = usePWA();
  const { trackWasteAction, getComponentMetrics } = usePerformanceTracking('WasteDiary');
  const { 
    notifications: toastNotifications,
    removeToast,
    showSuccess,
    showAchievement: showAchievementToast,
    showStreak,
    showInfo 
  } = useToast();

  // Preload data on component mount
  useEffect(() => {
    preloadStorageData();
  }, []);

  // Initialize notification system
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationManager.init();
        
        // Check permission status
        if ('Notification' in window) {
          setPermissionStatus(Notification.permission as 'default' | 'granted' | 'denied');
        }

        // Load preferences
        const savedPrefs = localStorage.getItem('notificationPreferences');
        if (savedPrefs) {
          setNotificationPreferences(JSON.parse(savedPrefs));
        }
      } catch (error) {
        console.error('Failed to initialize notification system:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Load data asynchronously without blocking render
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      const endTiming = trackWasteAction('data_load');
      
      try {
        const [todayEntries, totalCredits, allEntries] = await Promise.all([
          storage.getTodayEntries(),
          storage.getItem('carbonCredits', 0),
          storage.getItem('wasteEntries', [])
        ]);
        
        if (isMounted) {
          setTodayEntries(todayEntries);
          setPreviousLevelCredits(totalCredits); // Store for level-up detection
          setTotalCredits(totalCredits);
          setAllWasteEntries(allEntries);
        }
        
        endTiming();
      } catch (error) {
        console.error('Failed to load diary data:', error);
        endTiming();
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [trackWasteAction]);

  // Listen for notification events from service worker
  useEffect(() => {
    const handleNotificationClick = (event: CustomEvent) => {
      const { action, type, url } = event.detail;
      console.log('Notification clicked:', { action, type, url });
      
      // Handle specific notification click actions
      if (action === 'celebrate') {
        showSuccess('Celebration!', 'Thanks for staying motivated! 🎉');
      }
    };

    const handleCelebrationTrigger = (event: CustomEvent) => {
      const { soundEffect } = event.detail;
      showSuccess('Achievement Unlocked!', 'Keep up the great work! 🏆');
    };

    window.addEventListener('notificationClick', handleNotificationClick as EventListener);
    window.addEventListener('celebrationTrigger', handleCelebrationTrigger as EventListener);

    return () => {
      window.removeEventListener('notificationClick', handleNotificationClick as EventListener);
      window.removeEventListener('celebrationTrigger', handleCelebrationTrigger as EventListener);
    };
  }, [showSuccess]);

  // Memoized calculations
  const todayCredits = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.carbonCredits, 0);
  }, [todayEntries]);

  const todayWaste = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.weight, 0);
  }, [todayEntries]);

  const treeEquivalent = useMemo(() => {
    return Math.floor(totalCredits / 500);
  }, [totalCredits]);

  const progressToGoal = useMemo(() => {
    return Math.min((todayCredits / dailyGoal) * 100, 100);
  }, [todayCredits, dailyGoal]);

  // Calculate current level
  const currentLevelInfo = useMemo(() => {
    const levels = [
      { level: 1, name: 'Eco Beginner', minCredits: 0, maxCredits: 99, icon: '🌱' },
      { level: 2, name: 'Green Warrior', minCredits: 100, maxCredits: 499, icon: '💚' },
      { level: 3, name: 'Eco Champion', minCredits: 500, maxCredits: 1499, icon: '🌍' },
      { level: 4, name: 'Climate Hero', minCredits: 1500, maxCredits: 4999, icon: '🦸' },
      { level: 5, name: 'Planet Protector', minCredits: 5000, maxCredits: Infinity, icon: '🛡️' }
    ];

    return levels.find(level => totalCredits >= level.minCredits && totalCredits <= level.maxCredits) || levels[0];
  }, [totalCredits]);

  // Calculate daily streak
  const dailyStreak = useMemo(() => {
    if (allWasteEntries.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasEntry = allWasteEntries.some(entry => 
        new Date(entry.timestamp).toDateString() === dateString
      );
      
      if (hasEntry) {
        streak++;
      } else if (i === 0) {
        continue; // Allow for no entry today
      } else {
        break;
      }
    }
    
    return streak;
  }, [allWasteEntries]);

  // Enhanced achievement checking
  const checkForAchievements = useCallback(async (prevCredits: number, newCredits: number, entry: WasteEntry) => {
    const achievements = [];

    // First entry achievement
    if (todayEntries.length === 0) {
      achievements.push({
        id: 'first-entry',
        title: 'First Entry Today! 🌱',
        description: 'Great start! You\'ve logged your first waste item today.',
        credits: entry.carbonCredits,
        type: 'general' as const
      });
    }

    // Tree milestone achievements
    const prevTrees = Math.floor(prevCredits / 500);
    const newTrees = Math.floor(newCredits / 500);
    
    if (newTrees > prevTrees) {
      achievements.push({
        id: `tree-${newTrees}`,
        title: `${newTrees} Tree${newTrees > 1 ? 's' : ''} Saved! 🌳`,
        description: `Amazing! You&apos;ve saved ${newTrees} tree equivalent${newTrees > 1 ? 's' : ''} through your waste tracking!`,
        credits: newCredits,
        type: 'tree' as const
      });
    }

    // Level up detection
    const prevLevelInfo = [
      { level: 1, name: 'Eco Beginner', minCredits: 0, maxCredits: 99 },
      { level: 2, name: 'Green Warrior', minCredits: 100, maxCredits: 499 },
      { level: 3, name: 'Eco Champion', minCredits: 500, maxCredits: 1499 },
      { level: 4, name: 'Climate Hero', minCredits: 1500, maxCredits: 4999 },
      { level: 5, name: 'Planet Protector', minCredits: 5000, maxCredits: Infinity }
    ].find(level => prevCredits >= level.minCredits && prevCredits <= level.maxCredits);

    const newLevelInfo = currentLevelInfo;

    if (newLevelInfo && prevLevelInfo && newLevelInfo.level > prevLevelInfo.level) {
      achievements.push({
        id: `level-${newLevelInfo.level}`,
        title: `Level Up! ${newLevelInfo.icon}`,
        description: `Congratulations! You&apos;ve reached ${newLevelInfo.name} (Level ${newLevelInfo.level})!`,
        credits: newCredits,
        level: newLevelInfo.level,
        type: 'level' as const
      });
      
      // Trigger level up notification
      await notificationManager.showLevelUpNotification(newLevelInfo.level, newLevelInfo.name);
    }

    // Credit milestones
    const milestones = [100, 500, 1000, 2500, 5000, 10000];
    for (const milestone of milestones) {
      if (prevCredits < milestone && newCredits >= milestone) {
        achievements.push({
          id: `credits-${milestone}`,
          title: `${milestone} Credits Earned! 🎉`,
          description: `You&apos;ve reached ${milestone} carbon credits! Keep up the great work!`,
          credits: newCredits,
          type: 'milestone' as const
        });
      }
    }

    // Positive impact achievement
    if (entry.carbonCredits > 0) {
      showSuccess(
        'Positive Impact! 💚',
        `Great choice! You earned ${entry.carbonCredits} credits for sustainable disposal.`
      );
    }

    // Show all achievements
    for (const achievement of achievements) {
      // Show in-app toast
      showAchievementToast(
        achievement.title,
        achievement.description,
        {
          duration: 8000,
          actions: [
            {
              label: 'Celebrate! 🎉',
              action: () => showSuccess('Celebration!', 'You\'re making a difference! 🌟'),
              style: 'primary'
            }
          ]
        }
      );
      
      // Show browser notification
      await notificationManager.showAchievementNotification(achievement);
    }

    // Check for streak achievements
    const currentStreak = dailyStreak;
    const streakMilestones = [3, 7, 14, 30, 100];
    
    for (const milestone of streakMilestones) {
      if (currentStreak === milestone) {
        await notificationManager.showStreakNotification(milestone);
        showStreak(
          `${milestone}-Day Streak! 🔥`,
          `Amazing! You&apos;ve tracked waste for ${milestone} days in a row!`
        );
        break;
      }
    }

  }, [todayEntries.length, showAchievementToast, showSuccess, showStreak, currentLevelInfo, dailyStreak]);

  // Enhanced waste entry addition
  const addWasteEntry = useCallback(async (entry: WasteEntry) => {
    const endTiming = trackWasteAction('add_entry');
    const previousCredits = totalCredits;

    // Optimistic UI update
    setTodayEntries(prev => [...prev, entry]);
    setTotalCredits(prev => prev + entry.carbonCredits);

    try {
      await storage.addWasteEntry(entry);
      await checkForAchievements(previousCredits, totalCredits + entry.carbonCredits, entry);
      
      // Show success toast
      showSuccess(
        'Waste Entry Added! 📝',
        `${entry.categoryName} logged successfully. ${entry.carbonCredits > 0 ? '+' : ''}${entry.carbonCredits} CC earned.`
      );

      endTiming();
    } catch (error) {
      console.error('Failed to save waste entry:', error);
      // Rollback on error
      setTodayEntries(prev => prev.filter(e => e.id !== entry.id));
      setTotalCredits(prev => prev - entry.carbonCredits);
      endTiming();
    }
  }, [totalCredits, checkForAchievements, trackWasteAction, showSuccess]);

  // Notification preferences handlers
  const handlePreferencesChange = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!notificationPreferences) return;
    const updated = { ...notificationPreferences, ...newPrefs } as NotificationPreferences;
    setNotificationPreferences(updated);
    notificationManager.updatePreferences(updated);
  }, [notificationPreferences]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await notificationManager.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const handleTestNotification = useCallback(async () => {
    await notificationManager.showNotification({
      id: 'test',
      title: 'Test Notification 🧪',
      body: 'This is how your notifications will look and sound!',
      requiresPermission: true,
      data: {
        soundEffect: 'gentle-chime'
      }
    });
    
    showInfo('Test Notification Sent!', 'Check your notification area to see how it looks.');
  }, [showInfo]);

  return (
    <>
      {/* Toast Container */}
      <ToastContainer
        notifications={toastNotifications}
        onClose={removeToast}
        position="top-right"
        maxVisible={3}
        enableSounds={notificationPreferences?.soundEnabled ?? true}
      />

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
                🔔 Smart Notifications
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

          {/* Enhanced Notification Settings */}
          {showNotificationSettings && notificationPreferences && (
            <NotificationSettings
              preferences={notificationPreferences}
              onPreferencesChange={handlePreferencesChange}
              onRequestPermission={handleRequestPermission}
              onTestNotification={handleTestNotification}
              permissionStatus={permissionStatus}
              className="mb-6"
            />
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

          {/* Enhanced Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            <div className="bg-white/90 p-6 rounded-lg border-2 border-dashed border-orange-300 text-center">
              <div className="text-4xl mb-3">🔥</div>
              <div className="text-3xl font-handwritten text-orange-600 mb-1">
                {dailyStreak}
              </div>
              <div className="text-lg text-orange-700 font-sketch">Day Streak</div>
              <div className="text-sm text-orange-600 mt-1">
                {currentLevelInfo.name} ({currentLevelInfo.icon})
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

            {/* Enhanced Gamification Panel */}
            <Suspense fallback={<GameificationSkeleton />}>
              <GameificationPanel 
                totalCredits={totalCredits}
                todayCredits={todayCredits}
                level={currentLevelInfo.level}
                achievements={[]}
              />
            </Suspense>
          </div>

          {/* Daily Progress */}
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

          {/* Enhanced Insights Section */}
          <details className="mt-8">
            <summary className="bg-white/70 p-4 rounded-lg border-2 border-dashed border-pencil cursor-pointer hover:bg-white/80 transition-colors">
              <span className="text-lg font-handwritten text-ink">📊 Smart Environmental Insights</span>
              <span className="text-sm text-pencil ml-2">(Click to expand)</span>
            </summary>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border-2 border-orange-200 text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm font-handwritten text-orange-800 mb-1">
                  Weekly Growth
                </div>
                <div className="text-lg font-semibold text-orange-600">
                  +{Math.floor(todayCredits * 7)} projected
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Waste Scanner Modal */}
        {showScanner && (
          <Suspense fallback={<ScannerSkeleton />}>
            <WasteScanner 
              onClose={() => setShowScanner(false)}
              onSave={addWasteEntry}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}

// Category icon mapping
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
  };
  return (categoryId: string): string => iconMap[categoryId] || '🗑️';
})();

// Loading skeleton components
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
  );
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
  );
}