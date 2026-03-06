// GENCODE Service Worker — Soporte offline y caché
const CACHE_NAME = 'gencode-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap'
];

// Instalar — guardar en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => {
        // Fetch with CORS for Google Fonts
        if (url.startsWith('https://')) {
          return new Request(url, { mode: 'no-cors' });
        }
        return url;
      })).catch(() => {
        // Guardar lo que se pueda aunque alguno falle
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activar — limpiar cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first para assets locales, network-first para el resto
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Solo interceptar GET
  if (e.request.method !== 'GET') return;

  // Assets locales: cache-first
  if (url.origin === self.location.origin || e.request.url.startsWith('chrome-extension')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // Google Fonts u otros externos: network con fallback a caché
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
