import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import { buildManualMosqueDay, upsertManualMosqueDay } from '../domain/manualMosqueEntry';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  savePersistedSettings,
  type KeyValueStorage,
} from '../platform/settingsStorage';

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

describe('Iqamah settings integration', () => {
  it('persists an offset rule and resolves its exact Iqamah time through the production source path', () => {
    const day = buildManualMosqueDay('2026-08-16', {
      fajr: { start: '05:00', iqamahMode: 'offset', iqamah: '20' },
      dhuhr: { start: '12:10', iqamahMode: 'fixed', iqamah: '12:30' },
      asr: { start: '15:30', iqamahMode: 'none', iqamah: '' },
      maghrib: { start: '17:45', iqamahMode: 'offset', iqamah: '10' },
      isha: { start: '19:05', iqamahMode: 'fixed', iqamah: '19:25' },
    });
    const timetable = upsertManualMosqueDay(null, 'Example Mosque', day);
    const storage = new MemoryStorage();
    const coordinates = createCoordinates(-33.8688, 151.2093);

    savePersistedSettings(storage, {
      ...defaultPersistedSettings,
      location: { coordinates, timeZone: 'Australia/Sydney' },
      prayerSourceMode: 'local-mosque',
      mosqueTimetable: timetable,
    });

    const restored = loadPersistedSettings(storage);
    const dashboard = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates,
      timeZone: 'Australia/Sydney',
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard,
      sourceMode: restored.prayerSourceMode,
      mosqueTimetable: restored.mosqueTimetable,
    });

    const fajr = sourced.prayers.find((prayer) => prayer.name === 'fajr');
    const dhuhr = sourced.prayers.find((prayer) => prayer.name === 'dhuhr');
    const asr = sourced.prayers.find((prayer) => prayer.name === 'asr');

    expect(restored.mosqueTimetable?.days[0]?.prayers.fajr?.iqamah).toEqual({
      kind: 'offset',
      offsetMinutes: 20,
    });
    expect(fajr?.localMinutes).toBe(300);
    expect(fajr?.iqamahLocalMinutes).toBe(320);
    expect(dhuhr?.iqamahLocalMinutes).toBe(750);
    expect(asr?.iqamahLocalMinutes).toBeNull();
  });
});
