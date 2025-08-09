'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiOff, 
  Wifi, 
  Cloud, 
  CloudOff, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface OfflineState {
  isOnline: boolean;
  lastOnline: Date | null;
  pendingActions: number;
  dataSync: 'synced' | 'pending' | 'failed';
  storageUsage: number;
}

export function OfflineIndicator() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: true,
    lastOnline: null,
    pendingActions: 0,
    dataSync: 'synced',
    storageUsage: 0
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize online state
    setOfflineState(prev => ({
      ...prev,
      isOnline: navigator.onLine
    }));

    // Listen for online/offline events
    const handleOnline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: true,
        dataSync: 'pending' // Start sync when back online
      }));
      
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 3000); // Hide success message after 3s
      
      // Trigger data sync
      syncOfflineData();
    };

    const handleOffline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: false,
        lastOnline: new Date()
      }));
      
      setIsVisible(true); // Show offline indicator
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check storage usage
    calculateStorageUsage();

    // Check for pending actions
    checkPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateStorageUsage = () => {
    try {
      const wasteEntries = JSON.parse(localStorage.getItem('wasteEntries') || '[]');
      const otherData = Object.keys(localStorage)
        .filter(key => key.startsWith('carbon-'))
        .reduce((size, key) => size + (localStorage.getItem(key)?.length || 0), 0);
      
      const totalSize = JSON.stringify(wasteEntries).length + otherData;
      const usagePercentage = (totalSize / (5 * 1024 * 1024)) * 100; // 5MB limit estimate
      
      setOfflineState(prev => ({
        ...prev,
        storageUsage: Math.min(usagePercentage, 100)
      }));
    } catch (error) {
      console.warn('Could not calculate storage usage:', error);
    }
  };

  const checkPendingActions = () => {
    const pendingSync = JSON.parse(localStorage.getItem('pending-sync') || '[]');
    setOfflineState(prev => ({
      ...prev,
      pendingActions: pendingSync.length
    }));
  };

  const syncOfflineData = async () => {
    try {
      setOfflineState(prev => ({ ...prev, dataSync: 'pending' }));
      
      // Simulate sync process (in real app, sync with backend)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear pending actions
      localStorage.removeItem('pending-sync');
      
      setOfflineState(prev => ({
        ...prev,
        dataSync: 'synced',
        pendingActions: 0
      }));
    } catch (error) {
      setOfflineState(prev => ({ ...prev, dataSync: 'failed' }));
    }
  };

  const getTimeSinceOffline = (): string => {
    if (!offlineState.lastOnline) return '';
    
    const now = new Date();
    const diff = now.getTime() - offlineState.lastOnline.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getStatusColor = () => {
    if (!offlineState.isOnline) return 'bg-red-500';
    if (offlineState.dataSync === 'pending') return 'bg-yellow-500';
    if (offlineState.dataSync === 'failed') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!offlineState.isOnline) return WifiOff;
    if (offlineState.dataSync === 'pending') return RefreshCw;
    if (offlineState.dataSync === 'failed') return AlertTriangle;
    return CheckCircle;
  };

  // Show indicator when offline, syncing, or has pending actions
  const shouldShow = !offlineState.isOnline || 
                    offlineState.pendingActions > 0 || 
                    offlineState.dataSync !== 'synced' ||
                    isVisible;

  if (!shouldShow) return null;

  const StatusIcon = getStatusIcon();

  return (
    <>
      {/* Main offline indicator */}
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-lg transition-all duration-200 ${getStatusColor()} hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50`}
            >
              <StatusIcon className={`w-4 h-4 ${offlineState.dataSync === 'pending' ? 'animate-spin' : ''}`} />
              
              <span className="text-sm font-medium">
                {!offlineState.isOnline ? (
                  <>Offline Mode • {getTimeSinceOffline()}</>
                ) : offlineState.dataSync === 'pending' ? (
                  'Syncing...'
                ) : offlineState.pendingActions > 0 ? (
                  `${offlineState.pendingActions} pending`
                ) : (
                  'Back online!'
                )}
              </span>
              
              {offlineState.pendingActions > 0 && (
                <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{offlineState.pendingActions}</span>
                </div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed offline status panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Connection Status</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-3">
                {offlineState.isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {offlineState.isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {offlineState.isOnline 
                      ? 'Connected to internet'
                      : `Last online: ${getTimeSinceOffline()}`
                    }
                  </div>
                </div>
              </div>

              {/* Data Sync Status */}
              <div className="flex items-center gap-3">
                {offlineState.dataSync === 'synced' ? (
                  <Cloud className="w-5 h-5 text-green-500" />
                ) : offlineState.dataSync === 'pending' ? (
                  <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
                ) : (
                  <CloudOff className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm capitalize">
                    {offlineState.dataSync === 'synced' ? 'All synced' : 
                     offlineState.dataSync === 'pending' ? 'Syncing data' : 
                     'Sync failed'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {offlineState.pendingActions > 0 
                      ? `${offlineState.pendingActions} items to sync`
                      : 'All data is up to date'
                    }
                  </div>
                </div>
              </div>

              {/* Storage Usage */}
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Local Storage</div>
                  <div className="text-xs text-gray-500 mb-1">
                    {offlineState.storageUsage.toFixed(1)}% used
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${offlineState.storageUsage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Offline Capabilities */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Offline Features Available
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Add waste entries</li>
                  <li>✓ View diary history</li>
                  <li>✓ Track carbon credits</li>
                  <li>✓ Access gamification features</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!offlineState.isOnline && (
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Check Connection
                  </button>
                )}
                
                {offlineState.pendingActions > 0 && offlineState.isOnline && (
                  <button
                    onClick={syncOfflineData}
                    disabled={offlineState.dataSync === 'pending'}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {offlineState.dataSync === 'pending' ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay when showing details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
            className="fixed inset-0 bg-black bg-opacity-10 z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Hook for offline state management
export function useOfflineState() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineAction = (action: any) => {
    const pending = JSON.parse(localStorage.getItem('pending-sync') || '[]');
    pending.push({
      ...action,
      timestamp: new Date().toISOString(),
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
    localStorage.setItem('pending-sync', JSON.stringify(pending));
    setPendingActions(pending.length);
  };

  const clearOfflineActions = () => {
    localStorage.removeItem('pending-sync');
    setPendingActions(0);
  };

  return {
    isOnline,
    pendingActions,
    addOfflineAction,
    clearOfflineActions
  };
}

// Offline-first component wrapper
export function OfflineWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { isOnline } = useOfflineState();

  if (!isOnline && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Thailand-specific offline messages
export function ThailandOfflineMessage() {
  return (
    <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
      <WifiOff className="w-8 h-8 text-blue-600 mx-auto mb-3" />
      <h3 className="font-medium text-blue-800 mb-2">
        ใช้งานในโหมดออฟไลน์ / Offline Mode
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        คุณสามารถใช้งานแอปได้ต่อไป ข้อมูลจะถูกซิงค์เมื่อกลับมาออนไลน์<br/>
        You can continue using the app. Data will sync when you&apos;re back online.
      </p>
      <div className="bg-white rounded-lg p-3 mt-4">
        <div className="text-xs text-blue-800 font-medium mb-1">
          🇹🇭 Thailand Offline Features:
        </div>
        <div className="text-xs text-blue-700 space-y-1 text-left">
          <div>✓ เพิ่มข้อมูลขยะได้ต่อไป (Continue waste tracking)</div>
          <div>✓ ดูประวัติและคะแนนคาร์บอน (View history & credits)</div>
          <div>✓ ใช้คุณสมบัติเกมส์ (Gamification features)</div>
        </div>
      </div>
    </div>
  );
}