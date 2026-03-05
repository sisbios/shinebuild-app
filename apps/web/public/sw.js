// Shine Build Hub — Service Worker
// Strategy: cache-first for static assets, network-first for HTML

const STATIC_CACHE = 'sbh-static-v2';
const NAV_CACHE = 'sbh-nav-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) =>
      c.addAll(['/', '/icons/icon-192.png', '/icons/icon-512.png']).catch(() => {})
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => ![STATIC_CACHE, NAV_CACHE].includes(n)).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first: immutable static chunks
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Network-first: HTML pages
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) caches.open(NAV_CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(async () => {
        const hit = await caches.match(req, { ignoreSearch: true });
        return hit ?? caches.match('/');
      })
    );
    return;
  }
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'PREFETCH') {
    const urls = e.data.urls ?? [];
    caches.open(NAV_CACHE).then((cache) =>
      Promise.all(urls.map((u) => fetch(u).then((r) => r.ok && cache.put(u, r)).catch(() => {})))
    );
  }
});
