import { describe, expect, it } from 'vitest';

import {
  clearPrivacyDiagnostics,
  collectCurrentPerformanceDiagnostics,
  exportPrivacyDiagnostics,
  loadPrivacyDiagnosticsState,
  PRIVACY_DIAGNOSTICS_STORAGE_KEY,
  recordCrashDiagnostic,
  setPrivacyDiagnosticsEnabled,
} from './privacyDiagnostics';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function performanceSource(
  navigationDuration = 1432.6,
  firstContentfulPaint = 522.4,
): Readonly<{
  getEntriesByType(type: string): readonly PerformanceEntry[];
  getEntriesByName(name: string): readonly PerformanceEntry[];
}> {
  return {
    getEntriesByType(type) {
      return type === 'navigation'
        ? ([{ duration: navigationDuration, startTime: 0 }] as PerformanceEntry[])
        : [];
    },
    getEntriesByName(name) {
      return name === 'first-contentful-paint'
        ? ([{ duration: 0, startTime: firstContentfulPaint }] as PerformanceEntry[])
        : [];
    },
  };
}

describe('privacy diagnostics', () => {
  it('is disabled by default and records nothing until explicitly enabled', () => {
    const storage = new MemoryStorage();

    expect(loadPrivacyDiagnosticsState(storage)).toEqual({ version: 1, enabled: false, events: [] });
    recordCrashDiagnostic(storage, 'window-error', new Error('boom'));
    collectCurrentPerformanceDiagnostics(storage, performanceSource());

    expect(storage.getItem(PRIVACY_DIAGNOSTICS_STORAGE_KEY)).toBeNull();
    expect(loadPrivacyDiagnosticsState(storage).events).toEqual([]);
  });

  it('stores crash fingerprints without raw messages, stacks, URLs or coordinates', () => {
    const storage = new MemoryStorage();
    setPrivacyDiagnosticsEnabled(storage, true);
    const error = new TypeError(
      'Failed near https://example.test/?latitude=-33.8688&longitude=151.2093 secret-message',
    );
    error.stack =
      'TypeError: secret-message at https://example.test/app.js?latitude=-33.8688&longitude=151.2093:10:2';

    recordCrashDiagnostic(storage, 'window-error', error, new Date('2026-08-25T12:00:00.000Z'));

    const serialized = storage.getItem(PRIVACY_DIAGNOSTICS_STORAGE_KEY) ?? '';
    expect(serialized).not.toContain('secret-message');
    expect(serialized).not.toContain('example.test');
    expect(serialized).not.toContain('-33.8688');
    expect(serialized).not.toContain('151.2093');
    expect(loadPrivacyDiagnosticsState(storage).events[0]).toMatchObject({
      kind: 'crash',
      source: 'window-error',
      errorClass: 'TypeError',
      occurredAtIso: '2026-08-25T12:00:00.000Z',
    });
  });

  it('stores only coarse performance timing values when enabled', () => {
    const storage = new MemoryStorage();
    setPrivacyDiagnosticsEnabled(storage, true);

    collectCurrentPerformanceDiagnostics(
      storage,
      performanceSource(),
      new Date('2026-08-25T12:01:00.000Z'),
    );

    expect(loadPrivacyDiagnosticsState(storage).events).toEqual([
      {
        kind: 'performance',
        occurredAtIso: '2026-08-25T12:01:00.000Z',
        navigationDurationMs: 1433,
        firstContentfulPaintMs: 522,
      },
    ]);
  });

  it('bounds the local event buffer and preserves explicit enablement state', () => {
    const storage = new MemoryStorage();
    setPrivacyDiagnosticsEnabled(storage, true);

    for (let index = 0; index < 45; index += 1) {
      recordCrashDiagnostic(
        storage,
        'unhandled-rejection',
        new Error(`failure-${String(index)}`),
        new Date(1_787_650_000_000 + index * 1000),
      );
    }

    const state = loadPrivacyDiagnosticsState(storage);
    expect(state.enabled).toBe(true);
    expect(state.events).toHaveLength(40);

    setPrivacyDiagnosticsEnabled(storage, false);
    recordCrashDiagnostic(storage, 'window-error', new Error('not-recorded'));
    expect(loadPrivacyDiagnosticsState(storage).events).toHaveLength(40);
  });

  it('exports an explicit privacy contract and never marks diagnostics for automatic upload', () => {
    const storage = new MemoryStorage();
    setPrivacyDiagnosticsEnabled(storage, true);
    recordCrashDiagnostic(storage, 'window-error', new Error('private raw text'));

    const exported = exportPrivacyDiagnostics(storage, new Date('2026-08-25T12:02:00.000Z'));
    expect(exported).toContain('"preciseLocationIncluded": false');
    expect(exported).toContain('"urlsIncluded": false');
    expect(exported).toContain('"rawErrorMessagesIncluded": false');
    expect(exported).toContain('"rawStacksIncluded": false');
    expect(exported).toContain('"automaticUpload": false');
    expect(exported).not.toContain('private raw text');
  });

  it('clears retained events without silently changing the user preference', () => {
    const storage = new MemoryStorage();
    setPrivacyDiagnosticsEnabled(storage, true);
    recordCrashDiagnostic(storage, 'window-error', new Error('boom'));

    expect(clearPrivacyDiagnostics(storage)).toEqual({ version: 1, enabled: true, events: [] });
  });
});
