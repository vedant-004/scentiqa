/* Scentiqa service worker — offline support for the PWA.
 * Strategy:
 * - Versioned static assets (/_next/static, /icons, fonts): cache-first
 * - Images: stale-while-revalidate (bounded)
 * - Page navigations: network-first, cache fallback, offline fallback page
 * - /api/* and /admin/*: never cached (always network)
 */
const VERSION = 'scentiqa-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const IMAGES_CACHE = `${VERSION}-images`;
const MAX_IMAGE_ENTRIES = 120;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Scentiqa</title>
<style>body{font-family:Georgia,serif;background:#faf7f2;color:#44403c;display:flex;min-height:100vh;margin:0;align-items:center;justify-content:center;text-align:center;padding:24px}
.card{max-width:340px}.mark{font-size:44px}.h{font-size:22px;font-weight:bold;margin:12px 0 8px}.p{font-size:14px;line-height:1.6}
a{display:inline-block;margin-top:16px;padding:10px 22px;border-radius:12px;background:#b45309;color:#fff;text-decoration:none;font-weight:bold;font-size:14px}</style>
</head><body><div class="card"><div class="mark">📵</div><div class="h">You're offline</div>
<p class="p">Scentiqa needs a connection to fetch the latest perfumes, prices and reviews. Check your network and try again.</p>
<a href="/">Retry</a></div></body></html>`;

self.addEventListener('install', (event) => {
  // Take over as soon as the new worker is ready.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('scentiqa-') && !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  );
}

function isImage(url) {
  return (
    url.pathname.startsWith('/images/') ||
    /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(url.pathname)
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxEntries);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // third-party: leave alone
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/')) return; // never cache

  // 1. Versioned static assets: cache-first, immutable by hash.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  // 2. Images: stale-while-revalidate, bounded.
  if (isImage(url) && !url.pathname.startsWith('/icons/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGES_CACHE);
        const hit = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              cache.put(request, res.clone());
              trimCache(IMAGES_CACHE, MAX_IMAGE_ENTRIES);
            }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      })(),
    );
    return;
  }

  // 3. Page navigations: network-first, fall back to cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES_CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          const hit = await cache.match(request);
          if (hit) return hit;
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      })(),
    );
  }
});
