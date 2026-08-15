import { describe, expect, it } from 'vitest';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import {
  SETTINGS_STORAGE_KEY,
  defaultPersistedSettings,
  exportPersistedSettings,
  importPersistedSettings,
  loadPersistedSettings,
  resetPersistedSettings,
  savePersistedSettings,
} from './settingsStorage';
import type { KeyValueStorage, PersistedSettings } from './settingsStorage';

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

const mosqueTimetable: MosqueTimetable = {
  mosqueName: 'Example Mosque',
  days: [
    {
      date: '2026-08-16',
      prayers: {
        fajr: { startLocalMinutes: 320, iqamah: { kind: 'offset', offsetMinutes: 20 } },
        dhuhr: { startLocalMinutes: 730, iqamah: { kind: 'fixed', localMinutes: 750 } },
      },
    },
  ],
};

function configuredSettings(): PersistedSettings {
  return {
    ...defaultPersistedSettings,
    locale: 'ar',
    theme: 'dark',
    timeFormat: 'h12',
    calculationMethodId: 'umm-al-qura',
    asrConvention: 'hanafi',
    highLatitudeRule: 'one-seventh',
    hijriCorrectionDays: 1,
    prayerAdjustments: { fajr: 2, isha: -3 },
    prayerSourceMode: 'local-mosque',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable,
  };
}

describe('versioned settings persistence', () => {
  it('round-trips the complete supported configuration', () => {
    const storage = new MemoryStorage();
    const settings = configuredSettings();

    savePersistedSettings(storage, settings);
    expect(loadPersistedSettings(storage)).toEqual(settings);
    expect(storage.values.has(SETTINGS_STORAGE_KEY)).toBe(true);
  });

  it('exports and imports a validated settings payload', () => {
    const settings = configuredSettings();
    const exported = exportPersistedSettings(settings);

    expect(importPersistedSettings(exported)).toEqual(settings);
  });

  it('migrates the legacy unversioned locale and coordinate shape', () => {
    const migrated = importPersistedSettings(
      JSON.stringify({
        locale: 'ar',
        coordinates: { latitude: 21.4225, longitude: 39.8262 },
        timeZone: 'Asia/Riyadh',
      }),
    );

    expect(migrated.version).toBe(1);
    expect(migrated.locale).toBe('ar');
    expect(migrated.location).toEqual({
      coordinates: { latitude: 21.4225, longitude: 39.8262 },
      timeZone: 'Asia/Riyadh',
    });
    expect(migrated.calculationMethodId).toBe('muslim-world-league');
  });

  it('rejects unsupported future schema versions', () => {
    expect(() => importPersistedSettings('{"version":99}')).toThrow(RangeError);
  });

  it('drops invalid nested location and mosque data instead of activating it', () => {
    const settings = importPersistedSettings(
      JSON.stringify({
        version: 1,
        location: { coordinates: { latitude: 200, longitude: 20 } },
        mosqueTimetable: { mosqueName: '', days: [] },
      }),
    );

    expect(settings.location).toBeNull();
    expect(settings.mosqueTimetable).toBeNull();
  });

  it('falls back to defaults for corrupt stored data and supports reset', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, '{broken');

    expect(loadPersistedSettings(storage)).toEqual(defaultPersistedSettings);

    savePersistedSettings(storage, configuredSettings());
    resetPersistedSettings(storage);
    expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });
});
