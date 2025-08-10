/**
 * PWA Test Page - Test all PWA features for Thailand Waste Diary
 */

'use client'

import React, { useState, useEffect } from 'react'
import { usePWA } from '@/components/PWAProvider'
import { motion } from 'framer-motion'
import { 
  Smartphone, Wifi, WifiOff, Download, RefreshCw, 
  Bell, BellOff, Database, Zap, Battery, Signal,
  CheckCircle, XCircle, AlertCircle 
} from 'lucide-react'

export default function PWATestPage() {
  const {
    canInstall,
    isInstalled,
    updateAvailable,
    isUpdating,
    isOnline,
    isOfflineReady,
    syncStatus,
    notificationsEnabled,
    performanceSettings,
    deviceCapabilities,
    pwaStatus,
    showInstallPrompt,
    checkForUpdate,
    forceUpdate,
    enableNotifications,
    disableNotifications,
    forceSyncNow
  } = usePWA()

  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runPWATests = async () => {
    setIsRunningTests(true)
    const results: Record<string, boolean> = {}

    // Test 1: Service Worker
    results.serviceWorker = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null

    // Test 2: Web App Manifest
    try {
      const response = await fetch('/manifest.json')
      results.manifest = response.ok
    } catch {
      results.manifest = false
    }

    // Test 3: Offline Storage
    try {
      const testKey = 'pwa-test'
      localStorage.setItem(testKey, 'test')
      results.localStorage = localStorage.getItem(testKey) === 'test'
      localStorage.removeItem(testKey)
    } catch {
      results.localStorage = false
    }

    // Test 4: IndexedDB
    try {
      results.indexedDB = 'indexedDB' in window
    } catch {
      results.indexedDB = false
    }

    // Test 5: Push Notifications
    results.pushNotifications = 'Notification' in window && 'serviceWorker' in navigator

    // Test 6: Background Sync
    results.backgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype

    // Test 7: Cache API
    results.cacheAPI = 'caches' in window

    // Test 8: Install Prompt
    results.installPrompt = canInstall || isInstalled

    setTestResults(results)
    setIsRunningTests(false)
  }

  useEffect(() => {
    runPWATests()
  }, [canInstall, isInstalled])

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status === undefined) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusColor = (status: typeof pwaStatus) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100'
      case 'installing': return 'text-blue-600 bg-blue-100'
      case 'updating': return 'text-purple-600 bg-purple-100'
      case 'offline': return 'text-orange-600 bg-orange-100'
      case 'unsupported': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-handwritten text-gray-800 mb-2">
            🧪 PWA Feature Test
          </h1>
          <p className="text-gray-600">
            Thailand Waste Diary - Progressive Web App Testing
          </p>
          
          {/* PWA Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mt-4 ${getStatusColor(pwaStatus)}`}>
            <Zap className="w-4 h-4 mr-2" />
            Status: {pwaStatus.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PWA Features Test */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              PWA Features Test
            </h2>
            
            <div className="space-y-3">
              {Object.entries({
                'Service Worker': 'serviceWorker',
                'Web App Manifest': 'manifest',
                'Local Storage': 'localStorage',
                'IndexedDB': 'indexedDB',
                'Push Notifications': 'pushNotifications',
                'Background Sync': 'backgroundSync',
                'Cache API': 'cacheAPI',
                'Install Prompt': 'installPrompt'
              }).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <StatusIcon status={testResults[key]} />
                </div>
              ))}
            </div>
            
            <button
              onClick={runPWATests}
              disabled={isRunningTests}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRunningTests ? 'Testing...' : 'Re-run Tests'}
            </button>
          </div>

          {/* Current Status */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-blue-500" />
              Current Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Online Status</span>
                <div className="flex items-center">
                  {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                  <span className="ml-2 text-sm font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Installation</span>
                <span className={`text-sm font-medium ${isInstalled ? 'text-green-600' : 'text-gray-600'}`}>
                  {isInstalled ? 'Installed' : canInstall ? 'Can Install' : 'Not Available'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Offline Ready</span>
                <span className={`text-sm font-medium ${isOfflineReady ? 'text-green-600' : 'text-gray-600'}`}>
                  {isOfflineReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Notifications</span>
                <span className={`text-sm font-medium ${notificationsEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Sync</span>
                <span className="text-sm font-medium text-blue-600">
                  {syncStatus.pendingCount} items
                </span>
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Battery className="w-5 h-5 mr-2 text-purple-500" />
              Device Information
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Device Type</span>
                <span className="text-sm font-medium">
                  {deviceCapabilities.isLowEnd ? 'Low-end' : 'High-end'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Memory</span>
                <span className="text-sm font-medium">
                  ~{Math.round(deviceCapabilities.memoryGB)}GB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CPU Cores</span>
                <span className="text-sm font-medium">
                  {deviceCapabilities.cores}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection</span>
                <div className="flex items-center">
                  <Signal className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium">
                    {deviceCapabilities.connectionType.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Saver</span>
                <span className={`text-sm font-medium ${deviceCapabilities.saveData ? 'text-orange-600' : 'text-green-600'}`}>
                  {deviceCapabilities.saveData ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Performance Settings
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Animations</span>
                <span className={`text-sm font-medium ${performanceSettings.enableAnimations ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceSettings.enableAnimations ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Image Quality</span>
                <span className="text-sm font-medium capitalize">
                  {performanceSettings.imageQuality}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Haptic Feedback</span>
                <span className={`text-sm font-medium ${performanceSettings.enableHaptics ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceSettings.enableHaptics ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Max Requests</span>
                <span className="text-sm font-medium">
                  {performanceSettings.maxConcurrentRequests}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cache Strategy</span>
                <span className="text-sm font-medium capitalize">
                  {performanceSettings.cacheStrategy}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {!isInstalled && canInstall && (
            <button
              onClick={showInstallPrompt}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </button>
          )}

          {updateAvailable && (
            <button
              onClick={forceUpdate}
              disabled={isUpdating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Update
            </button>
          )}

          <button
            onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            {notificationsEnabled ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
            {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
          </button>

          <button
            onClick={forceSyncNow}
            disabled={syncStatus.isSyncing}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            {syncStatus.isSyncing ? (
              <Database className="w-4 h-4 animate-pulse mr-2" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Sync Now
          </button>
        </div>
      </div>
    </div>
  )
}

PWATestPage.displayName = 'PWATestPage'