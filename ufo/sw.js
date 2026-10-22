const CACHE = "ufo-jagd-shell-v1";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./js/core/pwa-fullscreen.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {

        const copy = response.clone();

        caches
          .open(CACHE)
          .then(cache => cache.put(event.request, copy));

        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then(response =>
            response || caches.match("./index.html")
          )
      )
  );
});
