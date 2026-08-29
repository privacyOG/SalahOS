import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const designSystem = fs.readFileSync(path.join(root, 'src/design-system.css'), 'utf8');
const guard = fs.readFileSync(path.join(root, 'src/theme-contrast-guard.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');

const requiredLightTokens = [
  '--salah-bg-canvas:',
  '--salah-bg-subtle:',
  '--salah-bg-surface:',
  '--salah-bg-surface-raised:',
  '--salah-bg-control:',
  '--salah-bg-accent-soft:',
  '--salah-fg-primary:',
  '--salah-fg-secondary:',
  '--salah-fg-tertiary:',
  '--salah-fg-accent:',
  '--salah-fg-warning:',
  '--salah-border-default:',
  '--salah-focus-ring:',
];

function blockAfter(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing theme block: ${marker}`);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}

const light = blockAfter(designSystem, ":root[data-theme='light'] {");
const systemLightStart = designSystem.indexOf('@media (prefers-color-scheme: light)');
const systemLight = designSystem.slice(systemLightStart);

for (const token of requiredLightTokens) {
  if (!light.includes(token)) throw new Error(`Light mode is missing ${token}`);
  if (!systemLight.includes(token)) throw new Error(`System/light mode is missing ${token}`);
}

for (const selector of ['.location-panel', '.status-card', '.prayer-panel', '.hero']) {
  if (!guard.includes(selector)) throw new Error(`Contrast guard does not cover ${selector}`);
}

if (!guard.includes('--salah-fg-on-accent')) {
  throw new Error('Dedicated on-accent foreground token is missing');
}
if (!main.includes("import './theme-contrast-guard.css';")) {
  throw new Error('Theme contrast guard is not loaded by the application');
}

console.log('Theme contrast semantic regression checks passed.');
