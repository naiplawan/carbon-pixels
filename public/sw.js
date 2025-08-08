// Service Worker for Thailand Waste Diary PWA
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'thailand-waste-diary-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/diary',
  '/diary/quick-start',
  '/diary/manual',
  '/diary/history',
  '/calculator',
  '/offline',
  '/manifest.json',
  // Core styles and fonts
  '/_next/static/css/',
  // Core JavaScript bundles (Next.js will generate these)
  '/_next/static/chunks/',
  // Thailand waste categories data
  '/data/thailand-waste-categories.json',
  // Essential icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Dynamic assets to cache on request
const DYNAMIC_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\/_next\/static\//,
  /\/api\//
];

// Assets that should always be fetched from network
const NETWORK_FIRST_PATTERNS = [
  /\/api\/live-data/,
  /\/api\/sync/,
  /\/api\/notifications/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => 
          !asset.includes('_next') // Skip Next.js generated assets for now
        ));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests that aren't Google Fonts
  if (url.origin !== location.origin && 
      !DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    return;
  }

  // Handle different types of requests with different strategies
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(request.url))) {
    // Network first for live data
    event.respondWith(networkFirstStrategy(request));
  } else if (url.pathname.startsWith('/api/')) {
    // Cache first for API calls (with background sync)
    event.respondWith(cacheFirstWithSync(request));
  } else if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    // Stale while revalidate for dynamic assets
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Cache first for static assets
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Network first strategy (for live data)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Stale while revalidate strategy (for fonts, etc.)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    console.log('[SW] Background fetch failed:', request.url);
  });
  
  // Return cached response immediately, or wait for network
  return cachedResponse || networkResponsePromise;
}

// Cache first with background sync (for API calls)
async function cacheFirstWithSync(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Background fetch to update cache
    fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
    }).catch(() => {
      console.log('[SW] Background sync failed for:', request.url);
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', request.url);
    
    // Return meaningful offline response for API calls
    if (request.url.includes('/api/waste-entries')) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'waste-entry-sync') {
    event.waitUntil(syncWasteEntries());
  }
  
  if (event.tag === 'periodic-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

// Sync waste entries when back online
async function syncWasteEntries() {
  try {
    console.log('[SW] Syncing offline waste entries...');
    
    // Get offline entries from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_ENTRIES',
        data: { timestamp: Date.now() }
      });
    });
    
  } catch (error) {
    console.error('[SW] Failed to sync waste entries:', error);
  }
}

// Clean up old cache entries
async function cleanupOldCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove entries older than 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const deletePromises = requests
      .filter(request => {
        const cacheTime = parseInt(request.headers.get('sw-cache-time') || '0');
        return cacheTime < oneWeekAgo;
      })
      .map(request => cache.delete(request));
    
    await Promise.all(deletePromises);
    console.log('[SW] Cleaned up old cache entries');
    
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const defaultOptions = {
    body: 'Time to track your daily waste! 🌱',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'daily-reminder',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'track-now',
        title: 'Track Now',
        icon: '/icons/action-track.png'
      },
      {
        action: 'remind-later',
        title: 'Remind Later',
        icon: '/icons/action-later.png'
      }
    ],
    data: {
      url: '/diary/quick-start',
      timestamp: Date.now()
    }
  };
  
  let options = defaultOptions;
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options = {
        ...defaultOptions,
        ...payload,
        data: { ...defaultOptions.data, ...payload.data }
      };
    } catch (error) {
      console.log('[SW] Failed to parse push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Thailand Waste Diary', options)
  );
});

// Enhanced notification scheduling and management
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data || {};
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CACHE_WASTE_ENTRY') {
    cacheWasteEntry(data);
  }
  
  if (type === 'REQUEST_SYNC') {
    self.registration.sync.register('waste-entry-sync');
  }
  
  // New notification management messages
  if (type === 'SCHEDULE_NOTIFICATION') {
    scheduleLocalNotification(data);
  }
  
  if (type === 'CANCEL_NOTIFICATION') {
    cancelScheduledNotification(data.tag);
  }
  
  if (type === 'SHOW_ACHIEVEMENT') {
    showAchievementNotification(data);
  }
});

// Schedule local notification with delay
async function scheduleLocalNotification(notificationData) {
  const { delay, ...options } = notificationData;
  
  setTimeout(async () => {
    try {
      await self.registration.showNotification(options.title || 'Waste Diary', {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        vibrate: options.vibrate || [200, 100, 200],
        data: options.data || {},
        actions: options.actions || [
          { action: 'open', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
      
      console.log('[SW] Scheduled notification shown:', options.tag);
    } catch (error) {
      console.error('[SW] Failed to show scheduled notification:', error);
    }
  }, delay);
}

// Cancel scheduled notification
async function cancelScheduledNotification(tag) {
  try {
    const notifications = await self.registration.getNotifications({ tag });
    notifications.forEach(notification => notification.close());
    console.log('[SW] Cancelled notifications with tag:', tag);
  } catch (error) {
    console.error('[SW] Failed to cancel notification:', error);
  }
}

// Show achievement notification with special styling
async function showAchievementNotification(achievement) {
  const achievementOptions = {
    body: achievement.description,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/achievement-badge.png',
    tag: `achievement-${achievement.id}`,
    requireInteraction: true,
    vibrate: [300, 200, 300, 200, 300],
    actions: [
      {
        action: 'celebrate',
        title: 'Celebrate! 🎉',
        icon: '/icons/celebrate.png'
      },
      {
        action: 'share',
        title: 'Share',
        icon: '/icons/share.png'
      }
    ],
    data: {
      type: 'achievement',
      achievement: achievement,
      url: '/diary'
    }
  };
  
  await self.registration.showNotification(
    `🎉 ${achievement.title}`, 
    achievementOptions
  );
}

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const { action } = event;
  const { url } = event.notification.data || {};
  
  if (action === 'track-now') {
    event.waitUntil(
      clients.openWindow(url || '/diary/quick-start')
    );
  } else if (action === 'remind-later') {
    // Schedule another notification in 2 hours
    setTimeout(() => {
      self.registration.showNotification('Gentle Reminder 🌱', {
        body: 'Ready to track your environmental impact?',
        icon: '/icons/icon-192x192.png',
        tag: 'gentle-reminder',
        data: { url: '/diary/quick-start' }
      });
    }, 2 * 60 * 60 * 1000); // 2 hours
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.openWindow(url || '/diary')
    );
  }
});

// Original message handler removed - consolidated with enhanced version above

// Cache individual waste entries
async function cacheWasteEntry(entryData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const request = new Request(`/api/waste-entries/${entryData.id}`);
    const response = new Response(JSON.stringify(entryData), {
      headers: {
        'Content-Type': 'application/json',
        'sw-cache-time': Date.now().toString()
      }
    });
    
    await cache.put(request, response);
    console.log('[SW] Cached waste entry:', entryData.id);
    
  } catch (error) {
    console.error('[SW] Failed to cache waste entry:', error);
  }
}

// Periodic cleanup registration
self.addEventListener('activate', (event) => {
  // Register periodic cleanup
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.registration.sync.register('periodic-cleanup');
  }
});

console.log('[SW] Service Worker loaded successfully ✅');