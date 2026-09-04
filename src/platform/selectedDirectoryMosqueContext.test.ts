import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from './settingsStorage';
import {
  loadSelectedDirectoryMosqueContext,
  parseSelectedDirectoryMosqueContext,
  saveSelectedDirectoryMosqueContext,
  SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION,
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
  it('round-trips the lightweight selected-mosque prayer and Jumuah context as schema v2', () => {
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
      jumuahTimes: [{ time: '1:15 pm', label: "Jumu'ah 1" }, { time: '2:00 pm' }],
    });

    const raw = storage.getItem(SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({
      version: SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION,
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
      jumuahTimes: [{ time: '1:15 pm', label: "Jumu'ah 1" }, { time: '2:00 pm' }],
    });
  });

  it('migrates schema-v1 reads with an empty Jumuah list', () => {
    expect(
      parseSelectedDirectoryMosqueContext(
        JSON.stringify({
          version: 1,
          mosqueId: 'legacy-mosque',
          mosqueName: 'Legacy Mosque',
          coordinates: { latitude: -33.87, longitude: 151.21 },
          timeZone: 'Australia/Sydney',
          prayerTimes: null,
        }),
      ),
    ).toEqual({
      mosqueId: 'legacy-mosque',
      mosqueName: 'Legacy Mosque',
      coordinates: { latitude: -33.87, longitude: 151.21 },
      timeZone: 'Australia/Sydney',
      prayerTimes: null,
      jumuahTimes: [],
    });
  });

  it('fails closed for malformed persisted context', () => {
    const storage = memoryStorage();
    storage.setItem(
      SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        version: SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION,
        mosqueId: 'bad',
        mosqueName: 'Bad fixture',
        coordinates: { latitude: 999, longitude: 151.2 },
        timeZone: 'Australia/Sydney',
        prayerTimes: null,
        jumuahTimes: [],
      }),
    );
    expect(loadSelectedDirectoryMosqueContext(storage)).toBeNull();
  });

  it('rejects malformed v2 Jumuah entries rather than inventing data', () => {
    expect(() =>
      parseSelectedDirectoryMosqueContext(
        JSON.stringify({
          version: SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION,
          mosqueId: 'bad-jumuah',
          mosqueName: 'Bad Jumuah fixture',
          coordinates: { latitude: -33.87, longitude: 151.21 },
          timeZone: 'Australia/Sydney',
          prayerTimes: null,
          jumuahTimes: [{ label: 'Missing time' }],
        }),
      ),
    ).toThrow(/Jumuah time/u);
  });

  it('rejects unsupported schema versions', () => {
    expect(() =>
      parseSelectedDirectoryMosqueContext(
        JSON.stringify({ version: 99, mosqueId: 'x', mosqueName: 'x' }),
      ),
    ).toThrow(/schema version/u);
  });
});
