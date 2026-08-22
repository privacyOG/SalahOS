import { describe, expect, it } from 'vitest';

import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import {
  loadManagedPrayerBoardCache,
  reconcileManagedPrayerBoardRevision,
  saveManagedPrayerBoardCache,
} from './managedPrayerBoardCache';

class MemoryStorage {
  readonly values = new Map<string, string>();

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

const config = parsePrayerBoardTemplateConfig({
  version: 1,
  templateId: 'minimal-modern',
  primaryLocale: 'en',
  timeFormat: 'h23',
  accentPreset: 'neutral',
});

describe('managed prayer-board last-known-good cache', () => {
  it('round-trips a validated revisioned configuration', () => {
    const storage = new MemoryStorage();
    saveManagedPrayerBoardCache(storage, {
      displayId: 'display:lobby',
      contentRevision: 7,
      config,
      cachedAt: '2026-08-22T00:00:00.000Z',
    });

    expect(loadManagedPrayerBoardCache(storage)).toEqual({
      version: 1,
      displayId: 'display:lobby',
      contentRevision: 7,
      config,
      cachedAt: '2026-08-22T00:00:00.000Z',
    });
  });

  it('fails closed for corrupt cache records', () => {
    const storage = new MemoryStorage();
    storage.setItem('salahos.managedPrayerBoardCache', '{"version":99}');
    expect(loadManagedPrayerBoardCache(storage)).toBeNull();
  });

  it('applies only newer remote revisions and keeps a newer local cache', () => {
    const local = {
      version: 1 as const,
      displayId: 'display:lobby',
      contentRevision: 7,
      config,
      cachedAt: '2026-08-22T00:00:00.000Z',
    };

    expect(reconcileManagedPrayerBoardRevision(local, 8, config)).toBe('apply-remote');
    expect(reconcileManagedPrayerBoardRevision(local, 6, config)).toBe('keep-local');
    expect(reconcileManagedPrayerBoardRevision(null, 0, config)).toBe('apply-remote');
  });

  it('reports same-revision configuration conflicts instead of replacing known-good data', () => {
    const local = {
      version: 1 as const,
      displayId: 'display:lobby',
      contentRevision: 7,
      config,
      cachedAt: '2026-08-22T00:00:00.000Z',
    };
    const conflicting = parsePrayerBoardTemplateConfig({
      ...config,
      templateId: 'heritage-classic',
    });

    expect(reconcileManagedPrayerBoardRevision(local, 7, config)).toBe('keep-local');
    expect(reconcileManagedPrayerBoardRevision(local, 7, conflicting)).toBe('report-conflict');
  });
});
