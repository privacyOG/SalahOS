import { describe, expect, it } from 'vitest';
import { buildPrayerDashboard } from '../domain/dashboard';
import { calculationMethods } from '../domain/methods';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  savePersistedSettings,
} from '../platform/settingsStorage';
import type { KeyValueStorage, PersistedSettings } from '../platform/settingsStorage';

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

const instant = new Date('2026-08-16T02:00:00.000Z');
const location = {
  coordinates: { latitude: -33.8688, longitude: 151.2093 },
  timeZone: 'Australia/Sydney',
} as const;

function dashboardFromSettings(settings: PersistedSettings) {
  if (settings.location === null) {
    throw new Error('Expected persisted location for recalculation integration test');
  }

  return buildPrayerDashboard({
    instant,
    coordinates: settings.location.coordinates,
    method: calculationMethods[settings.calculationMethodId],
    asrConvention: settings.asrConvention,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.prayerAdjustments,
    hijriCorrectionDays: settings.hijriCorrectionDays,
  });
}

describe('settings to prayer recalculation flow', () => {
  it('recomputes the dashboard after persisted calculation settings change', () => {
    const storage = new MemoryStorage();
    const initialSettings: PersistedSettings = {
      ...defaultPersistedSettings,
      location,
    };

    savePersistedSettings(storage, initialSettings);
    const initialDashboard = dashboardFromSettings(loadPersistedSettings(storage));
    const initialAsr = initialDashboard.prayers.find((prayer) => prayer.name === 'asr');
    const initialFajr = initialDashboard.prayers.find((prayer) => prayer.name === 'fajr');

    const updatedSettings: PersistedSettings = {
      ...initialSettings,
      calculationMethodId: 'umm-al-qura',
      asrConvention: 'hanafi',
      highLatitudeRule: 'one-seventh',
      hijriCorrectionDays: 1,
      prayerAdjustments: { fajr: 7 },
    };

    savePersistedSettings(storage, updatedSettings);
    const reloadedSettings = loadPersistedSettings(storage);
    const recalculatedDashboard = dashboardFromSettings(reloadedSettings);
    const recalculatedAsr = recalculatedDashboard.prayers.find((prayer) => prayer.name === 'asr');
    const recalculatedFajr = recalculatedDashboard.prayers.find((prayer) => prayer.name === 'fajr');

    expect(reloadedSettings.calculationMethodId).toBe('umm-al-qura');
    expect(recalculatedDashboard.method.id).toBe('umm-al-qura');
    expect(recalculatedDashboard.asrConvention).toBe('hanafi');
    expect(recalculatedDashboard.highLatitudeRule).toBe('one-seventh');
    expect(recalculatedDashboard.hijri.correctionDays).toBe(1);
    expect(recalculatedFajr?.manualAdjustmentMinutes).toBe(7);
    expect(recalculatedDashboard.hasManualAdjustments).toBe(true);

    expect(initialAsr?.displayLocalMinutes).not.toBe(recalculatedAsr?.displayLocalMinutes);
    expect(initialFajr?.displayLocalMinutes).not.toBe(recalculatedFajr?.displayLocalMinutes);
  });
});
