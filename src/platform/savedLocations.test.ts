import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import {
  loadSavedLocations,
  parseSavedLocations,
  removeSavedLocation,
  saveSavedLocations,
  savedLocationId,
  upsertSavedLocation,
} from './savedLocations';
import type { KeyValueStorage } from './settingsStorage';

class MemoryStorage implements KeyValueStorage {
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

describe('saved locations', () => {
  const sydney = createCoordinates(-33.8688, 151.2093);

  it('round-trips validated locations through storage', () => {
    const storage = new MemoryStorage();
    const location = {
      id: savedLocationId(sydney),
      label: 'Sydney',
      coordinates: sydney,
      timeZone: 'Australia/Sydney',
    };

    saveSavedLocations(storage, [location]);
    expect(loadSavedLocations(storage)).toEqual([location]);
  });

  it('upserts by stable id and removes without mutating the input list', () => {
    const id = savedLocationId(sydney);
    const original = [{ id, label: 'Home', coordinates: sydney }];
    const updated = upsertSavedLocation(original, {
      id,
      label: 'Sydney home',
      coordinates: sydney,
      timeZone: 'Australia/Sydney',
    });

    expect(updated).toHaveLength(1);
    expect(updated[0]?.label).toBe('Sydney home');
    expect(original[0]?.label).toBe('Home');
    expect(removeSavedLocation(updated, id)).toEqual([]);
  });

  it('rejects duplicate ids and invalid coordinates', () => {
    const id = savedLocationId(sydney);
    expect(() =>
      parseSavedLocations(
        JSON.stringify({
          version: 1,
          locations: [
            { id, label: 'One', coordinates: sydney },
            { id, label: 'Two', coordinates: sydney },
          ],
        }),
      ),
    ).toThrow(/Duplicate/);

    expect(() =>
      parseSavedLocations(
        JSON.stringify({
          version: 1,
          locations: [{ id: 'bad', label: 'Bad', coordinates: { latitude: 200, longitude: 0 } }],
        }),
      ),
    ).toThrow();
  });

  it('rejects coordinate values that would otherwise coerce into numbers', () => {
    for (const coordinates of [
      { latitude: '', longitude: 151.2093 },
      { latitude: null, longitude: 151.2093 },
      { latitude: false, longitude: 151.2093 },
      { latitude: -33.8688, longitude: '151.2093' },
    ]) {
      expect(() =>
        parseSavedLocations(
          JSON.stringify({
            version: 1,
            locations: [{ id: 'bad', label: 'Bad', coordinates }],
          }),
        ),
      ).toThrow(/finite JSON numbers/);
    }
  });

  it('falls back to an empty list when persisted data is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('salahos.savedLocations', '{broken');
    expect(loadSavedLocations(storage)).toEqual([]);
  });
});
