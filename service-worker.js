const CACHE_NAME = 'restaurant-order-manager-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// On install, cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// On fetch, serve from cache first, then network (stale-while-revalidate strategy)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(error => {
        console.warn('Service Worker: Fetch failed. Serving from cache if available.', error);
      });

      return cachedResponse || fetchedResponsePromise;
    })
  );
});