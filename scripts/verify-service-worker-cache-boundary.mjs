import { readFileSync } from 'node:fs';

const serviceWorker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

for (const required of [
  "const CACHE_NAME = `${CACHE_PREFIX}v3`;",
  "const CACHEABLE_STATIC_PREFIXES = ['/assets/', '/icons/'];",
  "const CACHEABLE_STATIC_PATHS = new Set(['/manifest.webmanifest']);",
  "'/icons/salahos-192.png'",
  "'/icons/salahos-512.png'",
  "'/icons/salahos-maskable-192.png'",
  "'/icons/salahos-maskable-512.png'",
  "'/icons/salahos.svg'",
  "'/icons/salahos-maskable.svg'",
  "fetch('/', { cache: 'no-store' })",
  'const assetUrls = assetUrlsFromHtml(html);',
  "url.pathname.startsWith('/assets/')",
  "await cache.put('/', shellResponse.clone());",
  'await cache.addAll([...STATIC_SHELL_URLS, ...assetUrls]);',
  'if (!isCacheableStaticPath(url.pathname)) return;',
  "response.headers.get('content-type')",
  "includes('text/html')",
  "response.ok && response.type === 'basic'",
  "cache.put('/', copy)",
  'cache.put(request, copy)',
]) {
  if (!serviceWorker.includes(required)) {
    throw new Error(`Service-worker cache boundary is missing required contract: ${required}`);
  }
}

if (
  !/function\s+isSuccessfulHtml\s*\([^)]*\)\s*{[\s\S]*?response\.ok[\s\S]*?text\/html/.test(
    serviceWorker,
  )
) {
  throw new Error('Navigation shell caching must require a successful HTML response');
}

if (!/function\s+assetUrlsFromHtml\s*\([^)]*\)\s*{[\s\S]*?\/assets\//.test(serviceWorker)) {
  throw new Error('Service-worker installation must derive first-party build assets from HTML');
}

if (/CACHEABLE_STATIC_PREFIXES[\s\S]*?['"]\/api\//.test(serviceWorker)) {
  throw new Error('Service-worker static cache allowlist must not include API paths');
}

if (/url\.origin\s*!==\s*self\.location\.origin/.test(serviceWorker) === false) {
  throw new Error('Service worker must retain the same-origin request boundary');
}

console.log(
  'Service-worker cache boundary passed: installation atomically precaches the first-party application shell, navigation shell updates require successful HTML, and runtime caching is limited to explicit static asset paths.',
);
