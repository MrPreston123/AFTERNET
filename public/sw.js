/* AFTERNET service worker. In production builds, scripts/sw-manifest.mjs fills PRECACHE and VERSION. */
const VERSION = 'dev';
const PRECACHE = [];
const SHELL = `afternet-shell-${VERSION}`;
const TILES = 'afternet-tiles';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      for (let i = 0; i < PRECACHE.length; i += 20) {
        await Promise.all(PRECACHE.slice(i, i + 20).map((u) => cache.add(u).catch(() => {})));
      }
      self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('afternet-shell-') && k !== SHELL).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Map tiles, styles, sprites and glyphs: cache-first, so downloaded areas work with no signal.
  if (url.hostname === 'tiles.openfreemap.org') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILES);
        const hit = await cache.match(req, { ignoreVary: true });
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return new Response('', { status: 504 });
        }
      })(),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Pages: network first, fall back to the cached copy (and finally the app shell).
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(SHELL);
          cache.put(req, res.clone());
          return res;
        } catch {
          const cache = await caches.open(SHELL);
          return (
            (await cache.match(req, { ignoreSearch: true })) ||
            (await cache.match(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/')) ||
            (await cache.match('/app/')) ||
            new Response('AFTERNET is offline and this page was not saved.', { status: 503 })
          );
        }
      })(),
    );
    return;
  }

  // Static files: cache first.
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req, { ignoreSearch: url.pathname.startsWith('/_next/') ? false : true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      } catch {
        return new Response('', { status: 504 });
      }
    })(),
  );
});
