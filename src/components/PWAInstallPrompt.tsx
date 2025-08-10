/**
 * PWA Installation Prompt for Thailand Waste Diary
 * Tailored for Thai mobile users with cultural context
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Wifi, Star } from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic-feedback'
import { useTouchFeedback } from '@/lib/touch-feedback'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
}

export default function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  const { touchHandlers: installTouchHandlers, styles: installButtonStyles } = useTouchFeedback({
    scale: 0.96,
    haptic: true,
    hapticType: 'medium'
  })

  const { touchHandlers: dismissTouchHandlers, styles: dismissButtonStyles } = useTouchFeedback({
    scale: 0.95,
    haptic: true,
    hapticType: 'light'
  })

  // Detect platform and standalone mode
  useEffect(() => {
    // Check if already running as PWA
    const checkStandalone = () => {
      if (typeof window !== 'undefined') {
        const isStandalone = 
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://')
        
        setIsStandalone(isStandalone)
      }
    }

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios')
      } else if (/android/.test(userAgent)) {
        setPlatform('android')
      } else if (/windows|mac|linux/.test(userAgent)) {
        setPlatform('desktop')
      } else {
        setPlatform('unknown')
      }
    }

    checkStandalone()
    detectPlatform()

    // Check if user has previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      if (dismissedDate > weekAgo) {
        setHasBeenDismissed(true)
      } else {
        localStorage.removeItem('pwa-install-dismissed')
      }
    }
  }, [])

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay if not dismissed and not standalone
      if (!hasBeenDismissed && !isStandalone) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed')
      setShowPrompt(false)
      setDeferredPrompt(null)
      onInstall?.()
      
      // Track installation
      if ('gtag' in window) {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'thailand_waste_diary'
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [hasBeenDismissed, isStandalone, onInstall])

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      // Show manual installation instructions for iOS or other platforms
      setShowPrompt(false)
      showManualInstallInstructions()
      return
    }

    setIsInstalling(true)
    triggerHaptic('medium')

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      console.log('[PWA] User choice:', choiceResult.outcome)
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt')
        setShowPrompt(false)
        onInstall?.()
      } else {
        console.log('[PWA] User dismissed install prompt')
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt, onInstall])

  const handleDismissClick = useCallback(() => {
    setShowPrompt(false)
    setHasBeenDismissed(true)
    triggerHaptic('light')
    
    // Remember dismissal for a week
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    
    onDismiss?.()
  }, [onDismiss])

  const showManualInstallInstructions = () => {
    const instructions = getInstallInstructions(platform)
    
    // You could show a modal with instructions here
    alert(instructions)
  }

  const getInstallInstructions = (platform: string): string => {
    switch (platform) {
      case 'ios':
        return `เพื่อติดตั้งแอป Thailand Waste Diary:
1. แตะปุ่ม Share (ส่วนใช้ร่วมกัน) ที่ด้านล่างของ Safari
2. เลือก "Add to Home Screen" (เพิ่มในหน้าจอหลัก)
3. แตะ "Add" (เพิ่ม) เพื่อติดตั้ง

To install Thailand Waste Diary:
1. Tap the Share button at the bottom of Safari
2. Select "Add to Home Screen"
3. Tap "Add" to install`

      case 'android':
        return `เพื่อติดตั้งแอป Thailand Waste Diary:
1. แตะปุ่ม Menu (สามจุด) ที่มุมบนขวาของ Chrome
2. เลือก "Add to Home screen" (เพิ่มในหน้าจอหลัก)
3. แตะ "Add" (เพิ่ม) เพื่อติดตั้ง

To install Thailand Waste Diary:
1. Tap the Menu button (three dots) at the top right of Chrome
2. Select "Add to Home screen"
3. Tap "Add" to install`

      default:
        return `เพื่อติดตั้งแอป Thailand Waste Diary:
กรุณาใช้ Chrome หรือ Safari บนอุปกรณ์มือถือ

To install Thailand Waste Diary:
Please use Chrome or Safari on your mobile device`
    }
  }

  // Don't show if already installed or dismissed recently
  if (isStandalone || hasBeenDismissed || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe-bottom"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with close button */}
          <div className="flex justify-between items-start p-4 pb-2">
            <div className="flex-1">
              <h3 className="text-white font-handwritten text-xl mb-1">
                📱 ติดตั้งแอปฟรี!
              </h3>
              <p className="text-green-100 text-sm">
                Install Thailand Waste Diary
              </p>
            </div>
            <button
              onClick={handleDismissClick}
              className="text-green-100 hover:text-white p-2 -mt-2 -mr-2 rounded-lg transition-colors"
              aria-label="Close installation prompt"
              {...dismissTouchHandlers}
              style={dismissButtonStyles}
            >
              <X size={20} />
            </button>
          </div>

          {/* Benefits */}
          <div className="px-4 pb-2">
            <div className="grid grid-cols-3 gap-3 text-center text-green-50">
              <div className="flex flex-col items-center">
                <Wifi className="w-5 h-5 mb-1" />
                <span className="text-xs">Offline</span>
                <span className="text-xs text-green-200">ใช้ได้ออฟไลน์</span>
              </div>
              <div className="flex flex-col items-center">
                <Smartphone className="w-5 h-5 mb-1" />
                <span className="text-xs">Fast</span>
                <span className="text-xs text-green-200">เร็วกว่า</span>
              </div>
              <div className="flex flex-col items-center">
                <Star className="w-5 h-5 mb-1" />
                <span className="text-xs">Better</span>
                <span className="text-xs text-green-200">ดีกว่า</span>
              </div>
            </div>
          </div>

          {/* Install button */}
          <div className="p-4 pt-2">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full bg-white hover:bg-green-50 text-green-600 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              {...installTouchHandlers}
              style={installButtonStyles}
            >
              {isInstalling ? (
                <>
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังติดตั้ง...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span className="text-lg">ติดตั้งเลย / Install Now</span>
                </>
              )}
            </button>
            
            <p className="text-green-100 text-xs text-center mt-2">
              🌱 ช่วยไทยบรรลุเป้าหมายคาร์บอนนิวทรัลใน 2050<br/>
              Help Thailand achieve carbon neutrality by 2050
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for managing PWA installation
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      
      setIsInstalled(isStandalone)
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setCanInstall(false)
      setIsInstalled(true)
    }

    checkInstalled()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return {
    canInstall,
    isInstalled,
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator
  }
}