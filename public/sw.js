// public/sw.js
const CACHE_NAME = 'offline-sales-v1';
const OFFLINE_URL = '/offline';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting(); // Force activation

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
        // Cache critical app resources
        '/_next/static/css/',
        '/_next/static/js/',
        // Add other critical resources as needed
      ]).catch((error) => {
        console.error('Cache addAll failed:', error);
        // Continue even if some resources fail to cache
      });
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - serve from cache when offline, cache successful responses
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for now
  if (event.request.method !== 'GET') return;

  // Skip caching for API calls and external resources
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If online and response is successful, cache it
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline, try to serve from cache
        return caches.match(event.request)
          .then((response) => {
            return response || caches.match(OFFLINE_URL);
          });
      })
  );
});

// Background sync for pending sales
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'sync-pending-sales') {
    event.waitUntil(syncPendingSales());
  }
});

// Function to sync pending sales
async function syncPendingSales() {
  try {
    console.log('Starting background sync of pending sales');

    // Send message to all clients to trigger sync
    const clients = await self.clients.matchAll();
    const syncPromises = clients.map(client => {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETED') {
            resolve(event.data.result);
          }
        };

        client.postMessage({
          type: 'TRIGGER_SYNC',
          port: messageChannel.port2
        }, [messageChannel.port2]);

        // Timeout after 30 seconds
        setTimeout(() => resolve({ success: false, error: 'Timeout' }), 30000);
      });
    });

    const results = await Promise.all(syncPromises);
    const successful = results.filter(result => result && result.success).length;
    const failed = results.length - successful;

    console.log(`Background sync completed: ${successful} successful, ${failed} failed`);

    // Notify clients of completion
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETED',
        timestamp: new Date().toISOString(),
        results: { successful, failed }
      });
    });

  } catch (error) {
    console.error('Background sync failed:', error);

    // Notify clients of failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncPendingSales());
  }
});

// Push notification support (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});