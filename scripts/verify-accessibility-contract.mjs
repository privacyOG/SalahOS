import { readFileSync } from 'node:fs';

const sharedCss = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const smartDisplayCss = readFileSync(new URL('../src/smart-display.css', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const browserHarness = readFileSync(
  new URL('./accessibility-browser-regression.mjs', import.meta.url),
  'utf8',
);

const requiredSharedContracts = [
  'button:focus-visible',
  'input:focus-visible',
  'select:focus-visible',
  'textarea:focus-visible',
  'summary:focus-visible',
  'outline: 3px solid var(--accent)',
  'outline-offset: 3px',
  'min-height: 2.75rem',
];

for (const contract of requiredSharedContracts) {
  if (!sharedCss.includes(contract)) {
    throw new Error(`Accessibility styling contract is missing: ${contract}`);
  }
}

if (!smartDisplayCss.includes('@media (prefers-reduced-motion: reduce)')) {
  throw new Error('Smart-display reduced-motion media query is missing');
}
if (!smartDisplayCss.includes('animation: none')) {
  throw new Error('Smart-display reduced-motion contract does not disable animation');
}
if (!smartDisplayCss.includes('animation: smart-display-pixel-shift')) {
  throw new Error('Smart-display burn-in movement contract is missing');
}

const controlHeightMatch = sharedCss.match(
  /button,\s*select,\s*input\s*\{[^}]*min-height:\s*([0-9.]+)rem/s,
);
const minimumControlRem = Number.parseFloat(controlHeightMatch?.[1] ?? '0');
if (!Number.isFinite(minimumControlRem) || minimumControlRem < 2.75) {
  throw new Error('Interactive control minimum height must remain at least 2.75rem');
}

if (
  packageJson.scripts?.['verify:accessibility-browser'] !==
  'node scripts/accessibility-browser-regression.mjs'
) {
  throw new Error('Accessibility browser regression package command is missing or changed');
}
if (!workflow.includes('run: npm run verify:accessibility-browser')) {
  throw new Error('Quality Gate no longer executes the accessibility browser regression');
}

for (const browserContract of [
  "style.textContent = ':root { font-size: 200% !important; }'",
  "key: 'Tab'",
  "name: 'prefers-reduced-motion', value: 'reduce'",
  "path: '/?mode=smart-display'",
  "'phone-portrait-en-light-text-200.png'",
]) {
  if (!browserHarness.includes(browserContract)) {
    throw new Error(`Accessibility browser contract is missing: ${browserContract}`);
  }
}

console.log(
  'Accessibility contract passed: keyboard focus, minimum controls, 200% browser reflow, reduced motion, and CI wiring are preserved.',
);
