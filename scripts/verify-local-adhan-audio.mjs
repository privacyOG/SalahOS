import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const component = readFileSync(new URL('../src/ui/LocalAdhanAudioSettings.tsx', import.meta.url), 'utf8');
const componentStyles = readFileSync(
  new URL('../src/ui/LocalAdhanAudioSettings.css', import.meta.url),
  'utf8',
);
const storage = readFileSync(new URL('../src/platform/localAdhanAudio.ts', import.meta.url), 'utf8');
const translations = readFileSync(new URL('../src/i18n/translations.ts', import.meta.url), 'utf8');

for (const required of [
  "import { LocalAdhanAudioSettings } from './ui/LocalAdhanAudioSettings';",
  '<LocalAdhanAudioSettings',
  'date={sourcedDashboard?.base.today.date ?? null}',
  'localMinutes={sourcedDashboard?.base.clock.localMinutes ?? null}',
  'prayers={sourcedDashboard?.prayers ?? []}',
  'notifications={settings.notifications}',
]) {
  if (!app.includes(required)) {
    throw new Error(`Local Adhan audio production wiring is missing: ${required}`);
  }
}

for (const required of [
  "const DATABASE_NAME = 'salahos-local-media';",
  "const STORE_NAME = 'adhan-audio';",
  "const SELECTED_AUDIO_KEY = 'selected';",
  '25 * 1024 * 1024',
  "startsWith('audio/')",
  "typeof indexedDB === 'undefined'",
  'transaction.oncomplete',
  'transaction.onabort',
]) {
  if (!storage.includes(required)) {
    throw new Error(`Local Adhan audio storage contract is missing: ${required}`);
  }
}

if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/.test(storage)) {
  throw new Error('Local Adhan audio storage must not contain a network/upload path');
}
if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/.test(component)) {
  throw new Error('Local Adhan audio settings must not contain a network/upload path');
}

for (const required of [
  "document.visibilityState !== 'visible'",
  'foregroundAdhanPlaybackKey',
  'URL.createObjectURL',
  'URL.revokeObjectURL',
  'accept="audio/*"',
  "import { translate } from '../i18n/i18n';",
  "import './LocalAdhanAudioSettings.css';",
  "translate(locale, 'localAdhanTitle')",
  "translate(locale, 'localAdhanHelp')",
]) {
  if (!component.includes(required)) {
    throw new Error(`Local Adhan audio foreground/presentation contract is missing: ${required}`);
  }
}

for (const required of [
  'localAdhanTitle:',
  'localAdhanChoose:',
  'localAdhanPreview:',
  'localAdhanRemove:',
  'localAdhanNone:',
  'localAdhanHelp:',
  'localAdhanInvalid:',
  'localAdhanUnavailable:',
  'localAdhanBlocked:',
]) {
  const matches = translations.match(new RegExp(required.replace(':', '\\s*:'), 'g')) ?? [];
  if (matches.length !== 2) {
    throw new Error(`Local Adhan translation key must exist in both locales: ${required}`);
  }
}

for (const required of [
  '.local-adhan-audio',
  '.local-adhan-audio-selection',
  '.local-adhan-audio .button-row',
  '@media (max-width: 520px)',
]) {
  if (!componentStyles.includes(required)) {
    throw new Error(`Local Adhan responsive styling is missing: ${required}`);
  }
}

console.log('Local Adhan audio production boundary passed.');
