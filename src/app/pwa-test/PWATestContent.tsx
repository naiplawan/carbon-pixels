'use client'

import React, { useState, useEffect } from 'react'
import { usePWA } from '@/components/PWAProvider'
import { motion } from 'framer-motion'
import { 
  Smartphone, Wifi, WifiOff, Download, RefreshCw, 
  Bell, BellOff, Database, Zap, Battery, Signal,
  CheckCircle, XCircle, AlertCircle 
} from 'lucide-react'

export default function PWATestContent() {
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
    results.pushNotifications = 'Notification' in window && 'PushManager' in window

    // Test 6: Background Sync
    results.backgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype

    // Test 7: Cache API
    results.cacheAPI = 'caches' in window

    // Test 8: Network Information
    results.networkInfo = 'connection' in navigator

    setTestResults(results)
    setIsRunningTests(false)
  }

  useEffect(() => {
    // Auto-run tests on component mount
    runPWATests()
  }, [])

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="w-5 h-5 text-gray-400" />
    return status 
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : <XCircle className="w-5 h-5 text-red-600" />
  }

  const getStatusText = (status: boolean | undefined) => {
    if (status === undefined) return 'Testing...'
    return status ? 'Passed' : 'Failed'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🇹🇭 PWA Test Suite
          </h1>
          <p className="text-gray-600">
            Thailand Waste Diary - Progressive Web App Capabilities
          </p>
        </motion.div>

        {/* PWA Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Install Status</p>
                <p className="font-semibold text-lg">
                  {isInstalled ? 'Installed' : canInstall ? 'Available' : 'Not Available'}
                </p>
              </div>
              <Smartphone className={`w-8 h-8 ${isInstalled ? 'text-green-600' : canInstall ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connection</p>
                <p className="font-semibold text-lg">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              {isOnline ? 
                <Wifi className="w-8 h-8 text-green-600" /> : 
                <WifiOff className="w-8 h-8 text-red-600" />
              }
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notifications</p>
                <p className="font-semibold text-lg">
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {notificationsEnabled ? 
                <Bell className="w-8 h-8 text-green-600" /> : 
                <BellOff className="w-8 h-8 text-gray-400" />
              }
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Updates</p>
                <p className="font-semibold text-lg">
                  {updateAvailable ? 'Available' : 'Up to Date'}
                </p>
              </div>
              <RefreshCw className={`w-8 h-8 ${updateAvailable ? 'text-blue-600' : 'text-green-600'}`} />
            </div>
          </motion.div>
        </div>

        {/* Test Results */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">PWA Feature Tests</h2>
            <button
              onClick={runPWATests}
              disabled={isRunningTests}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Testing...' : 'Run Tests'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'serviceWorker', label: 'Service Worker', icon: Zap },
              { key: 'manifest', label: 'Web App Manifest', icon: Smartphone },
              { key: 'localStorage', label: 'Local Storage', icon: Database },
              { key: 'indexedDB', label: 'IndexedDB', icon: Database },
              { key: 'pushNotifications', label: 'Push Notifications', icon: Bell },
              { key: 'backgroundSync', label: 'Background Sync', icon: RefreshCw },
              { key: 'cacheAPI', label: 'Cache API', icon: Database },
              { key: 'networkInfo', label: 'Network Information', icon: Signal }
            ].map(({ key, label, icon: Icon }, index) => (
              <motion.div
                key={key}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults[key])}
                  <span className={`text-sm ${
                    testResults[key] === true ? 'text-green-600' : 
                    testResults[key] === false ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {getStatusText(testResults[key])}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {canInstall && !isInstalled && (
            <button
              onClick={showInstallPrompt}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Install App
            </button>
          )}

          {updateAvailable && (
            <button
              onClick={forceUpdate}
              disabled={isUpdating}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
              Update App
            </button>
          )}

          {!notificationsEnabled && (
            <button
              onClick={enableNotifications}
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <Bell className="w-5 h-5" />
              Enable Notifications
            </button>
          )}

          <button
            onClick={forceSyncNow}
            disabled={syncStatus.isSyncing}
            className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            Force Sync
          </button>
        </motion.div>

        {/* Device Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-md p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Performance Tier:</strong> {deviceCapabilities.performanceTier}</p>
              <p><strong>RAM:</strong> {deviceCapabilities.ram}GB</p>
              <p><strong>CPU Cores:</strong> {deviceCapabilities.cores}</p>
            </div>
            <div>
              <p><strong>Network:</strong> {deviceCapabilities.network}</p>
              <p><strong>Battery Optimizations:</strong> {performanceSettings.enableBatteryOptimizations ? 'On' : 'Off'}</p>
              <p><strong>Reduced Animations:</strong> {performanceSettings.reduceAnimations ? 'On' : 'Off'}</p>
            </div>
          </div>
        </motion.div>

        {/* Thai Context Note */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Thailand Mobile Optimization</p>
              <p className="text-sm text-amber-700 mt-1">
                This PWA is optimized for Thai mobile networks and devices. Features include
                aggressive caching for 3G/4G networks, battery optimization for budget devices,
                and offline-first waste tracking capabilities.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}