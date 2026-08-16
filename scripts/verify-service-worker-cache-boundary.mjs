import { readFileSync } from 'node:fs';

const serviceWorker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

for (const required of [
  "const CACHE_NAME = `${CACHE_PREFIX}v5`;",
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
  'function assertSalahOsShellHtml(html, assetUrls)',
  "html.includes('id=\"root\"')",
  "html.includes('manifest.webmanifest')",
  'assetUrls.length === 0',
  'assertSalahOsShellHtml(html, assetUrls);',
  'async function cacheApplicationShell(cache, shellResponse, includeStaticShell)',
  'await cache.addAll(requiredUrls);',
  "await cache.put('/', shellResponse);",
  'cacheApplicationShell(cache, shellResponse.clone(), true)',
  'await cacheApplicationShell(cache, candidateShell, false);',
  'if (!isCacheableStaticPath(url.pathname)) return;',
  "response.headers.get('content-type')",
  "includes('text/html')",
  "response.ok && response.type === 'basic'",
  'cache.put(request, copy)',
]) {
  if (!serviceWorker.includes(required)) {
    throw new Error(`Service-worker cache boundary is missing required contract: ${required}`);
  }
}

for (const requiredRegistrationContract of [
  '!Capacitor.isNativePlatform()',
  "'serviceWorker' in navigator",
  'import.meta.env.PROD',
  "navigator.serviceWorker.register('/sw.js').catch(() => undefined)",
]) {
  if (!main.includes(requiredRegistrationContract)) {
    throw new Error(
      `Browser-only service-worker registration contract is missing: ${requiredRegistrationContract}`,
    );
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
  throw new Error('Service-worker shell caching must derive first-party build assets from HTML');
}

const identityHelperStart = serviceWorker.indexOf('function assertSalahOsShellHtml(html, assetUrls)');
const shellHelperStart = serviceWorker.indexOf(
  'async function cacheApplicationShell(cache, shellResponse, includeStaticShell)',
);
const identityCallIndex = serviceWorker.indexOf('assertSalahOsShellHtml(html, assetUrls);', shellHelperStart);
const shellAddIndex = serviceWorker.indexOf('await cache.addAll(requiredUrls);', shellHelperStart);
const shellPutIndex = serviceWorker.indexOf("await cache.put('/', shellResponse);", shellHelperStart);
if (
  identityHelperStart < 0 ||
  shellHelperStart < 0 ||
  identityCallIndex < 0 ||
  shellAddIndex < 0 ||
  shellPutIndex < 0 ||
  shellAddIndex < identityCallIndex ||
  shellPutIndex < shellAddIndex
) {
  throw new Error(
    'Service-worker shell updates must verify SalahOS shell identity, cache referenced assets, then replace cached root HTML in that order',
  );
}

const navigationStart = serviceWorker.indexOf("if (request.mode === 'navigate')");
const navigationEnd = serviceWorker.indexOf("if (!isCacheableStaticPath(url.pathname)) return;", navigationStart);
const navigationBlock =
  navigationStart >= 0 && navigationEnd > navigationStart
    ? serviceWorker.slice(navigationStart, navigationEnd)
    : '';
if (!navigationBlock.includes('.then(async (response) =>')) {
  throw new Error('Navigation response must await the atomic shell-cache upgrade');
}
if (navigationBlock.includes('event.waitUntil(')) {
  throw new Error('Navigation cache upgrades must not depend on a late FetchEvent.waitUntil call');
}

if (/CACHEABLE_STATIC_PREFIXES[\s\S]*?['"]\/api\//.test(serviceWorker)) {
  throw new Error('Service-worker static cache allowlist must not include API paths');
}

if (/url\.origin\s*!==\s*self\.location\.origin/.test(serviceWorker) === false) {
  throw new Error('Service worker must retain the same-origin request boundary');
}

console.log(
  'Service-worker cache boundary passed: only verified SalahOS application HTML can replace the offline root shell, install/navigation upgrades are atomic and awaited, runtime caching is limited to explicit static asset paths, and registration is browser/PWA-only.',
);
