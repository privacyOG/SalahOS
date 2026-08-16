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
    notifications: {
      ...defaultPersistedSettings.notifications,
      fajr: {
        enabled: true,
        reminderMinutes: 15,
        prayerTimeNotification: true,
        sound: 'default',
        vibration: true,
        adhanEnabled: true,
      },
      maghrib: {
        enabled: true,
        reminderMinutes: null,
        prayerTimeNotification: true,
        sound: 'silent',
        vibration: false,
        adhanEnabled: false,
      },
    },
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

    expect(migrated.version).toBe(2);
    expect(migrated.locale).toBe('ar');
    expect(migrated.location).toEqual({
      coordinates: { latitude: 21.4225, longitude: 39.8262 },
      timeZone: 'Asia/Riyadh',
    });
    expect(migrated.calculationMethodId).toBe('muslim-world-league');
    expect(migrated.notifications).toEqual(defaultPersistedSettings.notifications);
  });

  it('migrates version 1 settings without losing existing configuration', () => {
    const migrated = importPersistedSettings(
      JSON.stringify({
        version: 1,
        locale: 'ar',
        theme: 'dark',
        timeFormat: 'h12',
        calculationMethodId: 'umm-al-qura',
        asrConvention: 'hanafi',
        highLatitudeRule: 'one-seventh',
        hijriCorrectionDays: 1,
        prayerAdjustments: { fajr: 2 },
        prayerSourceMode: 'calculated-adjustments',
        location: {
          coordinates: { latitude: -33.8688, longitude: 151.2093 },
          timeZone: 'Australia/Sydney',
        },
        mosqueTimetable: null,
      }),
    );

    expect(migrated.version).toBe(2);
    expect(migrated.locale).toBe('ar');
    expect(migrated.theme).toBe('dark');
    expect(migrated.calculationMethodId).toBe('umm-al-qura');
    expect(migrated.prayerAdjustments).toEqual({ fajr: 2 });
    expect(migrated.location?.timeZone).toBe('Australia/Sydney');
    expect(migrated.notifications).toEqual(defaultPersistedSettings.notifications);
  });

  it('keeps only bounded integer-minute prayer adjustments on import', () => {
    const imported = importPersistedSettings(
      JSON.stringify({
        version: 2,
        prayerAdjustments: {
          fajr: 2,
          sunrise: 1.5,
          dhuhr: -180,
          asr: 181,
          maghrib: '3',
          isha: -4,
        },
      }),
    );

    expect(imported.prayerAdjustments).toEqual({ fajr: 2, dhuhr: -180, isha: -4 });
  });

  it('does not coerce non-number coordinate values into a persisted location', () => {
    for (const coordinates of [
      { latitude: '', longitude: 151.2093 },
      { latitude: null, longitude: 151.2093 },
      { latitude: false, longitude: 151.2093 },
      { latitude: -33.8688, longitude: '151.2093' },
    ]) {
      const imported = importPersistedSettings(
        JSON.stringify({ version: 2, location: { coordinates } }),
      );
      expect(imported.location).toBeNull();
    }
  });

  it('rejects unsupported future schema versions', () => {
    expect(() => importPersistedSettings('{"version":99}')).toThrow(RangeError);
  });

  it('rejects invalid notification reminder data', () => {
    expect(() =>
      importPersistedSettings(
        JSON.stringify({
          version: 2,
          notifications: { fajr: { enabled: true, reminderMinutes: 999 } },
        }),
      ),
    ).toThrow(RangeError);
  });

  it('drops invalid nested location and mosque data instead of activating it', () => {
    const settings = importPersistedSettings(
      JSON.stringify({
        version: 2,
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
