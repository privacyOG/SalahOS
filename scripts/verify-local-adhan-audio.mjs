import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const component = readFileSync(new URL('../src/ui/LocalAdhanAudioSettings.tsx', import.meta.url), 'utf8');
const storage = readFileSync(new URL('../src/platform/localAdhanAudio.ts', import.meta.url), 'utf8');

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
]) {
  if (!component.includes(required)) {
    throw new Error(`Local Adhan audio foreground/lifecycle contract is missing: ${required}`);
  }
}

console.log('Local Adhan audio production boundary passed.');
