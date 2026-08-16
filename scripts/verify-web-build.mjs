import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icons/salahos.svg',
  'icons/salahos-maskable.svg',
];

async function requireRegularFile(relativePath) {
  const absolutePath = path.join(dist, relativePath);
  await access(absolutePath);
  const info = await stat(absolutePath);
  if (!info.isFile() || info.size === 0) {
    throw new Error(`Expected non-empty build artifact: ${relativePath}`);
  }
}

for (const relativePath of requiredFiles) {
  await requireRegularFile(relativePath);
}

const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!indexHtml.includes('manifest.webmanifest')) {
  throw new Error('Built index.html does not reference manifest.webmanifest');
}
if (!indexHtml.includes('/assets/')) {
  throw new Error('Built index.html does not reference bundled production assets');
}

const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'));
if (manifest.start_url !== '/' || manifest.display !== 'standalone') {
  throw new Error('Built manifest must retain root start_url and standalone display mode');
}

const iconSources = new Set(
  Array.isArray(manifest.icons)
    ? manifest.icons
        .map((icon) => (icon && typeof icon.src === 'string' ? icon.src.replace(/^\//, '') : null))
        .filter(Boolean)
    : [],
);
for (const icon of ['icons/salahos.svg', 'icons/salahos-maskable.svg']) {
  if (!iconSources.has(icon)) {
    throw new Error(`Built manifest does not declare required icon: ${icon}`);
  }
}

const serviceWorker = await readFile(path.join(dist, 'sw.js'), 'utf8');
if (!serviceWorker.includes('salahos-shell-v2')) {
  throw new Error('Built service worker does not contain the expected shell cache version');
}

console.log('Web/PWA build artifact verification passed.');
