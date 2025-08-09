'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wifi, WifiOff, RefreshCw, CloudOff, Smartphone } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date());
      
      // Trigger sync when back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          (registration as any).sync.register('waste-entry-sync');
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
        {/* Status Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            {isOnline ? (
              <Wifi className="w-10 h-10 text-green-500" />
            ) : (
              <WifiOff className="w-10 h-10 text-gray-500" />
            )}
          </div>
          
          <h1 className="font-handwritten text-2xl text-gray-800 mb-2">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>
          
          <p className="text-gray-600 text-sm">
            {isOnline 
              ? 'Great! Your internet connection is back.' 
              : 'No worries! You can still use the waste diary offline.'
            }
          </p>
        </div>

        {/* Status Details */}
        <div className="space-y-4 mb-6">
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className="text-sm font-medium">Internet Connection</span>
            <div className="flex items-center">
              {isOnline ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium">Offline Features</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-blue-600">Available</span>
            </div>
          </div>

          {lastSyncTime && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-yellow-700">
                {lastSyncTime.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Offline Features Available */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-handwritten text-lg text-green-700 mb-3 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            What You Can Do Offline:
          </h3>
          
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Track new waste entries
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              View your diary history
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Check your carbon credits
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Use the carbon calculator
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Browse waste categories
            </li>
          </ul>
          
          <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-600">
            💡 <strong>Auto-sync:</strong> Your entries will sync automatically when you&apos;re back online!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleRetry}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-handwritten transition-colors ${
              isOnline 
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isOnline}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isOnline ? 'Reload Page' : 'Check Connection'}
          </button>
          
          <Link 
            href="/diary"
            className="flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-handwritten rounded-lg transition-colors"
          >
            <CloudOff className="w-4 h-4 mr-2" />
            Continue Offline
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <Link 
            href="/diary/quick-start"
            className="text-blue-600 hover:text-blue-700 underline py-2"
          >
            Quick Add Entry
          </Link>
          <Link 
            href="/calculator"
            className="text-blue-600 hover:text-blue-700 underline py-2"
          >
            Carbon Calculator
          </Link>
        </div>

        {/* Technical Info (collapsible) */}
        <details className="mt-6 border-t border-gray-200 pt-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Technical Information
          </summary>
          <div className="mt-2 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span className="text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Storage:</span>
              <span className="text-green-600">Available</span>
            </div>
            <div className="flex justify-between">
              <span>Background Sync:</span>
              <span className={
                'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
                  ? 'text-green-600' : 'text-amber-600'
              }>
                {'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype 
                  ? 'Supported' : 'Limited'
                }
              </span>
            </div>
          </div>
        </details>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Thailand Waste Diary • Powered by PWA Technology
        </div>
      </div>
    </div>
  );
}