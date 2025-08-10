/**
 * App Update Prompt for Thailand Waste Diary PWA
 * Handles service worker updates with Thai localization
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download, X, Zap } from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic-feedback'
import { useTouchFeedback } from '@/lib/touch-feedback'

interface AppUpdatePromptProps {
  isOpen?: boolean
  onClose?: () => void
  onUpdate?: () => void
  onDismiss?: () => void
}

interface UpdateInfo {
  version: string
  features: string[]
  isRequired: boolean
  size?: string
}

export default function AppUpdatePrompt({ isOpen, onClose, onUpdate, onDismiss }: AppUpdatePromptProps) {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateProgress, setUpdateProgress] = useState(0)

  const { touchHandlers: updateTouchHandlers, styles: updateButtonStyles } = useTouchFeedback({
    scale: 0.96,
    haptic: true,
    hapticType: 'medium'
  })

  const { touchHandlers: dismissTouchHandlers, styles: dismissButtonStyles } = useTouchFeedback({
    scale: 0.95,
    haptic: true,
    hapticType: 'light'
  })

  // Listen for service worker updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handleServiceWorkerUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              setWaitingWorker(newWorker)
              fetchUpdateInfo()
              setShowUpdatePrompt(true)
              
              console.log('[Update] New service worker available')
              triggerHaptic('light')
            }
          })
        })

        // Check for waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          fetchUpdateInfo()
          setShowUpdatePrompt(true)
        }
      } catch (error) {
        console.error('[Update] Failed to check for updates:', error)
      }
    }

    handleServiceWorkerUpdate()

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateInfo(event.data.updateInfo)
        setShowUpdatePrompt(true)
      } else if (event.data.type === 'UPDATE_PROGRESS') {
        setUpdateProgress(event.data.progress)
      }
    })

    // Check for updates periodically (every 30 minutes)
    const checkForUpdates = setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATE' })
      }
    }, 30 * 60 * 1000)

    return () => {
      clearInterval(checkForUpdates)
    }
  }, [])

  const fetchUpdateInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/app-info')
      if (response.ok) {
        const info = await response.json()
        setUpdateInfo(info)
      } else {
        // Fallback update info
        setUpdateInfo({
          version: '1.3.0',
          features: [
            'ปรับปรุงประสิทธิภาพการทำงาน - Improved performance',
            'แก้ไขข้อบกพร่อง - Bug fixes',
            'เพิ่มฟีเจอร์ใหม่ - New features'
          ],
          isRequired: false,
          size: '< 1MB'
        })
      }
    } catch (error) {
      console.error('[Update] Failed to fetch update info:', error)
    }
  }, [])

  const handleUpdateClick = useCallback(async () => {
    if (!waitingWorker) return

    setIsUpdating(true)
    triggerHaptic('medium')

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })

      // Wait for the new service worker to take control
      await new Promise<void>((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
          resolve()
        }
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      })

      clearInterval(progressInterval)
      setUpdateProgress(100)

      // Small delay to show completion
      setTimeout(() => {
        setShowUpdatePrompt(false)
        setIsUpdating(false)
        setUpdateProgress(0)
        onUpdate?.()
        
        // Reload to apply updates
        window.location.reload()
      }, 500)

    } catch (error) {
      console.error('[Update] Failed to update app:', error)
      setIsUpdating(false)
      setUpdateProgress(0)
      
      // Show error feedback
      triggerHaptic('error')
    }
  }, [waitingWorker, onUpdate])

  const handleDismissClick = useCallback(() => {
    setShowUpdatePrompt(false)
    triggerHaptic('light')
    onDismiss?.()

    // Don't show again for this session
    sessionStorage.setItem('update-dismissed', 'true')
  }, [onDismiss])

  const handleLaterClick = useCallback(() => {
    setShowUpdatePrompt(false)
    triggerHaptic('light')
    
    // Remind in 1 hour
    setTimeout(() => {
      if (waitingWorker && !sessionStorage.getItem('update-dismissed')) {
        setShowUpdatePrompt(true)
      }
    }, 60 * 60 * 1000)
  }, [waitingWorker])

  // Don't show if no update available or if dismissed
  if (!showUpdatePrompt || !updateInfo) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-6 h-6" />
                <div>
                  <h3 className="font-handwritten text-xl">
                    🆕 อัปเดตใหม่!
                  </h3>
                  <p className="text-blue-100 text-sm">
                    New Update Available
                  </p>
                </div>
              </div>
              
              {!updateInfo.isRequired && (
                <button
                  onClick={handleDismissClick}
                  className="text-blue-100 hover:text-white p-1 rounded-lg transition-colors"
                  aria-label="Close update prompt"
                  {...dismissTouchHandlers}
                  style={dismissButtonStyles}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Version info */}
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Version {updateInfo.version}</span>
              {updateInfo.size && (
                <span className="text-blue-200">{updateInfo.size}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Update progress */}
            {isUpdating && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>กำลังอัปเดต... / Updating...</span>
                  <span>{updateProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${updateProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Features */}
            {!isUpdating && updateInfo.features.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  มีอะไรใหม่ - What&apos;s New:
                </h4>
                <ul className="space-y-1">
                  {updateInfo.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Update type indicator */}
            {updateInfo.isRequired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm font-medium">
                  🚨 การอัปเดตที่จำเป็น - Required Update
                </p>
                <p className="text-red-600 text-xs mt-1">
                  แอปต้องการอัปเดตเพื่อใช้งานต่อ
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleUpdateClick}
                disabled={isUpdating}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                {...updateTouchHandlers}
                style={updateButtonStyles}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>กำลังอัปเดต...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span className="text-lg">
                      อัปเดตเลย / Update Now
                    </span>
                  </>
                )}
              </button>

              {!updateInfo.isRequired && !isUpdating && (
                <button
                  onClick={handleLaterClick}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors"
                >
                  ทีหลัง / Later
                </button>
              )}
            </div>

            {/* Benefits */}
            {!isUpdating && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 text-xs text-center">
                  💡 การอัปเดตจะช่วยให้แอปทำงานเร็วขึ้นและประหยัดแบตเตอรี่<br/>
                  <span className="text-green-600">
                    Updates improve performance and save battery
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for managing app updates
export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const checkForUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        
        // Check if there's a waiting service worker
        if (registration.waiting) {
          setUpdateAvailable(true)
        }
        
        // Manual update check
        await registration.update()
        setLastChecked(new Date())
        
      } catch (error) {
        console.error('[Update] Manual update check failed:', error)
      }
    }

    // Initial check
    checkForUpdate()

    // Listen for update events
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateAvailable(true)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const forceUpdate = useCallback(async () => {
    setIsUpdating(true)
    
    try {
      const registration = await navigator.serviceWorker.ready
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        // Wait for controller change
        await new Promise<void>((resolve) => {
          const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
            resolve()
          }
          navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
        })
        
        window.location.reload()
      }
    } catch (error) {
      console.error('[Update] Force update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
      setLastChecked(new Date())
      
      return registration.waiting !== null
    } catch (error) {
      console.error('[Update] Update check failed:', error)
      return false
    }
  }, [])

  return {
    updateAvailable,
    isUpdating,
    lastChecked,
    forceUpdate,
    checkForUpdate,
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator
  }
}