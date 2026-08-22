import { describe, expect, it, vi } from 'vitest';

import type { KeyValueStorage } from './settingsStorage';
import {
  loadPrayerBoardWeatherConfig,
  loadUsablePrayerBoardWeather,
  parsePrayerBoardWeatherConfig,
  refreshPrayerBoardWeather,
  savePrayerBoardWeatherConfig,
  type WeatherFetch,
} from './prayerBoardWeather';

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

describe('prayer-board weather', () => {
  it('is disabled by default and does not invent a device location', () => {
    const storage = memoryStorage();
    expect(loadPrayerBoardWeatherConfig(storage)).toEqual({
      version: 1,
      enabled: false,
      provider: 'open-meteo',
      latitude: null,
      longitude: null,
      locationLabel: null,
    });
    expect(loadUsablePrayerBoardWeather(storage)).toBeNull();
  });

  it('normalizes only an explicitly configured fixed location', () => {
    expect(
      parsePrayerBoardWeatherConfig({
        version: 1,
        enabled: true,
        provider: 'anything',
        latitude: -33.8688,
        longitude: 151.2093,
        locationLabel: '  Sydney CBD  ',
      }),
    ).toEqual({
      version: 1,
      enabled: true,
      provider: 'open-meteo',
      latitude: -33.8688,
      longitude: 151.2093,
      locationLabel: 'Sydney CBD',
    });
  });

  it('fetches only after explicit enablement and caches the last known good snapshot', async () => {
    const storage = memoryStorage();
    savePrayerBoardWeatherConfig(storage, {
      version: 1,
      enabled: true,
      provider: 'open-meteo',
      latitude: -33.86,
      longitude: 151.21,
      locationLabel: 'Sydney',
    });
    const fetcher = vi.fn<WeatherFetch>(async (url) => {
      expect(url).toContain('latitude=-33.86');
      expect(url).toContain('longitude=151.21');
      return {
        ok: true,
        json: async () => ({
          current: {
            time: '2026-08-22T01:00',
            temperature_2m: 18.4,
            weather_code: 2,
          },
        }),
      };
    });
    const now = new Date('2026-08-22T01:05:00.000Z');

    await expect(refreshPrayerBoardWeather(storage, fetcher, now)).resolves.toMatchObject({
      state: 'ready',
      temperatureC: 18.4,
      summary: 'Partly cloudy',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(loadUsablePrayerBoardWeather(storage, now)).toMatchObject({ temperatureC: 18.4 });
  });

  it('falls back to fresh cache on provider failure and hides expired cache', async () => {
    const storage = memoryStorage();
    savePrayerBoardWeatherConfig(storage, {
      version: 1,
      enabled: true,
      provider: 'open-meteo',
      latitude: -33.86,
      longitude: 151.21,
      locationLabel: 'Sydney',
    });
    const goodFetch: WeatherFetch = async () => ({
      ok: true,
      json: async () => ({
        current: {
          time: '2026-08-22T01:00',
          temperature_2m: 17,
          weather_code: 61,
        },
      }),
    });
    await refreshPrayerBoardWeather(storage, goodFetch, new Date('2026-08-22T01:05:00.000Z'));

    const failedFetch: WeatherFetch = async () => {
      throw new Error('offline');
    };
    await expect(
      refreshPrayerBoardWeather(storage, failedFetch, new Date('2026-08-22T02:00:00.000Z')),
    ).resolves.toMatchObject({ temperatureC: 17, summary: 'Rain' });
    expect(loadUsablePrayerBoardWeather(storage, new Date('2026-08-22T03:06:00.000Z'))).toBeNull();
  });
});
