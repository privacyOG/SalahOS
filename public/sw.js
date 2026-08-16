const CACHE_PREFIX = 'salahos-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
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
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
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
