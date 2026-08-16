import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const harness = readFileSync(new URL('./visual-regression.mjs', import.meta.url), 'utf8');
const documentation = readFileSync(new URL('../docs/VISUAL_REGRESSION.md', import.meta.url), 'utf8');

if (packageJson.scripts?.['verify:visual-regression'] !== 'node scripts/visual-regression.mjs') {
  throw new Error('Visual regression package command is missing or changed without review');
}

for (const requiredWorkflowContract of [
  'run: npm run verify:visual-regression',
  'uses: actions/upload-artifact@v4',
  'path: artifacts/visual-regression/*.png',
  'if-no-files-found: ignore',
]) {
  if (!workflow.includes(requiredWorkflowContract)) {
    throw new Error(`Quality Gate visual regression contract is missing: ${requiredWorkflowContract}`);
  }
}

const requiredCases = [
  'phone-portrait-en-light',
  'phone-portrait-ar-dark',
  'phone-landscape-en-light',
  'tablet-en-light',
  'kiosk-1080p-ar-dark',
  'phone-portrait-en-light-text-125',
];
for (const visualCase of requiredCases) {
  if (!harness.includes(`name: '${visualCase}'`)) {
    throw new Error(`Visual regression fixture is missing: ${visualCase}`);
  }
}

for (const requiredHarnessContract of [
  "timeZone: 'Australia/Sydney'",
  "path: '/?mode=smart-display'",
  "readySelector: '.smart-display'",
  "Date.parse('2026-08-16T12:00:00.000Z')",
  'Page.addScriptToEvaluateOnNewDocument',
  'document.documentElement.scrollWidth',
  'document.documentElement.dir',
  'document.documentElement.lang',
  "format: 'png'",
  'captureBeyondViewport: false',
]) {
  if (!harness.includes(requiredHarnessContract)) {
    throw new Error(`Visual regression harness contract is missing: ${requiredHarnessContract}`);
  }
}

for (const evidenceBoundary of [
  'physical Raspberry Pi Touch Display 2',
  'TV overscan',
  'native notification delivery',
  'accessibility conformance',
]) {
  if (!documentation.includes(evidenceBoundary)) {
    throw new Error(`Visual regression evidence boundary is undocumented: ${evidenceBoundary}`);
  }
}

console.log(
  `Visual regression wiring contract passed: ${String(requiredCases.length)} deterministic browser cases plus CI screenshot artifacts.`,
);
