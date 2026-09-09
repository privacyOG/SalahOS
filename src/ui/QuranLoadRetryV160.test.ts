import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const reader = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');
const loader = readFileSync(new URL('../domain/quranOfflineLibrary.ts', import.meta.url), 'utf8');

describe('V1.6.0 Qur’an load recovery', () => {
  it('offers an explicit retry action and returns to loading without mutating reading preferences', () => {
    expect(reader).toContain('data-quran-load-error');
    expect(reader).toContain('data-quran-load-retry');
    expect(reader).toContain('setLoadError(false)');
    expect(reader).toContain('setLoadAttempt((current) => current + 1)');
    expect(reader).toContain('}, [loadAttempt]);');
    const retryBlock = reader.slice(
      reader.indexOf('data-quran-load-retry'),
      reader.indexOf('{labels.retry}', reader.indexOf('data-quran-load-retry')),
    );
    expect(retryBlock).not.toContain('onPreferencesChange');
  });

  it('keeps the rejected-promise cache self-healing while applying reader-only Bismillah normalization', () => {
    expect(loader).toContain('if (cachedPackPromise === request) cachedPackPromise = null;');
    expect(loader).toContain(
      'Packaged offline Qur’an could not be loaded (HTTP ${String(response.status)}).',
    );
    expect(loader).toContain('prepareQuranReaderPack(validateQuranOfflinePack(await response.json()))');
    expect(loader).toContain('Canonical packaged bytes and their integrity hash remain unchanged.');
  });
});
