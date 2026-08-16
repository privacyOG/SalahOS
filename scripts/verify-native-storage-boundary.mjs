import { readFileSync } from 'node:fs';

const storageSource = readFileSync(
  new URL('../src/platform/applicationStorage.ts', import.meta.url),
  'utf8',
);

for (const required of [
  'Capacitor.isNativePlatform()',
  'preferences: Preferences',
  'async function migrateLegacyWebStorage(',
  'await migrateLegacyWebStorage(webStorage, storage);',
  'await storage.flush();',
  'webStorage.removeItem(key);',
]) {
  if (!storageSource.includes(required)) {
    throw new Error(`Native storage boundary is missing required contract: ${required}`);
  }
}

if (/getPlatform\(\)\s*!==\s*['"]android['"]/.test(storageSource)) {
  throw new Error('Native application storage must not special-case Android and leave iOS on Web Storage');
}

const migrationStart = storageSource.indexOf('async function migrateLegacyWebStorage(');
const flushIndex = storageSource.indexOf('await storage.flush();', migrationStart);
const removalIndex = storageSource.indexOf('webStorage.removeItem(key);', migrationStart);
if (migrationStart < 0 || flushIndex < 0 || removalIndex < 0 || removalIndex < flushIndex) {
  throw new Error('Legacy Web Storage must be removed only after migrated native Preferences writes flush');
}

const authoritativeCheck = 'if (storage.getItem(key) !== null) continue;';
if (!storageSource.includes(authoritativeCheck)) {
  throw new Error('Existing native Preferences values must remain authoritative during migration');
}

console.log(
  'Native storage boundary passed: every Capacitor native platform uses Preferences, legacy Web Storage migrates only into missing native keys, and legacy removal occurs after persistence flush.',
);
