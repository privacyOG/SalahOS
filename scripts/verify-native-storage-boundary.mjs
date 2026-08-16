import { readFileSync } from 'node:fs';

const storageSource = readFileSync(
  new URL('../src/platform/applicationStorage.ts', import.meta.url),
  'utf8',
);

for (const required of [
  'Capacitor.isNativePlatform()',
  'preferences: Preferences',
  'private readonly pendingMutations = new Map<string, string | null>();',
  'this.pendingMutations.set(key, value);',
  '// Keep the latest mutation pending so flush() can retry it.',
  'for (const [key, value] of [...this.pendingMutations])',
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
  throw new Error(
    'Native application storage must not special-case Android and leave iOS on Web Storage',
  );
}

const queueStart = storageSource.indexOf('private queueMutation(key: string, value: string | null)');
const queueCatch = storageSource.indexOf('} catch {', queueStart);
const flushStart = storageSource.indexOf('async flush(): Promise<void>');
const retryLoop = storageSource.indexOf(
  'for (const [key, value] of [...this.pendingMutations])',
  flushStart,
);
const retryCatch = storageSource.indexOf('} catch (error) {', retryLoop);
const finalThrow = storageSource.indexOf('throw firstFailure;', retryCatch);
if (
  queueStart < 0 ||
  queueCatch < 0 ||
  flushStart < 0 ||
  retryLoop < 0 ||
  retryCatch < 0 ||
  finalThrow < 0
) {
  throw new Error(
    'Native Preferences writes must keep failed mutations pending, retry all unresolved keys during flush, and report failure only after retry attempts',
  );
}

const migrationStart = storageSource.indexOf('async function migrateLegacyWebStorage(');
const flushIndex = storageSource.indexOf('await storage.flush();', migrationStart);
const removalIndex = storageSource.indexOf('webStorage.removeItem(key);', migrationStart);
if (
  migrationStart < 0 ||
  flushIndex < 0 ||
  removalIndex < 0 ||
  removalIndex < flushIndex
) {
  throw new Error(
    'Legacy Web Storage must be removed only after migrated native Preferences writes flush',
  );
}

const authoritativeCheck = 'if (storage.getItem(key) !== null) continue;';
if (!storageSource.includes(authoritativeCheck)) {
  throw new Error('Existing native Preferences values must remain authoritative during migration');
}

console.log(
  'Native storage boundary passed: every Capacitor native platform uses Preferences, failed writes remain retryable without poisoning later keys, legacy Web Storage migrates only into missing native keys, and legacy removal occurs after persistence flush.',
);
