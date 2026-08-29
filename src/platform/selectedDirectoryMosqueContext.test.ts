import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from './settingsStorage';
import {
  loadSelectedDirectoryMosqueContext,
  parseSelectedDirectoryMosqueContext,
  saveSelectedDirectoryMosqueContext,
  SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY,
} from './selectedDirectoryMosqueContext';

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('selected Australian directory mosque context', () => {
  it('round-trips only the lightweight selected-mosque prayer context', () => {
    const storage = memoryStorage();
    saveSelectedDirectoryMosqueContext(storage, {
      mosqueId: 'mosque-finder:sydney-cbd-erskine-musallah',
      mosqueName: 'Sydney CBD - Erskine Musallah',
      coordinates: { latitude: -33.86665, longitude: 151.204 },
      timeZone: 'Australia/Sydney',
      prayerTimes: {
        dhuhr: '12:15 pm / 1:15 pm',
        sourceLabel: 'Australian Mosque Finder',
      },
    });

    expect(loadSelectedDirectoryMosqueContext(storage)).toEqual({
      mosqueId: 'mosque-finder:sydney-cbd-erskine-musallah',
      mosqueName: 'Sydney CBD - Erskine Musallah',
      coordinates: { latitude: -33.86665, longitude: 151.204 },
      timeZone: 'Australia/Sydney',
      prayerTimes: {
        dhuhr: '12:15 pm / 1:15 pm',
        sourceLabel: 'Australian Mosque Finder',
      },
    });
  });

  it('fails closed for malformed persisted context', () => {
    const storage = memoryStorage();
    storage.setItem(
      SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        mosqueId: 'bad',
        mosqueName: 'Bad fixture',
        coordinates: { latitude: 999, longitude: 151.2 },
        timeZone: 'Australia/Sydney',
        prayerTimes: null,
      }),
    );
    expect(loadSelectedDirectoryMosqueContext(storage)).toBeNull();
  });

  it('rejects unsupported schema versions', () => {
    expect(() =>
      parseSelectedDirectoryMosqueContext(
        JSON.stringify({ version: 99, mosqueId: 'x', mosqueName: 'x' }),
      ),
    ).toThrow(/schema version/u);
  });
});
