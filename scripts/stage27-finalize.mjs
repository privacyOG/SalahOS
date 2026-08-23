import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changed = new Set();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function write(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  if (readFileSync(absolutePath, 'utf8') === content) return;
  writeFileSync(absolutePath, content);
  changed.add(relativePath);
}

function walkCss(directory) {
  const result = [];
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) result.push(...walkCss(absolutePath));
    else if (entry.endsWith('.css')) result.push(absolutePath);
  }
  return result;
}

const aliases = [
  ['--page-glow', '--salah-bg-canvas-glow'],
  ['--control-border', '--salah-border-default'],
  ['--card-border', '--salah-border-subtle'],
  ['--next-card', '--salah-bg-accent-soft'],
  ['--warning-bg', '--salah-bg-warning-soft'],
  ['--provenance', '--salah-fg-provenance'],
  ['--control', '--salah-bg-control'],
  ['--divider', '--salah-border-subtle'],
  ['--warning', '--salah-fg-warning'],
  ['--shadow', '--salah-shadow-color'],
  ['--muted', '--salah-fg-secondary'],
  ['--label', '--salah-fg-tertiary'],
  ['--accent', '--salah-fg-accent'],
  ['--card', '--salah-bg-surface'],
  ['--text', '--salah-fg-primary'],
  ['--page', '--salah-bg-canvas'],
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const absolutePath of walkCss(path.join(root, 'src'))) {
  const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, '/');
  if (relativePath === 'src/design-system.css') continue;
  let text = readFileSync(absolutePath, 'utf8');
  const ownsScopedPalette = aliases.some(([alias]) =>
    new RegExp(`${escapeRegExp(alias)}\\s*:`).test(text),
  );
  if (ownsScopedPalette) continue;
  const original = text;
  for (const [alias, semantic] of aliases) {
    const pattern = new RegExp(`var\\(\\s*${escapeRegExp(alias)}(?=\\s*[,\\)])`, 'g');
    text = text.replace(pattern, `var(${semantic}`);
  }
  if (text !== original) {
    writeFileSync(absolutePath, text);
    changed.add(relativePath);
  }
}

let designSystem = read('src/design-system.css');
const compatibilityBlock = /\n  \/\* Compatibility aliases during the incremental Stage 22 migration\. \*\/[\s\S]*?  --shadow: rgba\(0, 0, 0, 0\.2\);\n/;
if (!compatibilityBlock.test(designSystem)) {
  throw new Error('Stage 27 migration: compatibility alias block not found');
}
designSystem = designSystem.replace(compatibilityBlock, '\n');
designSystem = designSystem.replace(
  '  --salah-bg-accent-soft: #213628;\n',
  '  --salah-bg-accent-soft: #213628;\n  --salah-bg-canvas-glow: rgba(114, 158, 105, 0.16);\n  --salah-bg-warning-soft: rgba(111, 72, 36, 0.28);\n',
);
designSystem = designSystem.replace(
  '  --salah-shadow-hero: 0 2rem 5rem rgba(0, 0, 0, 0.25);\n',
  '  --salah-shadow-hero: 0 2rem 5rem rgba(0, 0, 0, 0.25);\n  --salah-shadow-color: rgba(0, 0, 0, 0.2);\n',
);
designSystem = designSystem.replaceAll('  --page-glow:', '  --salah-bg-canvas-glow:');
designSystem = designSystem.replaceAll('  --warning-bg:', '  --salah-bg-warning-soft:');
designSystem = designSystem.replace(
  "  --salah-shadow-hero: 0 2rem 5rem rgba(35, 49, 38, 0.12);\n  --salah-bg-canvas-glow:",
  "  --salah-shadow-hero: 0 2rem 5rem rgba(35, 49, 38, 0.12);\n  --salah-shadow-color: rgba(35, 49, 38, 0.1);\n  --salah-bg-canvas-glow:",
);
designSystem = designSystem.replaceAll('var(--page-glow)', 'var(--salah-bg-canvas-glow)');
write('src/design-system.css', designSystem);

let designDoc = read('docs/DESIGN_SYSTEM.md');
designDoc = designDoc.replace(
  'This document defines the Stage 22 visual and interaction foundation for SalahOS.',
  'This document defines the completed UI/UX v2 visual and interaction foundation for SalahOS.',
);
designDoc = designDoc.replace(
  'The existing `--page`, `--text`, `--card`, `--control` and related variables remain compatibility aliases for legacy workflows during later extraction stages. New UI must use `--salah-*` tokens directly.',
  'Stage 27 retired the root `--page`, `--text`, `--card`, `--control` and related compatibility aliases. Application and administration UI must use `--salah-*` semantic tokens directly. Prayer-board and Touch Display palettes may keep locally scoped template variables when they are declared on the display surface itself and cannot leak into congregation or administration pages.',
);
designDoc = designDoc.replace(
  '- `--salah-bg-accent-soft`: selected/current/next emphasis surface.',
  '- `--salah-bg-accent-soft`: selected/current/next emphasis surface.\n- `--salah-bg-canvas-glow`: restrained canvas-level decorative glow.\n- `--salah-bg-warning-soft`: warning-state background that remains subordinate to readable content.',
);
designDoc = designDoc.replace(
  '- Elevation: `--salah-shadow-sm`, `--salah-shadow-md`, `--salah-shadow-hero`.',
  '- Elevation: `--salah-shadow-sm`, `--salah-shadow-md`, `--salah-shadow-hero`, plus `--salah-shadow-color` for composed shadows that cannot use a preset elevation.',
);
designDoc = designDoc.replace(
  /## Stage 22 migration rule[\s\S]*$/,
  `## UI/UX v2 architecture\n\nStage 27 is the final ownership boundary for the v2 application. Congregation navigation is owned by \`CongregationShell\`; each destination mounts its own screen directly. \`SettingsScreen\` owns explicit category panels for Location, Mosque & Iqamah, Notifications & Adhan, Advanced prayer tools, appearance/data controls and personal display themes. It must never mount the retired single-page application and hide unrelated sections with CSS.\n\nTV/kiosk mode is isolated in \`SmartDisplayApplication\`, which owns clock recovery, prayer calculation/source application, notification resynchronisation, theme/locale application and keyboard exit before rendering \`SmartDisplay\`. The retired \`src/App.tsx\` monolith must not return. Administration remains isolated under \`AdminShell\`; fleet credentials and managed-display controls do not mount inside congregation settings.\n\n\`scripts/check-ui-v2-retirement.mjs\` is a permanent Quality Gate policy. It rejects the retired monolith, legacy destination-hiding wrappers, root portal/MutationObserver settings injection and root compatibility-token declarations. \`scripts/visual-ui-v2-retirement.mjs\` is the matching runtime acceptance check and captures final Stage 27 evidence for migrated settings and smart-display ownership.\n\nPrayer calculations, timetable semantics, location persistence, notification scheduling and offline guarantees remain domain-owned and must not change merely to simplify UI composition.\n`,
);
write('docs/DESIGN_SYSTEM.md', designDoc);

let platformStatus = read('docs/PLATFORM_STATUS.md');
if (!platformStatus.includes('## UI/UX v2 runtime ownership')) {
  platformStatus += `\n## UI/UX v2 runtime ownership\n\nThe congregation application now mounts destination-specific v2 screens directly. Settings categories no longer embed the retired single-page renderer or rely on CSS destination hiding. TV/kiosk mode runs through the dedicated \`SmartDisplayApplication\`, while administration remains isolated under \`AdminShell\`. Root compatibility colour aliases were retired; application and administration surfaces consume \`--salah-*\` semantic tokens, with template-specific palette variables limited to their locally scoped display surfaces.\n\nQuality Gate enforcement is provided by \`npm run ui:v2-retirement\`. Visual Regression includes the Stage 27 runtime ownership matrix so migrated Settings routes and smart-display mode are validated on the production build.\n`;
  write('docs/PLATFORM_STATUS.md', platformStatus);
}

let testing = read('TESTING.md');
if (!testing.includes('## UI/UX v2 retirement acceptance')) {
  testing += `\n## UI/UX v2 retirement acceptance\n\nStage 27 adds two permanent checks. \`npm run ui:v2-retirement\` statically rejects the retired \`src/App.tsx\` monolith, legacy Settings destination-hiding wrappers, root settings portal injection and root compatibility-token declarations. The Visual Regression matrix also runs \`scripts/visual-ui-v2-retirement.mjs\`, which opens the production build at the migrated Location, Mosque & Iqamah, Notifications & Adhan, Advanced and Display themes categories plus smart-display mode, verifies the expected route owner is present with no legacy wrapper, checks horizontal containment, and writes Stage 27 screenshots/results into the normal visual artifact.\n`;
  write('TESTING.md', testing);
}

const packagePath = path.join(root, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.scripts['ui:v2-retirement'] = 'node scripts/check-ui-v2-retirement.mjs';
if (!packageJson.scripts.check.includes('npm run ui:v2-retirement')) {
  packageJson.scripts.check = packageJson.scripts.check.replace(
    'npm run ui:design-system-ownership && ',
    'npm run ui:design-system-ownership && npm run ui:v2-retirement && ',
  );
}
if (!packageJson.scripts['visual:check'].includes('visual-ui-v2-retirement.mjs')) {
  packageJson.scripts['visual:check'] += ' && node scripts/visual-ui-v2-retirement.mjs';
}
write('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);

writeFileSync('stage27-files.txt', `${[...changed].sort().join('\n')}\n`);
console.log(`Stage 27 migration prepared for ${changed.size} files.`);
