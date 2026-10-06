// Bluey service worker: lets Bluey open from the home screen like an app.
// - Every /api/ request (chat, speech, files) and anything from another site always goes
//   straight to the network; it is never cached.
// - The app's own files are network-first, so an online visit always gets the newest code.
//   A copy is kept as they load, so Bluey still opens with no signal (pwa.js then says so).
// Bump VERSION when this file or the icons change.
const VERSION = '1';
const CACHE = 'bluey-' + VERSION;
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon.svg', '/icons/favicon-32.png'];

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('bluey-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return; // network only

  const navigate = req.mode === 'navigate';
  const key = url.pathname === '/index.html' ? '/' : navigate ? url.pathname : url.pathname + url.search;
  event.respondWith((async () => {
    try {
      const fresh = await Promise.race([fetch(req), timeout(navigate ? 8000 : 15000)]);
      if (fresh.ok && fresh.type === 'basic' && !fresh.redirected) (await caches.open(CACHE)).put(key, fresh.clone());
      return fresh;
    } catch {
      const saved = await caches.match(key, { ignoreVary: true });
      return saved || (navigate ? await caches.match('/', { ignoreVary: true }) : null) || Response.error();
    }
  })());
});
