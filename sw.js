const CACHE_NAME = 'vivomejor-v2.0.1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/auth.js',
    './js/tasks.js',
    './js/goals.js',
    './js/schedule.js',
    './js/firebase-config.js',
    'https://cdn.tailwindcss.com',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js',
    './assets/icon.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseToCache = response.clone();

                // Cache the fetched response
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // If not in cache, return offline page or error
                        return new Response('Offline - No cached version available', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});