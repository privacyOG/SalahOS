import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
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

describe('persisted timezone cache integration', () => {
  it('restores and consumes a validated cached IANA timezone in the production dashboard', () => {
    const storage = new MemoryStorage();
    const coordinates = createCoordinates(40.7128, -74.006);
    savePersistedSettings(storage, {
      ...defaultPersistedSettings,
      location: {
        coordinates,
        timeZone: 'America/Los_Angeles',
      },
    });

    const restored = loadPersistedSettings(storage);
    if (restored.location === null) throw new Error('Expected persisted location');
    const cachedTimeZone = restored.location.timeZone;
    if (cachedTimeZone === undefined) throw new Error('Expected persisted IANA timezone');

    const dashboard = buildPrayerDashboard({
      instant: new Date('2026-08-16T12:00:00.000Z'),
      coordinates: restored.location.coordinates,
      timeZone: cachedTimeZone,
    });

    expect(cachedTimeZone).toBe('America/Los_Angeles');
    expect(dashboard.timeZone).toBe('America/Los_Angeles');
    expect(dashboard.utcOffsetMinutes).toBe(-420);
  });

  it('rejects an invalid persisted timezone instead of passing it to runtime formatting', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'salahos.settings',
      JSON.stringify({
        ...defaultPersistedSettings,
        location: {
          coordinates: { latitude: -33.8688, longitude: 151.2093 },
          timeZone: 'Invalid/Timezone',
        },
      }),
    );

    expect(loadPersistedSettings(storage).location).toBeNull();
  });
});
