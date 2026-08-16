import { describe, expect, it, vi } from 'vitest';
import { buildPrayerDashboardResult } from '../domain/dashboardResult';
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

describe('offline startup flow', () => {
  it('restores persisted location and calculates the dashboard without network access', () => {
    const storage = new MemoryStorage();
    const configured: PersistedSettings = {
      ...defaultPersistedSettings,
      calculationMethodId: 'umm-al-qura',
      asrConvention: 'standard',
      highLatitudeRule: 'angle-based',
      hijriCorrectionDays: 1,
      prayerAdjustments: { fajr: 2 },
      location: {
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
        timeZone: 'Australia/Sydney',
      },
    };
    savePersistedSettings(storage, configured);

    const fetchSpy = vi.fn(() => Promise.reject(new Error('Network unavailable')));
    vi.stubGlobal('fetch', fetchSpy);

    try {
      const restored = loadPersistedSettings(storage);
      if (restored.location === null) {
        throw new Error('Expected persisted location during offline startup');
      }

      const result = buildPrayerDashboardResult({
        instant: new Date('2026-08-16T02:00:00.000Z'),
        coordinates: restored.location.coordinates,
        method: calculationMethods[restored.calculationMethodId],
        asrConvention: restored.asrConvention,
        highLatitudeRule: restored.highLatitudeRule,
        adjustments: restored.prayerAdjustments,
        hijriCorrectionDays: restored.hijriCorrectionDays,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error('Expected offline prayer dashboard calculation to succeed');
      }

      expect(result.dashboard.timeZone).toBe('Australia/Sydney');
      expect(result.dashboard.today.date).toBe('2026-08-16');
      expect(result.dashboard.prayers).toHaveLength(6);
      expect(result.dashboard.method.id).toBe('umm-al-qura');
      expect(result.dashboard.hijri.correctionDays).toBe(1);
      expect(result.dashboard.hasManualAdjustments).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
