import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from './settingsStorage';
import {
  RAMADAN_PRESENTATION_STORAGE_KEY,
  defaultRamadanPresentationPreferences,
  loadRamadanPresentationPreferences,
  parseRamadanPresentationPreferences,
  saveRamadanPresentationPreferences,
} from './ramadanPresentationPreferences';

class MemoryStorage implements KeyValueStorage {
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

describe('Ramadan presentation preferences', () => {
  it('defaults to no extra Imsak cutoff', () => {
    expect(loadRamadanPresentationPreferences(new MemoryStorage())).toEqual(
      defaultRamadanPresentationPreferences,
    );
  });

  it('round-trips an explicit Imsak display offset', () => {
    const storage = new MemoryStorage();
    const preferences = {
      version: 1 as const,
      imsakMinutesBeforeFajr: 10,
    };

    saveRamadanPresentationPreferences(storage, preferences);
    expect(loadRamadanPresentationPreferences(storage)).toEqual(preferences);
    expect(storage.values.has(RAMADAN_PRESENTATION_STORAGE_KEY)).toBe(true);
  });

  it.each([0, 5, 30, 240])('accepts %s minutes before Fajr', (offset) => {
    expect(
      parseRamadanPresentationPreferences(
        JSON.stringify({ version: 1, imsakMinutesBeforeFajr: offset }),
      ).imsakMinutesBeforeFajr,
    ).toBe(offset);
  });

  it.each([-1, 241, 10.5])('rejects invalid Imsak offset %s', (offset) => {
    expect(() =>
      parseRamadanPresentationPreferences(
        JSON.stringify({ version: 1, imsakMinutesBeforeFajr: offset }),
      ),
    ).toThrow(RangeError);
  });

  it('falls back safely for corrupt or future preference data', () => {
    const storage = new MemoryStorage();
    storage.setItem(RAMADAN_PRESENTATION_STORAGE_KEY, '{broken');
    expect(loadRamadanPresentationPreferences(storage)).toEqual(
      defaultRamadanPresentationPreferences,
    );

    storage.setItem(
      RAMADAN_PRESENTATION_STORAGE_KEY,
      JSON.stringify({ version: 99, imsakMinutesBeforeFajr: 10 }),
    );
    expect(loadRamadanPresentationPreferences(storage)).toEqual(
      defaultRamadanPresentationPreferences,
    );
  });
});
