const CACHE_NAME = 'sahan-edit-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/geminiService.ts',
  '/components/common/LoadingSpinner.tsx',
  '/components/common/ApiKeySelector.tsx',
  '/components/common/ApiKeyError.tsx',
  '/components/common/ApiKeyManager.tsx',
  '/components/ImageGenerator.tsx',
  '/components/CinematicImageGenerator.tsx',
  '/components/ImageEditor.tsx',
  '/components/VideoGenerator.tsx',
  '/components/VideoEditor.tsx',
  '/components/Home.tsx',
  '/components/Settings.tsx',
  '/components/Sidebar.tsx',
  '/components/common/AnimatedLogo.tsx',
  '/components/Header.tsx',
  '/components/common/ComingSoon.tsx',
  '/components/LogoEditor.tsx',
  '/components/VideoPromptGenerator.tsx',
  'https://cdn.tailwindcss.com',
  // Add icons for PWA
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Do not cache API requests, especially those with API keys.
  // This prevents caching one-time video download links.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
      // Respond from network only, do not cache.
      event.respondWith(fetch(event.request));
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Serve from cache
        }
        // Not in cache, fetch from network
        return fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching failed:', error);
            throw error;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});