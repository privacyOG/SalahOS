import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const rasterIcons = [
  {
    path: 'icons/salahos-192.png',
    width: 192,
    height: 192,
    sizes: '192x192',
    purpose: 'any',
  },
  {
    path: 'icons/salahos-512.png',
    width: 512,
    height: 512,
    sizes: '512x512',
    purpose: 'any',
  },
  {
    path: 'icons/salahos-maskable-192.png',
    width: 192,
    height: 192,
    sizes: '192x192',
    purpose: 'maskable',
  },
  {
    path: 'icons/salahos-maskable-512.png',
    width: 512,
    height: 512,
    sizes: '512x512',
    purpose: 'maskable',
  },
];
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  ...rasterIcons.map((icon) => icon.path),
];

async function requireRegularFile(relativePath) {
  const absolutePath = path.join(dist, relativePath);
  await access(absolutePath);
  const info = await stat(absolutePath);
  if (!info.isFile() || info.size === 0) {
    throw new Error(`Expected non-empty build artifact: ${relativePath}`);
  }
}

function pngDimensions(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    throw new Error('Invalid PNG signature');
  }
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('PNG is missing its leading IHDR chunk');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
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

const manifestIcons = Array.isArray(manifest.icons) ? manifest.icons : [];
for (const expected of rasterIcons) {
  const declared = manifestIcons.find((icon) => icon?.src?.replace(/^\//, '') === expected.path);
  if (
    declared?.sizes !== expected.sizes ||
    declared?.type !== 'image/png' ||
    declared?.purpose !== expected.purpose
  ) {
    throw new Error(`Built manifest has an invalid raster icon declaration: ${expected.path}`);
  }

  const buffer = await readFile(path.join(dist, expected.path));
  const dimensions = pngDimensions(buffer);
  if (dimensions.width !== expected.width || dimensions.height !== expected.height) {
    throw new Error(
      `Built raster icon ${expected.path} has ${dimensions.width}x${dimensions.height}; expected ${expected.width}x${expected.height}`,
    );
  }
}

const builtServiceWorker = await readFile(path.join(dist, 'sw.js'), 'utf8');
const sourceServiceWorker = await readFile(path.resolve('public/sw.js'), 'utf8');
if (builtServiceWorker !== sourceServiceWorker) {
  throw new Error('Built service worker does not exactly match the tested public/sw.js source');
}

console.log('Web/PWA build artifact verification passed.');
