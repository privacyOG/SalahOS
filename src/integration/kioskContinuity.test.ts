import { describe, expect, it, vi } from 'vitest';
import { buildPrayerDashboard } from '../domain/dashboard';
import { calculationMethods } from '../domain/methods';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  savePersistedSettings,
} from '../platform/settingsStorage';
import type { KeyValueStorage, PersistedSettings } from '../platform/settingsStorage';
import { createSystemSleepWakeDetector } from '../platform/systemSleepWake';

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

const configuredSettings: PersistedSettings = {
  ...defaultPersistedSettings,
  locale: 'ar',
  calculationMethodId: 'umm-al-qura',
  asrConvention: 'standard',
  highLatitudeRule: 'angle-based',
  hijriCorrectionDays: 1,
  timeFormat: 'h23',
  prayerAdjustments: { fajr: 2, isha: -1 },
  location: {
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    timeZone: 'Australia/Sydney',
  },
};

function dashboardFromRestoredSettings(settings: PersistedSettings, instant: Date) {
  if (settings.location === null) {
    throw new Error('Expected persisted kiosk location');
  }
  if (settings.location.timeZone === undefined) {
    throw new Error('Expected persisted kiosk timezone');
  }

  return buildPrayerDashboard({
    instant,
    coordinates: settings.location.coordinates,
    timeZone: settings.location.timeZone,
    method: calculationMethods[settings.calculationMethodId],
    asrConvention: settings.asrConvention,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.prayerAdjustments,
    hijriCorrectionDays: settings.hijriCorrectionDays,
  });
}

describe('Raspberry Pi and kiosk continuity lifecycle', () => {
  it('restores settings and remains fully calculable when the network is unavailable', () => {
    const storage = new MemoryStorage();
    savePersistedSettings(storage, configuredSettings);
    const fetchSpy = vi.fn(() => Promise.reject(new Error('Network unavailable')));
    vi.stubGlobal('fetch', fetchSpy);

    try {
      const restored = loadPersistedSettings(storage);
      const dashboard = dashboardFromRestoredSettings(
        restored,
        new Date('2026-08-16T02:00:00.000Z'),
      );

      expect(restored).toEqual(configuredSettings);
      expect(dashboard.timeZone).toBe('Australia/Sydney');
      expect(dashboard.today.date).toBe('2026-08-16');
      expect(dashboard.method.id).toBe('umm-al-qura');
      expect(dashboard.hijri.correctionDays).toBe(1);
      expect(dashboard.prayers).toHaveLength(6);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('recomputes from fresh wall time after a long suspend-style gap', () => {
    const storage = new MemoryStorage();
    savePersistedSettings(storage, configuredSettings);
    const restored = loadPersistedSettings(storage);
    const before = new Date('2026-08-16T02:00:00.000Z');
    const resumed = new Date('2026-08-16T04:30:00.000Z');
    const detector = createSystemSleepWakeDetector({ wallTimeMs: before.getTime() });

    expect(detector.sample({ wallTimeMs: before.getTime() + 1_000 })).toBe(false);
    expect(detector.sample({ wallTimeMs: resumed.getTime() })).toBe(true);

    const beforeDashboard = dashboardFromRestoredSettings(restored, before);
    const resumedDashboard = dashboardFromRestoredSettings(restored, resumed);

    expect(resumedDashboard.generatedAt.getTime()).toBe(resumed.getTime());
    expect(resumedDashboard.nextPrayer).not.toEqual(beforeDashboard.nextPrayer);
  });

  it('cold-restarts onto the new local day instead of retaining yesterday schedule', () => {
    const storage = new MemoryStorage();
    savePersistedSettings(storage, configuredSettings);

    const beforeRestart = loadPersistedSettings(storage);
    const beforeDashboard = dashboardFromRestoredSettings(
      beforeRestart,
      new Date('2026-08-16T13:59:30.000Z'),
    );

    const afterRestart = loadPersistedSettings(storage);
    const afterDashboard = dashboardFromRestoredSettings(
      afterRestart,
      new Date('2026-08-16T14:00:30.000Z'),
    );

    expect(beforeDashboard.today.date).toBe('2026-08-16');
    expect(afterDashboard.today.date).toBe('2026-08-17');
    expect(afterDashboard.generatedAt.getTime()).toBe(
      new Date('2026-08-16T14:00:30.000Z').getTime(),
    );
    expect(afterRestart).toEqual(configuredSettings);
  });
});
