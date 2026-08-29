import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const display = read('src/mosque-display-theme.css');
const palettes = read('src/theme-palettes.css');
const contrast = read('src/theme-contrast-guard.css');
const main = read('src/main.tsx');
const smart = read('src/ui/SmartDisplayApplication.tsx');
const qibla = read('src/qibla-compass.css') + read('src/qiblah-v2.css');
const knowledge =
  read('src/ui/KnowledgeScreen.tsx') +
  read('src/ui/KnowledgeStage7Details.tsx') +
  read('src/ui/QuranOfflineReader.tsx');
const visual = read('scripts/visual-theme-matrix.mjs');
const required = ['next-prayer', 'prayer-card', 'iqamah', 'announcement', 'smart-display-brand'];
for (const marker of required)
  if (!display.includes(marker)) throw new Error(`Mosque hierarchy missing ${marker}`);
for (const p of ['royal-blue', 'emerald-mosque', 'midnight-gold', 'high-contrast']) {
  if (!display.includes(`:root[data-palette='${p}']`))
    throw new Error(`Display palette treatment is not rooted at data-palette for ${p}`);
}
if (!main.includes("'./mosque-display-theme.css'"))
  throw new Error('Mosque display theme not loaded');
if (!main.includes("'./theme-contrast-guard.css'"))
  throw new Error('Semantic contrast guard is not loaded');
if (!smart.includes('applyThemePalette(settings.palette'))
  throw new Error('Smart display does not consume shared palette contract');
for (const q of ['@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)'])
  if (!(display + contrast).includes(q)) throw new Error(`Accessibility guard missing ${q}`);
for (const p of [
  'salah-classic',
  'midnight-gold',
  'emerald-mosque',
  'royal-blue',
  'desert-sand',
  'olive-heritage',
  'monochrome',
  'high-contrast',
])
  if (!palettes.includes(p)) throw new Error(`Palette missing ${p}`);

for (const alias of [
  '--surface: var(--salah-bg-surface);',
  '--surface-elevated: var(--salah-bg-surface-raised);',
  '--border-subtle: var(--salah-border-subtle);',
]) {
  if (!contrast.includes(alias))
    throw new Error(`Legacy surface compatibility is not theme-safe: ${alias}`);
}
if (!qibla.includes('var(--surface-elevated') || !qibla.includes('var(--surface'))
  throw new Error('Qiblah legacy semantic-surface coverage changed without updating the guard');
if (
  !contrast.includes('.qibla-bearing-summary small') ||
  !contrast.includes('.qibla-heading-readout')
)
  throw new Error('Qiblah secondary text contrast guard is missing');

if (!knowledge.includes('lang="ar"') || !knowledge.includes('dir="rtl"'))
  throw new Error('Arabic Qur’an/Hadith content must declare Arabic RTL semantics');
if (!contrast.includes(".knowledge-card__arabic[lang='ar'][dir='rtl']"))
  throw new Error('Arabic scripture direction guard is missing');
if (
  !contrast.includes('text-align: right;') ||
  !contrast.includes('unicode-bidi: isolate;')
)
  throw new Error('Arabic scripture must remain explicitly right aligned and bidi-isolated');
for (const translationSelector of [
  '[data-quran-translation]',
  '[data-hadith-translation]',
  '.quran-offline-ayah__translation',
]) {
  if (!contrast.includes(translationSelector))
    throw new Error(`LTR translation direction guard missing ${translationSelector}`);
}
if (!contrast.includes('direction: ltr;') || !contrast.includes('text-align: left;'))
  throw new Error('English scripture translations must remain LTR and left aligned');

for (const marker of [
  'today',
  'qiblah',
  'settings',
  'smart-display',
  'rtl',
  'large-text',
  'system',
])
  if (!visual.includes(marker)) throw new Error(`Visual matrix missing ${marker}`);
if (!visual.includes("ready: '.qibla-finder--v2'"))
  throw new Error('Qiblah visual matrix readiness selector is stale');
if (!visual.includes('.map((element) =>'))
  throw new Error('Visual contrast sampling must map DOM nodes into serializable samples');
if (!visual.includes('resolveEffectiveBackground') || !visual.includes('compositeOver'))
  throw new Error(
    'Visual contrast sampling must resolve translucent backgrounds before comparison',
  );
if (!visual.includes("backgroundStyle.backgroundImage !== 'none'"))
  throw new Error('Visual contrast sampling must avoid false precision on complex backgrounds');
if (!visual.includes('const minimumRatio = largeText ? 3 : 4.5'))
  throw new Error('Visual matrix must enforce WCAG text contrast thresholds');
console.log('Stage 4 mosque display and Stage 5 visual/accessibility acceptance checks passed.');
