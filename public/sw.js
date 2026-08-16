const CACHE_PREFIX = 'salahos-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v4`;
const STATIC_SHELL_URLS = [
  '/manifest.webmanifest',
  '/icons/salahos-192.png',
  '/icons/salahos-512.png',
  '/icons/salahos-maskable-192.png',
  '/icons/salahos-maskable-512.png',
  '/icons/salahos.svg',
  '/icons/salahos-maskable.svg',
];
const CACHEABLE_STATIC_PREFIXES = ['/assets/', '/icons/'];
const CACHEABLE_STATIC_PATHS = new Set(['/manifest.webmanifest']);

function isCacheableStaticPath(pathname) {
  return (
    CACHEABLE_STATIC_PATHS.has(pathname) ||
    CACHEABLE_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isSuccessfulHtml(response) {
  return response.ok && (response.headers.get('content-type') || '').includes('text/html');
}

function assetUrlsFromHtml(html) {
  const urls = new Set();
  const referencePattern = /(?:src|href)=["']([^"']+)["']/g;
  for (const match of html.matchAll(referencePattern)) {
    const url = new URL(match[1], self.location.origin);
    if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
      urls.add(`${url.pathname}${url.search}`);
    }
  }
  return [...urls];
}

async function cacheApplicationShell(cache, shellResponse, includeStaticShell) {
  const html = await shellResponse.clone().text();
  const assetUrls = assetUrlsFromHtml(html);
  const requiredUrls = includeStaticShell ? [...STATIC_SHELL_URLS, ...assetUrls] : assetUrls;

  await cache.addAll(requiredUrls);
  await cache.put('/', shellResponse);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const shellResponse = await fetch('/', { cache: 'no-store' });
        if (!isSuccessfulHtml(shellResponse)) {
          throw new Error('Unable to install an offline shell from a successful HTML response');
        }

        await cacheApplicationShell(cache, shellResponse.clone(), true);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isSuccessfulHtml(response)) {
            const candidateShell = response.clone();
            event.waitUntil(
              caches
                .open(CACHE_NAME)
                .then((cache) => cacheApplicationShell(cache, candidateShell, false))
                .catch(() => undefined),
            );
          }
          return response;
        })
        .catch(() => caches.match('/').then((response) => response || Response.error())),
    );
    return;
  }

  if (!isCacheableStaticPath(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
