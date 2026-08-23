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
const designSystem = read('docs/DESIGN_SYSTEM.md');
const smartDisplayApplication = read('src/ui/SmartDisplayApplication.tsx');

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
  'congregation shell must not suppress the legacy App',
);
forbid(
  main,
  /createPortal|MutationObserver|CongregationDisplayThemeEditor/,
  'portal-based Settings injection must stay retired',
);
forbid(
  main,
  /settings-display-entry__phone-home/,
  'Settings display controls must not be injected from the root application',
);
forbid(main, /from ['"]\.\/App['"]/, 'root application must not import the retired App');
if (existsSync('src/App.tsx')) {
  throw new Error('UI/UX v2 retirement policy: src/App.tsx must remain retired');
}

requireText(main, 'SmartDisplayApplication', 'dedicated smart-display root ownership');
requireText(smartDisplayApplication, 'SmartDisplay', 'smart-display runtime rendering');
requireText(
  settingsScreen,
  'MobilePrayerThemeSettings',
  'direct personal display-theme settings ownership',
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

console.log('UI/UX v2 legacy retirement policy passed.');
