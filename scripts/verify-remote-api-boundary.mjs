import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url);
const srcDirectory = new URL('../src/', import.meta.url);
const allowedFetchFile = 'src/platform/remoteApi.ts';

const forbiddenNetworkApis = [
  { label: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { label: 'WebSocket', pattern: /\bWebSocket\b/ },
  { label: 'EventSource', pattern: /\bEventSource\b/ },
  { label: 'navigator.sendBeacon', pattern: /\bnavigator\s*\.\s*sendBeacon\s*\(/ },
];

function sourceFiles(directoryPath) {
  const files = [];
  for (const entry of readdirSync(directoryPath)) {
    const path = join(directoryPath, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...sourceFiles(path));
      continue;
    }
    if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry) && !/\.test\.[^.]+$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

for (const path of sourceFiles(srcDirectory.pathname)) {
  const repositoryPath = relative(root.pathname, path).replaceAll('\\', '/');
  const source = readFileSync(path, 'utf8');

  if (repositoryPath !== allowedFetchFile && /\bfetch\s*\(/.test(source)) {
    throw new Error(
      `Direct production fetch() is not allowed in ${repositoryPath}; use src/platform/remoteApi.ts`,
    );
  }

  for (const api of forbiddenNetworkApis) {
    if (api.pattern.test(source)) {
      throw new Error(
        `${api.label} is not an approved production network path in ${repositoryPath}; use the reviewed remote API boundary`,
      );
    }
  }
}

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const csp = index.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/s)?.[1];
if (csp === undefined) {
  throw new Error('Content Security Policy meta tag is missing');
}
const connectDirective = csp
  .split(';')
  .map((directive) => directive.trim())
  .find((directive) => directive.startsWith('connect-src '));
if (connectDirective === undefined) {
  throw new Error('CSP connect-src directive is missing');
}
if (/\*|https?:/.test(connectDirective)) {
  throw new Error(`CSP connect-src must not enable arbitrary remote HTTP origins: ${connectDirective}`);
}
if (!connectDirective.split(/\s+/).includes("'self'")) {
  throw new Error(`CSP connect-src must retain the local self boundary: ${connectDirective}`);
}

console.log('Optional remote API boundary passed.');
