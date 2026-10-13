// [2026-10-13 09:00] - sw.js: v0.2.9 Neue Firebase-Datenbank
const CACHE = 'schattengruft-v0.2.9';
const ASSETS = [
  './',
  './index.html',
  './css/style.css?v=0.2.9',
  './js/main.js?v=0.2.9',
  './js/core/version.js?v=0.2.9',
  './favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('gstatic.com')) return;

  const options = request.mode === 'navigate'
    ? { cache: 'reload' }
    : { cache: 'no-cache' };

  event.respondWith(
    fetch(request, options)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
