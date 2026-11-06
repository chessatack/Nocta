/* Nocta service worker – offline app shell, runtime caching. Version: 428c5acd4a */
const VERSION = '428c5acd4a';
const SHELL = `nocta-shell-${VERSION}`;
const RUNTIME = 'nocta-runtime';
const BASE = self.registration.scope;
const PRECACHE = ["./","index.html","app.js?v=428c5acd4a","app.css?v=428c5acd4a","splash.js?v=428c5acd4a","engine.js","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png","icon.svg","maskable-512.png"].map(p => new URL(p, BASE).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nocta-shell-') && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/api/') || url.pathname.endsWith('/ws')) {
    event.respondWith(fetch(req).catch(() => new Response(JSON.stringify({ error: 'Offline – diese Funktion braucht eine Internetverbindung.' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(SHELL).then(c => c.put(BASE + 'index.html', copy)); return res; }).catch(() => caches.match(BASE + 'index.html')));
    return;
  }
  // static assets: cache first, then network (stale-while-revalidate for shell files)
  event.respondWith(
    caches.match(req, { ignoreSearch: url.pathname.endsWith('.js') || url.pathname.endsWith('.css') }).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok && (res.type === 'basic' || res.type === 'default')) { const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }),
  );
});
