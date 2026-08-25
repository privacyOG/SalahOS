import { describe, expect, it, vi } from 'vitest';

import type { BestAvailableLocation } from './bestAvailableLocation';
import type { KeyValueStorage } from './settingsStorage';
import {
  loadPrayerBoardWeatherConfig,
  loadUsablePrayerBoardWeather,
  parsePrayerBoardWeatherConfig,
  refreshPrayerBoardWeather,
  savePrayerBoardWeatherConfig,
  type WeatherFetch,
  type WeatherLocationResolver,
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

const sydneyLocation: BestAvailableLocation = Object.freeze({
  coordinates: { latitude: -33.8688, longitude: 151.2093 },
  source: 'native-gps',
  accuracyMeters: 8,
  capturedAtIso: '2026-08-25T01:00:00.000Z',
  timeZone: 'Australia/Sydney',
  label: 'Sydney',
  freshness: 'live',
  isApproximate: false,
});

const resolveSydney: WeatherLocationResolver = () => Promise.resolve(sydneyLocation);

function successfulWeatherFetch(): WeatherFetch {
  return (url) => {
    expect(url).toContain('latitude=-33.8688');
    expect(url).toContain('longitude=151.2093');
    expect(url).toContain('apparent_temperature');
    expect(url).toContain('precipitation_probability_max');
    expect(url).toContain('uv_index_max');
    expect(url).toContain('timezone=auto');
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          current: {
            time: Date.parse('2026-08-25T01:00:00.000Z') / 1000,
            temperature_2m: 18.4,
            apparent_temperature: 16.9,
            relative_humidity_2m: 72,
            weather_code: 2,
            wind_speed_10m: 21.2,
          },
          daily: {
            temperature_2m_max: [20.1],
            temperature_2m_min: [11.2],
            precipitation_probability_max: [65],
            uv_index_max: [4.7],
            sunrise: [Date.parse('2026-08-24T20:25:00.000Z') / 1000],
            sunset: [Date.parse('2026-08-25T07:37:00.000Z') / 1000],
          },
        }),
    });
  };
}

describe('prayer-board weather', () => {
  it('is ready for automatic local weather by default without inventing coordinates', () => {
    const storage = memoryStorage();
    expect(loadPrayerBoardWeatherConfig(storage)).toEqual({
      version: 1,
      enabled: true,
      provider: 'open-meteo',
      latitude: null,
      longitude: null,
      locationLabel: null,
    });
    expect(loadUsablePrayerBoardWeather(storage)).toBeNull();
  });

  it('normalizes optional manual coordinates as fallback rather than a requirement', () => {
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

  it('uses resolved live location and caches full current/daily weather context', async () => {
    const storage = memoryStorage();
    const fetcher = vi.fn<WeatherFetch>(successfulWeatherFetch());
    const now = new Date('2026-08-25T01:05:00.000Z');

    await expect(
      refreshPrayerBoardWeather(storage, fetcher, now, resolveSydney),
    ).resolves.toMatchObject({
      state: 'ready',
      temperatureC: 18.4,
      feelsLikeC: 16.9,
      highC: 20.1,
      lowC: 11.2,
      precipitationProbabilityPercent: 65,
      humidityPercent: 72,
      windSpeedKmh: 21.2,
      uvIndex: 4.7,
      summary: 'Partly cloudy',
      locationSource: 'native-gps',
      locationAccuracyMeters: 8,
      locationLabel: 'Sydney',
      fetchedAtIso: '2026-08-25T01:05:00.000Z',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(loadUsablePrayerBoardWeather(storage, now)).toMatchObject({
      state: 'ready',
      temperatureC: 18.4,
      sunriseAtIso: '2026-08-24T20:25:00.000Z',
      sunsetAtIso: '2026-08-25T07:37:00.000Z',
    });
  });

  it('returns cached weather as stale on provider/network failure and expires it later', async () => {
    const storage = memoryStorage();
    await refreshPrayerBoardWeather(
      storage,
      successfulWeatherFetch(),
      new Date('2026-08-25T01:05:00.000Z'),
      resolveSydney,
    );

    const failedFetch: WeatherFetch = () => Promise.reject(new Error('offline'));
    await expect(
      refreshPrayerBoardWeather(
        storage,
        failedFetch,
        new Date('2026-08-25T02:00:00.000Z'),
        resolveSydney,
      ),
    ).resolves.toMatchObject({
      state: 'stale',
      temperatureC: 18.4,
      summary: 'Partly cloudy',
    });
    expect(loadUsablePrayerBoardWeather(storage, new Date('2026-08-25T13:06:00.000Z'))).toBeNull();
  });

  it('isolates missing-location/provider failure and never throws into prayer rendering', async () => {
    const storage = memoryStorage();
    const noLocation: WeatherLocationResolver = () => Promise.resolve(null);
    const fetcher = vi.fn<WeatherFetch>();

    await expect(
      refreshPrayerBoardWeather(
        storage,
        fetcher,
        new Date('2026-08-25T01:05:00.000Z'),
        noLocation,
      ),
    ).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('honours an explicit weather disable without resolving location or fetching', async () => {
    const storage = memoryStorage();
    savePrayerBoardWeatherConfig(storage, {
      version: 1,
      enabled: false,
      provider: 'open-meteo',
      latitude: null,
      longitude: null,
      locationLabel: null,
    });
    const resolver = vi.fn<WeatherLocationResolver>();
    const fetcher = vi.fn<WeatherFetch>();

    await expect(refreshPrayerBoardWeather(storage, fetcher, new Date(), resolver)).resolves.toBeNull();
    expect(resolver).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
