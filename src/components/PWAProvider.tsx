/**
 * PWA Provider - Comprehensive PWA integration for Thailand Waste Diary
 * Manages all PWA features: installation, updates, offline, notifications
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useOfflineStorage } from '@/lib/offline-storage'
import { useBackgroundSync } from '@/lib/background-sync'
import { usePushNotifications } from '@/lib/push-notifications'
import { usePWAInstall } from '@/components/PWAInstallPrompt'
import { useAppUpdate } from '@/components/AppUpdatePrompt'
import { usePerformanceOptimization } from '@/lib/performance-optimizer'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import AppUpdatePrompt from '@/components/AppUpdatePrompt'

interface PWAContextType {
  // Installation
  canInstall: boolean
  isInstalled: boolean
  showInstallPrompt: () => void
  
  // Updates
  updateAvailable: boolean
  isUpdating: boolean
  checkForUpdate: () => Promise<boolean>
  forceUpdate: () => Promise<void>
  
  // Offline
  isOnline: boolean
  isOfflineReady: boolean
  offlineStorage: any
  
  // Sync
  syncStatus: {
    isOnline: boolean
    pendingCount: number
    lastSyncTime: number
    isSyncing: boolean
  }
  forceSyncNow: () => Promise<any>
  
  // Notifications
  notificationsEnabled: boolean
  enableNotifications: () => Promise<void>
  disableNotifications: () => Promise<void>
  
  // Performance
  performanceSettings: any
  deviceCapabilities: any
  
  // Overall PWA status
  pwaStatus: 'unsupported' | 'installing' | 'ready' | 'updating' | 'offline'
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

interface PWAProviderProps {
  children: ReactNode
  enableInstallPrompt?: boolean
  enableUpdatePrompt?: boolean
  enablePerformanceOptimization?: boolean
}

export function PWAProvider({ 
  children, 
  enableInstallPrompt = true,
  enableUpdatePrompt = true,
  enablePerformanceOptimization = true
}: PWAProviderProps) {
  // PWA feature hooks
  const { storage: offlineStorage, isReady: isOfflineReady } = useOfflineStorage()
  const { syncStatus, forceSyncNow, queueForSync } = useBackgroundSync()
  const { 
    notificationsEnabled, 
    enableNotifications, 
    disableNotifications,
    isSupported: notificationsSupported 
  } = usePushNotifications()
  const { canInstall, isInstalled } = usePWAInstall()
  const { updateAvailable, isUpdating, checkForUpdate, forceUpdate } = useAppUpdate()
  const { settings: performanceSettings, capabilities: deviceCapabilities } = usePerformanceOptimization()

  // State management
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [pwaStatus, setPwaStatus] = useState<PWAContextType['pwaStatus']>('unsupported')

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Determine PWA status
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setPwaStatus('unsupported')
      return
    }

    if (isUpdating) {
      setPwaStatus('updating')
    } else if (!isOnline) {
      setPwaStatus('offline')
    } else if (isInstalled && isOfflineReady) {
      setPwaStatus('ready')
    } else {
      setPwaStatus('installing')
    }
  }, [isInstalled, isOfflineReady, isUpdating, isOnline])

  // Auto-show install prompt
  useEffect(() => {
    if (enableInstallPrompt && canInstall && !isInstalled) {
      // Show install prompt after user has used app for a bit
      const timer = setTimeout(() => {
        setShowInstallDialog(true)
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }
  }, [enableInstallPrompt, canInstall, isInstalled])

  // Auto-show update prompt
  useEffect(() => {
    if (enableUpdatePrompt && updateAvailable) {
      setShowUpdateDialog(true)
    }
  }, [enableUpdatePrompt, updateAvailable])

  // Initialize PWA features
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Register service worker if not already registered
        if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('[PWA] Service Worker registered:', registration.scope)
        }

        // Preload critical resources for performance
        if (enablePerformanceOptimization && performanceSettings) {
          // This would be handled by the performance optimizer
        }

        // Setup periodic sync check
        setInterval(async () => {
          if (isOnline && !syncStatus.isSyncing && syncStatus.pendingCount > 0) {
            await forceSyncNow()
          }
        }, 60000) // Check every minute

        // Setup periodic update check
        setInterval(async () => {
          if (isOnline && !isUpdating) {
            await checkForUpdate()
          }
        }, 30 * 60 * 1000) // Check every 30 minutes

      } catch (error) {
        console.error('[PWA] Failed to initialize:', error)
      }
    }

    initializePWA()
  }, [])

  // Handle critical app events
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save any pending data before app closes
      if (syncStatus.pendingCount > 0) {
        // Queue immediate sync attempt
        navigator.serviceWorker?.controller?.postMessage({
          type: 'SYNC_NOW'
        })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App came to foreground
        if (isOnline && syncStatus.pendingCount > 0) {
          forceSyncNow()
        }
        checkForUpdate()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncStatus.pendingCount, isOnline, forceSyncNow, checkForUpdate])

  // Context value
  const contextValue: PWAContextType = {
    // Installation
    canInstall,
    isInstalled,
    showInstallPrompt: () => setShowInstallDialog(true),
    
    // Updates
    updateAvailable,
    isUpdating,
    checkForUpdate,
    forceUpdate,
    
    // Offline
    isOnline,
    isOfflineReady,
    offlineStorage,
    
    // Sync
    syncStatus,
    forceSyncNow,
    
    // Notifications
    notificationsEnabled: notificationsEnabled && notificationsSupported,
    enableNotifications,
    disableNotifications,
    
    // Performance
    performanceSettings,
    deviceCapabilities,
    
    // Overall status
    pwaStatus
  }

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* PWA UI Components */}
      {enableInstallPrompt && (
        <PWAInstallPrompt
          isOpen={showInstallDialog}
          onClose={() => setShowInstallDialog(false)}
          onInstall={() => {
            setShowInstallDialog(false)
            // Track installation
            if ('gtag' in window) {
              (window as any).gtag('event', 'pwa_install_success', {
                event_category: 'engagement'
              })
            }
          }}
        />
      )}
      
      {enableUpdatePrompt && (
        <AppUpdatePrompt
          isOpen={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
          onUpdate={() => {
            setShowUpdateDialog(false)
            // Track update
            if ('gtag' in window) {
              (window as any).gtag('event', 'pwa_update_success', {
                event_category: 'engagement'
              })
            }
          }}
        />
      )}
      
      {/* PWA Status Indicator */}
      <PWAStatusIndicator status={pwaStatus} />
    </PWAContext.Provider>
  )
}

// PWA Status Indicator Component
function PWAStatusIndicator({ status }: { status: PWAContextType['pwaStatus'] }) {
  if (status === 'ready' || status === 'unsupported') {
    return null // No indicator needed
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'installing':
        return {
          icon: '⚡',
          text: 'กำลังเตรียมใช้งานออฟไลน์... / Preparing offline features...',
          color: 'bg-blue-500'
        }
      case 'updating':
        return {
          icon: '🔄',
          text: 'กำลังอัปเดต... / Updating...',
          color: 'bg-green-500'
        }
      case 'offline':
        return {
          icon: '📱',
          text: 'ใช้งานออฟไลน์ / Offline mode',
          color: 'bg-orange-500'
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <div className={`fixed top-0 left-0 right-0 ${config.color} text-white text-center py-1 text-xs z-40`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </div>
  )
}

// Hook to use PWA context
export const usePWA = () => {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

// Utility hook for offline-first data operations
export const useOfflineFirst = () => {
  const { offlineStorage, isOnline, forceSyncNow } = usePWA()

  const saveWasteEntry = async (entry: any) => {
    try {
      // Always save locally first
      await offlineStorage.saveWasteEntry(entry, false)
      
      // Queue for sync if online
      if (isOnline) {
        // Try immediate sync
        try {
          const response = await fetch('/api/waste-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          })
          
          if (!response.ok) {
            throw new Error('Server error')
          }
        } catch (error) {
          // Queue for background sync
          await offlineStorage.addToSyncQueue('CREATE', 'wasteEntries', entry)
        }
      } else {
        // Queue for background sync when online
        await offlineStorage.addToSyncQueue('CREATE', 'wasteEntries', entry)
      }
      
      return true
    } catch (error) {
      console.error('Failed to save waste entry:', error)
      return false
    }
  }

  const getWasteEntries = async (limit?: number, offset?: number) => {
    try {
      // Always get from local storage first
      const localEntries = await offlineStorage.getWasteEntries(limit, offset)
      
      // If online, try to sync and get fresh data
      if (isOnline) {
        try {
          await forceSyncNow()
        } catch (error) {
          console.warn('Sync failed, using local data:', error)
        }
      }
      
      return localEntries
    } catch (error) {
      console.error('Failed to get waste entries:', error)
      return []
    }
  }

  return {
    saveWasteEntry,
    getWasteEntries,
    isOnline,
    forceSyncNow
  }
}

export default PWAProvider