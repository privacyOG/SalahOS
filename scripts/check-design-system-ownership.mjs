import { existsSync, readFileSync, readdirSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

function requireText(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`Design-system ownership policy: missing ${label}`);
  }
}

function forbid(content, pattern, label) {
  if (pattern.test(content)) {
    throw new Error(`Design-system ownership policy: ${label}`);
  }
}

const designSystem = read('src/design-system.css');
const primitives = read('src/design-system-primitives.css');
const legacyStyles = read('src/styles.css');
const responsiveHardening = read('src/responsive-hardening.css');
const main = read('src/main.tsx');
const designSurface = read('src/ui/DesignSurface.tsx');
const iconFamily = read('src/ui/SalahIcon.tsx');
const qualityWorkflow = read('.github/workflows/ci.yml');

requireText(designSystem, '--salah-bg-canvas:', 'semantic colour tokens in design-system.css');
requireText(designSystem, '--salah-space-4:', 'spacing tokens in design-system.css');
requireText(designSystem, '--salah-text-display:', 'typography tokens in design-system.css');
requireText(designSystem, '.app-shell {', 'application-shell ownership in design-system.css');
requireText(designSystem, '@media (forced-colors: active)', 'forced-colours ownership');
requireText(designSystem, '@media (prefers-reduced-motion: reduce)', 'reduced-motion ownership');

for (const primitive of [
  '.ds-page {',
  '.ds-type-display-clock',
  '.ds-button {',
  '.ds-field {',
  '.ds-segmented,',
  '.ds-tabs {',
  '.ds-switch {',
  '.ds-banner {',
  '.ds-dialog,',
  '.ds-sheet,',
  '.ds-popover,',
  '.ds-tooltip {',
  '.ds-menu {',
  '.ds-prayer-row,',
  '.ds-next-prayer {',
  '.ds-mosque-summary,',
  '.ds-announcement-preview {',
  '.ds-skeleton {',
]) {
  requireText(primitives, primitive, `primitive ${primitive}`);
}

forbid(
  primitives,
  /--salah-[\w-]+\s*:/,
  'design-system-primitives.css must consume semantic tokens rather than define them',
);

for (const filename of readdirSync('src').filter((name) => name.endsWith('.css'))) {
  if (filename === 'design-system.css') {
    continue;
  }
  forbid(
    read(`src/${filename}`),
    /--salah-[\w-]+\s*:/,
    `${filename} must not define semantic SalahOS tokens`,
  );
}

requireText(
  main,
  "import './design-system.css';\nimport './design-system-primitives.css';",
  'adjacent authoritative design-system imports',
);
requireText(designSurface, 'export function DesignButton', 'shared button component');
requireText(designSurface, 'export function StateBanner', 'shared state banner component');
requireText(designSurface, 'export function PrayerRow', 'shared prayer-row component');
requireText(designSurface, 'export function NextPrayerSummary', 'shared next-prayer component');
requireText(designSurface, 'export function MosqueSummary', 'shared mosque-summary component');
requireText(
  designSurface,
  'export function AnnouncementPreview',
  'shared announcement-preview component',
);

for (const icon of [
  "'today'",
  "'mosques'",
  "'qiblah'",
  "'community'",
  "'settings'",
  "'prayer'",
  "'iqamah'",
  "'location'",
  "'display'",
  "'administration'",
]) {
  requireText(iconFamily, icon, `shared icon concept ${icon}`);
}

forbid(
  legacyStyles,
  /(^|\n)\s*:root(?:\s|\[|\{)/,
  'src/styles.css must not redefine root theme tokens',
);
forbid(
  legacyStyles,
  /--salah-[\w-]+\s*:/,
  'src/styles.css must not define semantic SalahOS tokens',
);
forbid(legacyStyles, /(^|\n)\s*\.app-shell\s*\{/, 'src/styles.css must not own .app-shell');
forbid(legacyStyles, /(^|\n)\s*\.hero\s*\{/, 'src/styles.css must not own the global .hero shell');
forbid(
  responsiveHardening,
  /(^|\n)\s*\.app-shell\s*\{/,
  'src/responsive-hardening.css must not own .app-shell',
);
forbid(
  main,
  /prayer-first-home\.css/,
  'src/main.tsx must not import retired prayer-first-home.css',
);

if (existsSync('src/prayer-first-home.css')) {
  throw new Error(
    'Design-system ownership policy: retired src/prayer-first-home.css must stay removed',
  );
}

requireText(
  qualityWorkflow,
  'permissions:\n  contents: read',
  'read-only Quality Gate permissions',
);
forbid(
  qualityWorkflow,
  /contents:\s*write/,
  'Quality Gate must not request repository write permission',
);
forbid(qualityWorkflow, /\bgit\s+commit\b/, 'Quality Gate must not create repository commits');
forbid(qualityWorkflow, /\bgit\s+push\b/, 'Quality Gate must not push repository changes');

console.log('Design-system ownership and Quality Gate mutation policies passed.');
