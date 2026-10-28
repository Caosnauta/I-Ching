/* Libro de las Mutaciones: copia local para usar sin conexión.
   Sirve primero lo guardado y actualiza en segundo plano cuando hay internet. */
const CACHE = 'mutaciones-mvrmepip';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mutaciones-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const hit = await cache.match(key, { ignoreSearch: true });
      const net = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const res = await net;
      return res || (await cache.match('./index.html')) || new Response('Sin conexión', { status: 503 });
    })
  );
});
