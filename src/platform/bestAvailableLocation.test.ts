import { describe, expect, it } from 'vitest';

import type { CurrentLocationResult } from './currentLocation';
import {
  BEST_AVAILABLE_LOCATION_STORAGE_KEY,
  loadRecentBestAvailableLocation,
  persistBestAvailableLocation,
  resolveBestAvailableLocation,
} from './bestAvailableLocation';
import {
  loadPersistedSettings,
  savePersistedSettings,
  type KeyValueStorage,
} from './settingsStorage';

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

const sydneyLive: CurrentLocationResult = {
  ok: true,
  location: {
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    source: 'native-gps',
    accuracyMeters: 7,
    capturedAtIso: '2026-08-25T00:00:00.000Z',
  },
};

describe('best available location', () => {
  it('prefers and caches a live fix with offline timezone resolution', async () => {
    const storage = memoryStorage();
    const location = await resolveBestAvailableLocation(storage, {
      now: new Date('2026-08-25T00:00:01.000Z'),
      requestLive: () => Promise.resolve(sydneyLive),
      saved: {
        coordinates: { latitude: 51.5072, longitude: -0.1276 },
        source: 'saved',
        timeZone: 'Europe/London',
      },
    });

    expect(location).toMatchObject({
      source: 'native-gps',
      accuracyMeters: 7,
      freshness: 'live',
      isApproximate: false,
      timeZone: 'Australia/Sydney',
    });
    expect(storage.getItem(BEST_AVAILABLE_LOCATION_STORAGE_KEY)).not.toBeNull();
  });

  it('uses a recent live cache when foreground positioning temporarily fails', async () => {
    const storage = memoryStorage();
    await resolveBestAvailableLocation(storage, {
      now: new Date('2026-08-25T00:00:01.000Z'),
      requestLive: () => Promise.resolve(sydneyLive),
    });

    const cached = await resolveBestAvailableLocation(storage, {
      now: new Date('2026-08-25T01:00:00.000Z'),
      requestLive: () => Promise.resolve({ ok: false, reason: 'unavailable' }),
    });

    expect(cached).toMatchObject({
      source: 'recent-cache',
      freshness: 'recent-cache',
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
    });
  });

  it('expires old live cache and then uses explicit saved/manual fallbacks', async () => {
    const storage = memoryStorage();
    await resolveBestAvailableLocation(storage, {
      requestLive: () => Promise.resolve(sydneyLive),
    });
    expect(
      loadRecentBestAvailableLocation(
        storage,
        new Date('2026-08-26T00:00:00.000Z'),
        60 * 60 * 1000,
      ),
    ).toBeNull();

    const fallback = await resolveBestAvailableLocation(storage, {
      now: new Date('2026-08-26T00:00:00.000Z'),
      cacheMaxAgeMilliseconds: 60 * 60 * 1000,
      requestLive: () => Promise.resolve({ ok: false, reason: 'permission-denied' }),
      saved: {
        coordinates: { latitude: 51.5072, longitude: -0.1276 },
        source: 'saved',
        timeZone: 'Europe/London',
        label: 'London',
      },
      manual: {
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        source: 'manual',
        timeZone: 'America/New_York',
      },
    });

    expect(fallback).toMatchObject({
      source: 'saved',
      freshness: 'fallback',
      timeZone: 'Europe/London',
      label: 'London',
    });
  });

  it('marks OS/network-assisted fixes as approximate', async () => {
    const storage = memoryStorage();
    const location = await resolveBestAvailableLocation(storage, {
      requestLive: () =>
        Promise.resolve({
          ok: true,
          location: {
            coordinates: { latitude: -33.87, longitude: 151.2 },
            source: 'browser-network-approximate',
            accuracyMeters: 1_100,
            capturedAtIso: '2026-08-25T00:00:00.000Z',
          },
        }),
    });

    expect(location).toMatchObject({
      source: 'browser-network-approximate',
      isApproximate: true,
      accuracyMeters: 1_100,
    });
  });

  it('updates shared prayer settings after meaningful travel but avoids GPS jitter writes', () => {
    const storage = memoryStorage();
    savePersistedSettings(storage, {
      ...loadPersistedSettings(storage),
      location: {
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
        timeZone: 'Australia/Sydney',
      },
    });

    expect(
      persistBestAvailableLocation(storage, {
        coordinates: { latitude: -33.8687, longitude: 151.2094 },
        source: 'native-gps',
        accuracyMeters: 8,
        capturedAtIso: '2026-08-25T00:00:00.000Z',
        timeZone: 'Australia/Sydney',
        label: null,
        freshness: 'live',
        isApproximate: false,
      }),
    ).toBe(false);

    expect(
      persistBestAvailableLocation(storage, {
        coordinates: { latitude: -37.8136, longitude: 144.9631 },
        source: 'native-gps',
        accuracyMeters: 8,
        capturedAtIso: '2026-08-25T02:00:00.000Z',
        timeZone: 'Australia/Melbourne',
        label: null,
        freshness: 'live',
        isApproximate: false,
      }),
    ).toBe(true);
    expect(loadPersistedSettings(storage).location).toEqual({
      coordinates: { latitude: -37.8136, longitude: 144.9631 },
      timeZone: 'Australia/Melbourne',
    });
  });
});
