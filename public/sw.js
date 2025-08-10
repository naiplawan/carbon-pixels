// Thailand Waste Diary - Mobile-Optimized Service Worker
// Aggressive caching strategy for Thai mobile network conditions

const CACHE_NAME = 'thailand-waste-diary-v1.2.0'
const STATIC_CACHE = 'static-v1.2.0'
const DATA_CACHE = 'data-v1.2.0'
const IMAGE_CACHE = 'images-v1.2.0'

// Cache strategies based on Thai mobile network conditions
const CACHE_STRATEGIES = {
  // Critical resources - cache aggressively for offline support
  CRITICAL: [
    '/',
    '/diary',
    '/offline',
    '/manifest.json'
  ],
  
  // Static assets - long-term cache with network fallback
  STATIC: [
    '/favicon.ico',
    '/_next/static/css',
    '/_next/static/js'
  ],
  
  // API endpoints - stale-while-revalidate for fresh data
  API: [
    '/api/calculate',
    '/api/questions'
  ],
  
  // Data files - cache with background sync
  DATA: [
    '/data/thailand-waste-categories.json',
    '/data/thailand-questions.json'
  ],
  
  // Images - aggressive compression and caching
  IMAGES: [
    '.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'
  ]
}

// Install event - pre-cache critical resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Thailand Waste Diary Service Worker v1.2.0')
  
  event.waitUntil(
    Promise.all([
      // Cache critical pages and assets
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(CACHE_STRATEGIES.CRITICAL)
      }),
      
      // Pre-cache waste categories data for offline use
      caches.open(DATA_CACHE).then(cache => {
        return fetch('/data/thailand-waste-categories.json')
          .then(response => {
            if (response.ok) {
              return cache.put('/data/thailand-waste-categories.json', response)
            }
          })
          .catch(() => console.log('[SW] Failed to pre-cache waste data'))
      })
    ])
  )
  
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating new service worker')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DATA_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Claim all clients immediately
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return
  
  // Skip POST requests for cache
  if (request.method !== 'GET') return
  
  event.respondWith(handleRequest(request, url))
})

// Main request handler with mobile-optimized strategies
async function handleRequest(request, url) {
  try {
    // 1. Critical pages - cache-first with network fallback
    if (CACHE_STRATEGIES.CRITICAL.some(path => url.pathname === path || url.pathname.startsWith(path))) {
      return await cacheFirstStrategy(request, CACHE_NAME)
    }
    
    // 2. Static assets - cache-first with long expiration
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request, STATIC_CACHE, { maxAge: 31536000 }) // 1 year
    }
    
    // 3. API endpoints - network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
      return await networkFirstStrategy(request, DATA_CACHE, { timeout: 3000 })
    }
    
    // 4. Data files - stale-while-revalidate for offline support
    if (isDataFile(url)) {
      return await staleWhileRevalidateStrategy(request, DATA_CACHE)
    }
    
    // 5. Images - cache-first with compression
    if (isImageRequest(url)) {
      return await imageStrategy(request)
    }
    
    // 6. Everything else - network-first
    return await networkFirstStrategy(request, CACHE_NAME)
    
  } catch (error) {
    console.error('[SW] Fetch error:', error)
    
    // Fallback to offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline') || new Response('Offline - Thailand Waste Diary unavailable')
    }
    
    return new Response('Network Error', { status: 408 })
  }
}

// Cache-first strategy - optimized for mobile offline usage
async function cacheFirstStrategy(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Check if cache is expired (for data freshness)
    if (options.maxAge) {
      const cachedDate = cachedResponse.headers.get('sw-cached-date')
      if (cachedDate && Date.now() - parseInt(cachedDate) > options.maxAge * 1000) {
        // Cache expired, try network
        try {
          const networkResponse = await fetchWithTimeout(request, 2000)
          await updateCache(cache, request, networkResponse.clone())
          return networkResponse
        } catch {
          // Network failed, return stale cache
          return cachedResponse
        }
      }
    }
    
    return cachedResponse
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetchWithTimeout(request, 5000)
  await updateCache(cache, request, networkResponse.clone())
  return networkResponse
}

// Network-first strategy - for dynamic content
async function networkFirstStrategy(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName)
  const timeout = options.timeout || 3000
  
  try {
    const networkResponse = await fetchWithTimeout(request, timeout)
    await updateCache(cache, request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url)
    
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Stale-while-revalidate - for semi-dynamic content
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Always try to fetch in background for next time
  const fetchPromise = fetchWithTimeout(request, 5000)
    .then(networkResponse => {
      updateCache(cache, request, networkResponse.clone())
      return networkResponse
    })
    .catch(() => {}) // Ignore background fetch errors
  
  if (cachedResponse) {
    // Return cached version immediately, update in background
    fetchPromise
    return cachedResponse
  }
  
  // No cache, wait for network
  return await fetchPromise
}

// Image strategy - optimized for mobile data usage
async function imageStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetchWithTimeout(request, 8000) // Longer timeout for images
    
    // Only cache successful responses
    if (response.ok) {
      await updateCache(cache, request, response.clone())
    }
    
    return response
  } catch {
    // Return placeholder image for failed loads
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af" font-family="system-ui">📷</text></svg>',
      { 
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'max-age=86400'
        } 
      }
    )
  }
}

// Helper functions
async function fetchWithTimeout(request, timeout) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function updateCache(cache, request, response) {
  // Add timestamp for cache expiration
  const responseToCache = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...response.headers,
      'sw-cached-date': Date.now().toString()
    }
  })
  
  return cache.put(request, responseToCache)
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/static/') ||
         /\.(css|js|woff|woff2|ttf|eot)$/.test(url.pathname)
}

function isDataFile(url) {
  return url.pathname.startsWith('/data/') ||
         url.pathname.endsWith('.json')
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname) ||
         url.pathname.includes('images/') ||
         url.searchParams.has('w') || // Next.js image optimization
         url.searchParams.has('q')
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'waste-entry-sync') {
    event.waitUntil(syncWasteEntries())
  }
})

async function syncWasteEntries() {
  try {
    // Get pending waste entries from IndexedDB
    const pendingEntries = await getPendingWasteEntries()
    
    for (const entry of pendingEntries) {
      try {
        await fetch('/api/waste-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
        
        // Remove from pending queue
        await removePendingWasteEntry(entry.id)
      } catch {
        // Keep in queue for next sync
        console.log('[SW] Failed to sync entry:', entry.id)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingWasteEntries() {
  // Would implement IndexedDB reading
  return []
}

async function removePendingWasteEntry(id) {
  // Would implement IndexedDB deletion
}

// Push notifications for daily reminders
self.addEventListener('push', event => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body || 'Time to track your waste! 🌱',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: data.url || '/diary',
    actions: [
      {
        action: 'open-diary',
        title: 'Open Diary'
      },
      {
        action: 'scan-waste',
        title: 'Scan Waste'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Thailand Waste Diary',
      options
    )
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  let targetUrl = '/diary'
  
  if (event.action === 'scan-waste') {
    targetUrl = '/diary?action=scan'
  } else if (event.notification.data) {
    targetUrl = event.notification.data
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Message handling for client communication
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(getCacheSize().then(size => {
      event.ports[0].postMessage({ cacheSize: size })
    }))
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches().then(() => {
      event.ports[0].postMessage({ cleared: true })
    }))
  }
})

async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    
    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
}