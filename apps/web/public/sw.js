// Service Worker — shell cache strategy
const CACHE_NAME = 'shinebuild-v1';
const SHELL_ASSETS = ['/', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET navigation requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Skip Firebase API calls
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com')) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached ?? caches.match('/offline.html'))
    )
  );
});
