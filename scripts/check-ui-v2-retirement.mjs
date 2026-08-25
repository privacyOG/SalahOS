import { existsSync, readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

function forbid(content, pattern, label) {
  if (pattern.test(content)) {
    throw new Error(`UI/UX v2 retirement policy: ${label}`);
  }
}

function requireText(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`UI/UX v2 retirement policy: missing ${label}`);
  }
}

const settingsScreen = read('src/ui/SettingsScreen.tsx');
const settingsStyles = read('src/settings-screen.css');
const congregationStyles = read('src/congregation-shell.css');
const main = read('src/main.tsx');
const designSystemStyles = read('src/design-system.css');
const designSystem = read('docs/DESIGN_SYSTEM.md');
const smartDisplayRoot = read('src/ui/SmartDisplayRoot.tsx');
const smartDisplayApplication = read('src/ui/SmartDisplayApplication.tsx');
const packageJson = JSON.parse(read('package.json'));

forbid(settingsScreen, /from ['"]\.\.\/App['"]/, 'SettingsScreen must not import the legacy App');
forbid(settingsScreen, /<App\b/, 'SettingsScreen must not mount the legacy App');
forbid(
  settingsScreen,
  /legacyRef|settings-screen__legacy|legacy-core-route/,
  'legacy Settings route compatibility must stay retired',
);
forbid(
  settingsStyles,
  /settings-screen__legacy|data-settings-category|legacy-core-route/,
  'legacy destination-hiding CSS must stay retired',
);
forbid(
  congregationStyles,
  /legacy-core-route/,
  'congregation shell must not suppress legacy route content',
);
forbid(
  main,
  /createPortal|MutationObserver|CongregationDisplayThemeEditor/,
  'root portal or observer based Settings injection must stay retired',
);
forbid(
  main,
  /settings-display-entry__phone-home/,
  'Settings display controls must not be injected from the root application',
);
forbid(main, /from ['"]\.\/App['"]/, 'root application must not import the retired App');
forbid(
  designSystemStyles,
  /Compatibility aliases during the incremental Stage 22 migration/,
  'the Stage 22 root compatibility token block must stay retired',
);
const legacyRootTokenPattern =
  /^\s*--(?:page|page-glow|text|muted|label|card|control|control-border|card-border|divider|accent|next-card|warning|warning-bg|provenance|shadow)\s*:/m;
const legacyRootTokenMatch = designSystemStyles.match(legacyRootTokenPattern);
if (legacyRootTokenMatch !== null) {
  throw new Error(
    `UI/UX v2 retirement policy: legacy root design-system token declarations must stay retired: ${legacyRootTokenMatch[0].trim()}`,
  );
}

if (existsSync('src/App.tsx')) {
  throw new Error('UI/UX v2 retirement policy: src/App.tsx must remain retired');
}

requireText(main, "import('./ui/SmartDisplayRoot')", 'lazy dedicated smart-display root ownership');
requireText(
  smartDisplayRoot,
  'SmartDisplayApplication',
  'dedicated smart-display application ownership',
);
requireText(smartDisplayApplication, 'SmartDisplay', 'smart-display runtime rendering');
requireText(
  settingsScreen,
  'MobilePrayerThemeSettings',
  'direct personal display-theme settings ownership',
);
requireText(
  settingsScreen,
  'PrayerBoardWeatherSettings',
  'direct personal weather settings ownership',
);
requireText(settingsScreen, 'LocationSettingsPanel', 'dedicated location settings route');
requireText(
  settingsScreen,
  'MosqueIqamahSettingsPanel',
  'dedicated mosque and Iqamah settings route',
);
requireText(
  settingsScreen,
  'NotificationAdhanSettingsPanel',
  'dedicated notification and Adhan settings route',
);
requireText(
  settingsScreen,
  'AdvancedPrayerSettingsPanel',
  'dedicated advanced prayer settings route',
);
requireText(designSystem, 'UI/UX v2 architecture', 'final UI/UX v2 architecture documentation');

if (packageJson.scripts?.['ui:v2-retirement'] !== 'node scripts/check-ui-v2-retirement.mjs') {
  throw new Error('UI/UX v2 retirement policy: package script ui:v2-retirement is not wired');
}
if (!packageJson.scripts?.check?.includes('npm run ui:v2-retirement')) {
  throw new Error('UI/UX v2 retirement policy: repository check does not include ui:v2-retirement');
}
if (!packageJson.scripts?.['visual:check']?.includes('visual-ui-v2-retirement.mjs')) {
  throw new Error('UI/UX v2 retirement policy: visual matrix does not include Stage 27 acceptance');
}

console.log('UI/UX v2 legacy retirement policy passed.');
