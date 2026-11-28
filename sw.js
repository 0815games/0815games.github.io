'use strict';

const CACHE_PREFIX = '0815-games-dashboard-';
const CACHE_NAME = `${CACHE_PREFIX}3.2.0`;
const APP_SCOPE = self.registration.scope;
const APP_ROOT = new URL('./', APP_SCOPE).href;
const INDEX_URL = new URL('index.html', APP_SCOPE).href;
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest?v=3.2.0',
  './arcade/dashboard.css?v=3.2.0',
  './arcade/dashboard.js?v=3.2.0',
  './arcade/favicon.svg?v=3.2.0',
  './arcade/safari-pinned-tab.svg?v=3.2.0',
  './arcade/icons/favicon.ico?v=3.2.0',
  './arcade/icons/favicon-16.png?v=3.2.0',
  './arcade/icons/favicon-32.png?v=3.2.0',
  './arcade/icons/apple-touch-icon.png?v=3.2.0',
  './arcade/icons/icon-192.png',
  './arcade/icons/icon-512.png',
  './arcade/icons/icon-512-maskable.png',
  './PipBoy3000/assets/vault-eingang.jpg',
  './tiny-tycoon-towns/icons/town.png',
  './IronPath/assets/command-horizon.jpg',
  './arcade/art/schattengruft-artwork.jpg'
];
const SHELL_URLS = new Set(SHELL_FILES.map(path => new URL(path, APP_SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES.map(path => new Request(new URL(path, APP_SCOPE).href))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(APP_ROOT)) return;

  if (request.mode === 'navigate' && (url.href === APP_ROOT || url.href === INDEX_URL)) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(INDEX_URL, response.clone()));
        return response;
      }).catch(async () => (await caches.match(INDEX_URL)) || (await caches.match(APP_ROOT)) || Response.error())
    );
    return;
  }

  if (!SHELL_URLS.has(url.href)) return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});
