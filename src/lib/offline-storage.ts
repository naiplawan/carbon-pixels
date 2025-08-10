/**
 * Offline storage system using IndexedDB for Thailand Waste Diary
 * Optimized for Thai mobile users with poor connectivity
 */

import { WasteEntry, UserStats } from '@/types/waste'

interface OfflineQueue {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
  retryCount: number
}

interface SyncStatus {
  lastSyncTime: number
  pendingCount: number
  isOnline: boolean
}

class OfflineStorageManager {
  private dbName = 'ThailandWasteDiary'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  private stores = {
    wasteEntries: 'waste-entries',
    userStats: 'user-stats',
    offlineQueue: 'offline-queue',
    appData: 'app-data',
    userPreferences: 'user-preferences'
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Waste Entries Store
        if (!db.objectStoreNames.contains(this.stores.wasteEntries)) {
          const wasteStore = db.createObjectStore(this.stores.wasteEntries, { keyPath: 'id' })
          wasteStore.createIndex('timestamp', 'timestamp', { unique: false })
          wasteStore.createIndex('categoryId', 'categoryId', { unique: false })
          wasteStore.createIndex('date', 'date', { unique: false })
        }

        // User Stats Store
        if (!db.objectStoreNames.contains(this.stores.userStats)) {
          db.createObjectStore(this.stores.userStats, { keyPath: 'id' })
        }

        // Offline Queue Store
        if (!db.objectStoreNames.contains(this.stores.offlineQueue)) {
          const queueStore = db.createObjectStore(this.stores.offlineQueue, { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
          queueStore.createIndex('retryCount', 'retryCount', { unique: false })
        }

        // App Data Store (cached API responses)
        if (!db.objectStoreNames.contains(this.stores.appData)) {
          const appStore = db.createObjectStore(this.stores.appData, { keyPath: 'key' })
          appStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // User Preferences Store
        if (!db.objectStoreNames.contains(this.stores.userPreferences)) {
          db.createObjectStore(this.stores.userPreferences, { keyPath: 'key' })
        }
      }
    })
  }

  // Waste Entry Operations
  async saveWasteEntry(entry: WasteEntry, shouldSync = true): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.wasteEntries], 'readwrite')
    const store = transaction.objectStore(this.stores.wasteEntries)

    // Add date for easier querying
    const entryWithDate = {
      ...entry,
      date: new Date(entry.timestamp).toISOString().split('T')[0]
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entryWithDate)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Add to sync queue if online sync is enabled
    if (shouldSync && navigator.onLine) {
      await this.addToSyncQueue('CREATE', 'wasteEntries', entry)
    }
  }

  async getWasteEntries(limit?: number, offset = 0): Promise<WasteEntry[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.wasteEntries], 'readonly')
      const store = transaction.objectStore(this.stores.wasteEntries)
      const index = store.index('timestamp')
      
      const request = index.openCursor(null, 'prev') // Most recent first
      const results: WasteEntry[] = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        
        if (cursor && (!limit || count < offset + limit)) {
          if (count >= offset) {
            results.push(cursor.value)
          }
          count++
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async getWasteEntriesByDate(date: string): Promise<WasteEntry[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.wasteEntries], 'readonly')
      const store = transaction.objectStore(this.stores.wasteEntries)
      const index = store.index('date')
      
      const request = index.getAll(date)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getTodayWasteEntries(): Promise<WasteEntry[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getWasteEntriesByDate(today)
  }

  async deleteWasteEntry(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.wasteEntries], 'readwrite')
    const store = transaction.objectStore(this.stores.wasteEntries)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Add to sync queue
    if (navigator.onLine) {
      await this.addToSyncQueue('DELETE', 'wasteEntries', { id })
    }
  }

  // User Stats Operations
  async saveUserStats(stats: UserStats): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.userStats], 'readwrite')
    const store = transaction.objectStore(this.stores.userStats)

    const statsWithId = { ...stats, id: 'current' }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(statsWithId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getUserStats(): Promise<UserStats | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.userStats], 'readonly')
      const store = transaction.objectStore(this.stores.userStats)
      
      const request = store.get('current')
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          delete result.id // Remove the added id
        }
        resolve(result || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Offline Queue Operations
  async addToSyncQueue(action: 'CREATE' | 'UPDATE' | 'DELETE', type: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    const queueItem: OfflineQueue = {
      id: `${type}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data: { type, ...data },
      timestamp: Date.now(),
      retryCount: 0
    }

    const transaction = this.db!.transaction([this.stores.offlineQueue], 'readwrite')
    const store = transaction.objectStore(this.stores.offlineQueue)

    await new Promise<void>((resolve, reject) => {
      const request = store.add(queueItem)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getOfflineQueue(): Promise<OfflineQueue[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.offlineQueue], 'readonly')
      const store = transaction.objectStore(this.stores.offlineQueue)
      
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.offlineQueue], 'readwrite')
    const store = transaction.objectStore(this.stores.offlineQueue)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.offlineQueue], 'readwrite')
    const store = transaction.objectStore(this.stores.offlineQueue)

    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const item = getRequest.result
      if (item) {
        item.retryCount++
        store.put(item)
      }
    }
  }

  // App Data Caching
  async cacheAppData(key: string, data: any, ttl = 3600000): Promise<void> { // 1 hour default TTL
    if (!this.db) await this.init()

    const cacheItem = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    }

    const transaction = this.db!.transaction([this.stores.appData], 'readwrite')
    const store = transaction.objectStore(this.stores.appData)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cacheItem)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedAppData(key: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.appData], 'readonly')
      const store = transaction.objectStore(this.stores.appData)
      
      const request = store.get(key)
      request.onsuccess = () => {
        const result = request.result
        
        if (!result) {
          resolve(null)
          return
        }

        // Check if cache is expired
        if (Date.now() - result.timestamp > result.ttl) {
          // Remove expired cache
          this.removeCachedAppData(key)
          resolve(null)
          return
        }

        resolve(result.data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removeCachedAppData(key: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.appData], 'readwrite')
    const store = transaction.objectStore(this.stores.appData)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // User Preferences
  async savePreference(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.stores.userPreferences], 'readwrite')
    const store = transaction.objectStore(this.stores.userPreferences)

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPreference(key: string, defaultValue: any = null): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.userPreferences], 'readonly')
      const store = transaction.objectStore(this.stores.userPreferences)
      
      const request = store.get(key)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : defaultValue)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Storage Management
  async getStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init()

    const storeNames = Object.values(this.stores)
    const transaction = this.db!.transaction(storeNames, 'readwrite')

    await Promise.all(
      storeNames.map(storeName => 
        new Promise<void>((resolve, reject) => {
          const store = transaction.objectStore(storeName)
          const request = store.clear()
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      )
    )
  }

  // Sync Status
  async getSyncStatus(): Promise<SyncStatus> {
    const queue = await this.getOfflineQueue()
    const lastSyncTime = await this.getPreference('lastSyncTime', 0)
    
    return {
      lastSyncTime,
      pendingCount: queue.length,
      isOnline: navigator.onLine
    }
  }

  async updateLastSyncTime(): Promise<void> {
    await this.savePreference('lastSyncTime', Date.now())
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager()

// React hook for offline storage
import { useEffect, useState } from 'react'

export const useOfflineStorage = () => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    offlineStorage.init()
      .then(() => setIsReady(true))
      .catch((err) => setError(err.message))
  }, [])

  return {
    storage: offlineStorage,
    isReady,
    error
  }
}