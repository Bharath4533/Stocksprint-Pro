// Service Worker for StockSprint Pro PWA

const CACHE_NAME = 'stocksprint-pro-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/components.css',
  '/css/main.css',
  '/js/state.js',
  '/js/api.js',
  '/js/components/toast.js',
  '/js/components/modal.js',
  '/js/components/chart.js',
  '/js/components/orderModal.js',
  '/js/components/search.js',
  '/js/views/dashboard.js',
  '/js/views/markets.js',
  '/js/views/stockDetail.js',
  '/js/views/watchlist.js',
  '/js/views/portfolio.js',
  '/js/views/orders.js',
  '/js/views/funds.js',
  '/js/views/mutualFunds.js',
  '/js/views/ipo.js',
  '/js/views/alerts.js',
  '/js/views/notifications.js',
  '/js/views/onboarding.js',
  '/js/views/profile.js',
  '/js/views/support.js',
  '/js/views/legal.js',
  '/js/views/admin.js',
  '/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first for API requests, cache first for static assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
