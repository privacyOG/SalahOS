import { describe, expect, it } from 'vitest';

import {
  clearManagedThemeRevisionHistory,
  listManagedThemeRevisions,
  recordManagedThemeRevision,
} from './managedThemeRevisionStore';
import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function config(templateId: 'heritage-classic' | 'minimal-modern' | 'scenic-spiritual') {
  return parsePrayerBoardTemplateConfig({
    version: 1,
    templateId,
    primaryLocale: 'en',
    timeFormat: 'h23',
    accentPreset: 'emerald',
    branding: { mosqueName: { en: 'Revision Masjid' }, logo: null },
  });
}

describe('managed theme revision history', () => {
  it('stores validated snapshots by scope and target in descending revision order', () => {
    const storage = memoryStorage();
    recordManagedThemeRevision(storage, {
      scope: 'mosque-default',
      targetId: 'mosque:example',
      revision: 2,
      prayerBoardConfig: config('minimal-modern'),
      observedAt: '2026-08-23T05:00:00.000Z',
    });
    recordManagedThemeRevision(storage, {
      scope: 'mosque-default',
      targetId: 'mosque:example',
      revision: 3,
      prayerBoardConfig: config('scenic-spiritual'),
      observedAt: '2026-08-23T06:00:00.000Z',
    });
    recordManagedThemeRevision(storage, {
      scope: 'display-override',
      targetId: 'display:lobby',
      revision: 7,
      prayerBoardConfig: config('heritage-classic'),
      observedAt: '2026-08-23T06:05:00.000Z',
    });

    expect(listManagedThemeRevisions(storage, 'mosque-default', 'mosque:example')).toMatchObject([
      { revision: 3, prayerBoardConfig: { templateId: 'scenic-spiritual' } },
      { revision: 2, prayerBoardConfig: { templateId: 'minimal-modern' } },
    ]);
    expect(listManagedThemeRevisions(storage, 'display-override', 'display:lobby')).toHaveLength(1);
  });

  it('replaces an observed duplicate revision and bounds history per target', () => {
    const storage = memoryStorage();
    for (let revision = 0; revision < 15; revision += 1) {
      recordManagedThemeRevision(storage, {
        scope: 'display-override',
        targetId: 'display:hall',
        revision,
        prayerBoardConfig: config(revision % 2 === 0 ? 'heritage-classic' : 'minimal-modern'),
        observedAt: `2026-08-23T06:${String(revision).padStart(2, '0')}:00.000Z`,
      });
    }
    recordManagedThemeRevision(storage, {
      scope: 'display-override',
      targetId: 'display:hall',
      revision: 14,
      prayerBoardConfig: config('scenic-spiritual'),
      observedAt: '2026-08-23T07:00:00.000Z',
    });

    const revisions = listManagedThemeRevisions(storage, 'display-override', 'display:hall');
    expect(revisions).toHaveLength(12);
    expect(revisions[0]).toMatchObject({
      revision: 14,
      prayerBoardConfig: { templateId: 'scenic-spiritual' },
      observedAt: '2026-08-23T07:00:00.000Z',
    });
    expect(revisions.at(-1)?.revision).toBe(3);
  });

  it('fails closed on corrupt persisted data and can clear history', () => {
    const storage = memoryStorage();
    storage.setItem('salahos.managedThemeRevisionHistory.v1', '{not-json');
    expect(listManagedThemeRevisions(storage, 'mosque-default', 'mosque:example')).toEqual([]);

    recordManagedThemeRevision(storage, {
      scope: 'mosque-default',
      targetId: 'mosque:example',
      revision: 1,
      prayerBoardConfig: config('minimal-modern'),
      observedAt: '2026-08-23T05:00:00.000Z',
    });
    clearManagedThemeRevisionHistory(storage);
    expect(listManagedThemeRevisions(storage, 'mosque-default', 'mosque:example')).toEqual([]);
  });
});
