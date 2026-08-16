import { readFileSync } from 'node:fs';

const serviceWorker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

for (const required of [
  "const CACHE_NAME = `${CACHE_PREFIX}v3`;",
  "const CACHEABLE_STATIC_PREFIXES = ['/assets/', '/icons/'];",
  "const CACHEABLE_STATIC_PATHS = new Set(['/manifest.webmanifest']);",
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

if (!/function\s+isSuccessfulHtml\s*\([^)]*\)\s*{[\s\S]*?response\.ok[\s\S]*?text\/html/.test(serviceWorker)) {
  throw new Error('Navigation shell caching must require a successful HTML response');
}

if (/CACHEABLE_STATIC_PREFIXES[\s\S]*?['"]\/api\//.test(serviceWorker)) {
  throw new Error('Service-worker static cache allowlist must not include API paths');
}

if (/url\.origin\s*!==\s*self\.location\.origin/.test(serviceWorker) === false) {
  throw new Error('Service worker must retain the same-origin request boundary');
}

console.log(
  'Service-worker cache boundary passed: navigation shell updates require successful HTML and runtime caching is limited to explicit first-party static asset paths.',
);
