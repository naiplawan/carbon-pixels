/**
 * Background sync system for Thailand Waste Diary
 * Handles online/offline data synchronization with retry logic
 */

import { offlineStorage } from './offline-storage'
import { WasteEntry } from '@/types/waste'

interface SyncEvent {
  id: string
  type: 'waste-entry' | 'user-stats' | 'achievements'
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

class BackgroundSyncManager {
  private isRunning = false
  private syncInterval: NodeJS.Timeout | null = null
  private maxRetries = 3
  private retryDelays = [1000, 5000, 15000] // 1s, 5s, 15s
  private batchSize = 10 // Process 10 items at a time for Thai mobile networks

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineEvent())
      window.addEventListener('offline', () => this.handleOfflineEvent())
      
      // Start periodic sync if online
      if (navigator.onLine) {
        this.startPeriodicSync()
      }
    }
  }

  /**
   * Register background sync with service worker
   */
  async registerSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register(tag)
        console.log('[Sync] Background sync registered:', tag)
      } catch (error) {
        console.error('[Sync] Failed to register background sync:', error)
        // Fallback to immediate sync
        this.syncNow()
      }
    } else {
      console.log('[Sync] Background sync not supported, using fallback')
      // Fallback for browsers without background sync
      this.syncNow()
    }
  }

  /**
   * Queue a sync event
   */
  async queueSync(type: string, action: 'CREATE' | 'UPDATE' | 'DELETE', data: any): Promise<void> {
    await offlineStorage.addToSyncQueue(action, type, data)
    
    // Try immediate sync if online
    if (navigator.onLine && !this.isRunning) {
      this.syncNow()
    } else {
      // Register for background sync
      await this.registerSync('waste-entry-sync')
    }
  }

  /**
   * Sync all pending data immediately
   */
  async syncNow(): Promise<SyncResult> {
    if (this.isRunning) {
      console.log('[Sync] Sync already running')
      return { success: false, synced: 0, failed: 0, errors: ['Sync already running'] }
    }

    if (!navigator.onLine) {
      console.log('[Sync] Offline, skipping sync')
      return { success: false, synced: 0, failed: 0, errors: ['Device offline'] }
    }

    this.isRunning = true
    console.log('[Sync] Starting sync...')

    let syncedCount = 0
    let failedCount = 0
    const errors: string[] = []

    try {
      const pendingItems = await offlineStorage.getOfflineQueue()
      console.log(`[Sync] Found ${pendingItems.length} pending items`)

      if (pendingItems.length === 0) {
        await offlineStorage.updateLastSyncTime()
        return { success: true, synced: 0, failed: 0, errors: [] }
      }

      // Process in batches to avoid overwhelming Thai mobile networks
      const batches = this.chunkArray(pendingItems, this.batchSize)
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(item => this.syncItem(item))
        )

        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i]
          const item = batch[i]

          if (result.status === 'fulfilled' && result.value.success) {
            await offlineStorage.removeFromSyncQueue(item.id)
            syncedCount++
          } else {
            const error = result.status === 'rejected' ? result.reason : result.value.error
            console.error(`[Sync] Failed to sync item ${item.id}:`, error)
            
            // Increment retry count
            await offlineStorage.incrementRetryCount(item.id)
            
            // Remove if max retries exceeded
            if (item.retryCount >= this.maxRetries) {
              console.log(`[Sync] Max retries exceeded for ${item.id}, removing from queue`)
              await offlineStorage.removeFromSyncQueue(item.id)
            }
            
            failedCount++
            errors.push(`${item.id}: ${error}`)
          }
        }

        // Small delay between batches for Thai networks
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(500)
        }
      }

      await offlineStorage.updateLastSyncTime()
      console.log(`[Sync] Completed: ${syncedCount} synced, ${failedCount} failed`)

    } catch (error) {
      console.error('[Sync] Sync failed:', error)
      errors.push(`Sync process failed: ${error}`)
    } finally {
      this.isRunning = false
    }

    return {
      success: failedCount === 0,
      synced: syncedCount,
      failed: failedCount,
      errors
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (item.data.type) {
        case 'wasteEntries':
          return await this.syncWasteEntry(item)
        case 'userStats':
          return await this.syncUserStats(item)
        default:
          return { success: false, error: `Unknown sync type: ${item.data.type}` }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Sync waste entry
   */
  private async syncWasteEntry(item: any): Promise<{ success: boolean; error?: string }> {
    const { action, data } = item

    try {
      let response: Response

      switch (action) {
        case 'CREATE':
          response = await this.fetchWithRetry('/api/waste-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          break

        case 'UPDATE':
          response = await this.fetchWithRetry(`/api/waste-entries/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          break

        case 'DELETE':
          response = await this.fetchWithRetry(`/api/waste-entries/${data.id}`, {
            method: 'DELETE'
          })
          break

        default:
          return { success: false, error: `Unknown action: ${action}` }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }

    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Sync user stats
   */
  private async syncUserStats(item: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.fetchWithRetry('/api/user-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Fetch with retry logic for Thai mobile networks
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout for Thai networks

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })

        clearTimeout(timeout)
        return response

      } catch (error) {
        if (i === retries) {
          throw error
        }
        
        // Wait before retry
        await this.delay(this.retryDelays[i] || 5000)
      }
    }

    throw new Error('Max retries exceeded')
  }

  /**
   * Start periodic background sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    // Sync every 30 seconds when online (Thai mobile-friendly)
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isRunning) {
        this.syncNow()
      }
    }, 30000)
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Handle online event
   */
  private handleOnlineEvent(): void {
    console.log('[Sync] Device came online')
    this.startPeriodicSync()
    
    // Immediate sync when coming online
    setTimeout(() => this.syncNow(), 1000)
  }

  /**
   * Handle offline event
   */
  private handleOfflineEvent(): void {
    console.log('[Sync] Device went offline')
    this.stopPeriodicSync()
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    return await offlineStorage.getSyncStatus()
  }

  /**
   * Force sync all pending items
   */
  async forceSyncAll(): Promise<SyncResult> {
    return await this.syncNow()
  }

  /**
   * Clear all pending sync items
   */
  async clearSyncQueue(): Promise<void> {
    const pendingItems = await offlineStorage.getOfflineQueue()
    for (const item of pendingItems) {
      await offlineStorage.removeFromSyncQueue(item.id)
    }
  }

  // Utility methods
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup on app close
   */
  destroy(): void {
    this.stopPeriodicSync()
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineEvent)
      window.removeEventListener('offline', this.handleOfflineEvent)
    }
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncManager()

// React hook for background sync
import { useEffect, useState } from 'react'

export const useBackgroundSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    lastSyncTime: 0,
    isSyncing: false
  })

  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    const updateStatus = async () => {
      const status = await backgroundSync.getSyncStatus()
      setSyncStatus(prev => ({
        ...prev,
        ...status
      }))
    }

    updateStatus()
    
    const interval = setInterval(updateStatus, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  const forceSyncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }))
    
    try {
      const result = await backgroundSync.forceSyncAll()
      setSyncResult(result)
      
      // Update status after sync
      const status = await backgroundSync.getSyncStatus()
      setSyncStatus(prev => ({
        ...prev,
        ...status,
        isSyncing: false
      }))
      
      return result
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }))
      throw error
    }
  }

  const queueForSync = async (type: string, action: 'CREATE' | 'UPDATE' | 'DELETE', data: any) => {
    await backgroundSync.queueSync(type, action, data)
    
    // Update pending count
    const status = await backgroundSync.getSyncStatus()
    setSyncStatus(prev => ({ ...prev, pendingCount: status.pendingCount }))
  }

  return {
    syncStatus,
    syncResult,
    forceSyncNow,
    queueForSync,
    clearSyncQueue: backgroundSync.clearSyncQueue.bind(backgroundSync)
  }
}