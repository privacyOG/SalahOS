import { readFileSync } from 'node:fs';

const sharedCss = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const smartDisplayCss = readFileSync(new URL('../src/smart-display.css', import.meta.url), 'utf8');

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

const minimumControlRem = Number.parseFloat(
  sharedCss.match(/min-height:\s*([0-9.]+)rem/)?.[1] ?? '0',
);
if (!Number.isFinite(minimumControlRem) || minimumControlRem < 2.75) {
  throw new Error('Interactive control minimum height must remain at least 2.75rem');
}

console.log(
  'Accessibility styling contract passed: visible keyboard focus, 2.75rem minimum controls, and reduced-motion smart-display behavior are preserved.',
);
