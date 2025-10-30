importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

workbox.setConfig({ debug: true });

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkOnly } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { setCatchHandler } = workbox.routing;

// Precache the app shell
precacheAndRoute([
  { url: '/', revision: null },
  { url: '/index.html', revision: null },
  { url: '/manifest.json', revision: null },
  { url: '/offline.html', revision: null },
  { url: '/vite.svg', revision: null },
  // Precaching main script files - adjust as per your build output if needed
  { url: '/index.tsx', revision: null },
  // Add PWA icons
  { url: '/icons/icon-72x72.png', revision: null },
  { url: '/icons/icon-96x996.png', revision: null },
  { url: '/icons/icon-128x128.png', revision: null },
  { url: '/icons/icon-144x144.png', revision: null },
  { url: '/icons/icon-152x152.png', revision: null },
  { url: '/icons/icon-192x192.png', revision: null },
  { url: '/icons/icon-384x384.png', revision: null },
  { url: '/icons/icon-512x512.png', revision: null },
]);

// Caching strategy for pages (the app shell)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Caching strategy for static assets (CSS, JS, etc.)
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources-cache',
  })
);

// Caching strategy for images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);


// Explicitly do not cache API calls to Google's services in the service worker.
// These will be handled by the app's offline queuing logic.
registerRoute(
  ({ url }) => url.hostname === 'generativelanguage.googleapis.com',
  new NetworkOnly()
);


// Offline fallback
setCatchHandler(async ({ event }) => {
  // Return the offline page for navigation requests
  if (event.request.mode === 'navigate') {
    return await caches.match('/offline.html');
  }
  // Return a generic error response for other failed requests
  return Response.error();
});


// Skip waiting and claim clients to ensure the new service worker activates immediately.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});