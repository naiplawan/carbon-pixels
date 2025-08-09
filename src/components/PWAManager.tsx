'use client';

import { useEffect, useState } from 'react';
import { Download, X, RefreshCw, Wifi, Battery } from 'lucide-react';
import { useNetworkConnection, useBatteryAwareOptimizations } from '@/hooks/useNetworkConnection';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [swStatus, setSwStatus] = useState<'idle' | 'updating' | 'updated'>('idle');
  
  const { isOnline, connectionSpeed, isSlowConnection, networkStrength } = useNetworkConnection();
  const { isLowBattery, getBatteryOptimizations } = useBatteryAwareOptimizations();

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      setShowInstallPrompt(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setSWRegistration(registration);

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Initialize notification manager after service worker is ready
      if (typeof window !== 'undefined' && window.location.pathname.includes('/diary')) {
        const { notificationManager } = await import('@/lib/notifications');
        notificationManager.init();
      }

      console.log('[PWA] Service Worker registered successfully');
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  };

  const handleUpdate = () => {
    if (swRegistration?.waiting) {
      // Send message to service worker to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for controlling change and reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  // Install prompt banner
  if (showInstallPrompt && !isInstalled) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Download className="w-5 h-5 mr-3" />
            <div>
              <div className="font-handwritten text-lg">Install Waste Diary App</div>
              <div className="text-sm text-green-100">
                Get offline access and quick waste tracking!
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg font-handwritten text-sm transition-colors"
            >
              Install Now
            </button>
            <button
              onClick={dismissInstallPrompt}
              className="text-white hover:text-green-100 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Update available banner
  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-600 text-white rounded-lg shadow-lg max-w-sm mx-auto">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-3" />
            <div>
              <div className="font-handwritten text-lg">Update Available</div>
              <div className="text-sm text-blue-100">
                New features and improvements ready!
              </div>
            </div>
          </div>
          
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-1 rounded font-handwritten text-sm transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Hook for PWA utilities
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install availability
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const syncData = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('waste-entry-sync');
        return true;
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  };

  const cacheWasteEntry = async (entry: any) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'CACHE_WASTE_ENTRY',
            data: entry
          });
        }
      } catch (error) {
        console.error('[PWA] Failed to cache waste entry:', error);
      }
    }
  };

  const scheduleNotification = async (notification: any) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            data: notification
          });
        }
      } catch (error) {
        console.error('[PWA] Failed to schedule notification:', error);
      }
    }
  };

  const showAchievement = async (achievement: any) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_ACHIEVEMENT',
            data: achievement
          });
        }
      } catch (error) {
        console.error('[PWA] Failed to show achievement:', error);
      }
    }
  };

  const cancelNotification = async (tag: string) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'CANCEL_NOTIFICATION',
            data: { tag }
          });
        }
      } catch (error) {
        console.error('[PWA] Failed to cancel notification:', error);
      }
    }
  };

  return {
    isOnline,
    isInstalled,
    canInstall,
    syncData,
    cacheWasteEntry,
    scheduleNotification,
    showAchievement,
    cancelNotification
  };
}

// Offline status indicator component
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40 bg-amber-500 text-white rounded-lg shadow-lg max-w-sm mx-auto">
      <div className="p-3 flex items-center">
        <Wifi className="w-5 h-5 mr-3" />
        <div>
          <div className="font-handwritten text-sm">You&apos;re Offline</div>
          <div className="text-xs text-amber-100">
            Your entries will sync when you&apos;re back online
          </div>
        </div>
      </div>
    </div>
  );
}