import type { PrayerBoardWeatherSnapshot } from '../domain/prayerBoardTemplate';
import {
  resolveBestAvailableLocation,
  type BestAvailableLocation,
  type BestAvailableLocationSource,
  type LocationFallback,
} from './bestAvailableLocation';
import { loadQiblaPermissionOnboarding } from './qiblaPermissionOnboarding';
import { loadPersistedSettings, type KeyValueStorage } from './settingsStorage';

export const PRAYER_BOARD_WEATHER_STORAGE_KEY = 'salahos.prayerBoardWeather';
export const PRAYER_BOARD_WEATHER_CHANGE_EVENT = 'salahos:prayer-board-weather-change';

const WEATHER_CONFIG_VERSION = 1 as const;
const WEATHER_FRESH_AGE_MS = 45 * 60 * 1000;
const WEATHER_STALE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const OPEN_METEO_CURRENT_URL = 'https://api.open-meteo.com/v1/forecast';

export interface PrayerBoardWeatherConfig {
  readonly version: 1;
  readonly enabled: boolean;
  readonly provider: 'open-meteo';
  /** Optional manual fallback. Automatic best-available location remains primary. */
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationLabel: string | null;
}

export interface PrayerBoardWeatherDetails extends PrayerBoardWeatherSnapshot {
  readonly feelsLikeC: number | null;
  readonly highC: number | null;
  readonly lowC: number | null;
  readonly precipitationProbabilityPercent: number | null;
  readonly humidityPercent: number | null;
  readonly windSpeedKmh: number | null;
  readonly uvIndex: number | null;
  readonly sunriseAtIso: string | null;
  readonly sunsetAtIso: string | null;
  readonly locationSource: BestAvailableLocationSource | null;
  readonly locationAccuracyMeters: number | null;
  readonly locationLabel: string | null;
  readonly fetchedAtIso: string | null;
}

interface PrayerBoardWeatherCache {
  readonly snapshot: PrayerBoardWeatherDetails;
  readonly cachedAtIso: string;
}

interface PrayerBoardWeatherStoragePayload {
  readonly version: 1;
  readonly config: PrayerBoardWeatherConfig;
  readonly cache: PrayerBoardWeatherCache | null;
}

export interface WeatherFetchResponse {
  readonly ok: boolean;
  json(): Promise<unknown>;
}

export type WeatherFetch = (input: string) => Promise<WeatherFetchResponse>;
export type WeatherLocationResolver = (
  storage: KeyValueStorage,
  config: PrayerBoardWeatherConfig,
  now: Date,
) => Promise<BestAvailableLocation | null>;

const DEFAULT_CONFIG: PrayerBoardWeatherConfig = Object.freeze({
  version: WEATHER_CONFIG_VERSION,
  enabled: true,
  provider: 'open-meteo',
  latitude: null,
  longitude: null,
  locationLabel: null,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCoordinate(value: unknown, minimum: number, maximum: number): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

function normalizeLocationLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/gu, ' ');
  return normalized.length > 0 && normalized.length <= 120 ? normalized : null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function boundedNumber(value: unknown, minimum: number, maximum: number): number | null {
  const number = nullableNumber(value);
  return number !== null && number >= minimum && number <= maximum ? number : null;
}

function isoDate(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function unixSecondsIso(value: unknown): string | null {
  const seconds = nullableNumber(value);
  if (seconds === null) return null;
  const date = new Date(seconds * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function firstArrayNumber(value: unknown): number | null {
  return Array.isArray(value) ? nullableNumber(value[0]) : null;
}

function firstArrayUnixIso(value: unknown): string | null {
  return Array.isArray(value) ? unixSecondsIso(value[0]) : null;
}

export function parsePrayerBoardWeatherConfig(value: unknown): PrayerBoardWeatherConfig {
  if (!isRecord(value) || value.version !== WEATHER_CONFIG_VERSION) return DEFAULT_CONFIG;
  return Object.freeze({
    version: WEATHER_CONFIG_VERSION,
    enabled: value.enabled !== false,
    provider: 'open-meteo',
    latitude: normalizeCoordinate(value.latitude, -90, 90),
    longitude: normalizeCoordinate(value.longitude, -180, 180),
    locationLabel: normalizeLocationLabel(value.locationLabel),
  });
}

function parseWeatherSnapshot(value: unknown): PrayerBoardWeatherDetails | null {
  if (!isRecord(value)) return null;
  const state = value.state;
  if (state !== 'ready' && state !== 'loading' && state !== 'stale' && state !== 'error') {
    return null;
  }
  const summary =
    typeof value.summary === 'string' && value.summary.trim().length > 0
      ? value.summary.trim().slice(0, 160)
      : null;
  const source = value.locationSource;
  const locationSource =
    source === 'native-gps' ||
    source === 'native-network-approximate' ||
    source === 'browser-gps' ||
    source === 'browser-network-approximate' ||
    source === 'recent-cache' ||
    source === 'mosque' ||
    source === 'saved' ||
    source === 'manual'
      ? source
      : null;

  return Object.freeze({
    state,
    temperatureC: nullableNumber(value.temperatureC),
    summary,
    observedAtIso: isoDate(value.observedAtIso),
    feelsLikeC: nullableNumber(value.feelsLikeC),
    highC: nullableNumber(value.highC),
    lowC: nullableNumber(value.lowC),
    precipitationProbabilityPercent: boundedNumber(value.precipitationProbabilityPercent, 0, 100),
    humidityPercent: boundedNumber(value.humidityPercent, 0, 100),
    windSpeedKmh: nullableNumber(value.windSpeedKmh),
    uvIndex: nullableNumber(value.uvIndex),
    sunriseAtIso: isoDate(value.sunriseAtIso),
    sunsetAtIso: isoDate(value.sunsetAtIso),
    locationSource,
    locationAccuracyMeters: nullableNumber(value.locationAccuracyMeters),
    locationLabel: normalizeLocationLabel(value.locationLabel),
    fetchedAtIso: isoDate(value.fetchedAtIso),
  });
}

function readPayload(storage: KeyValueStorage): PrayerBoardWeatherStoragePayload {
  const raw = storage.getItem(PRAYER_BOARD_WEATHER_STORAGE_KEY);
  if (raw === null) return Object.freeze({ version: 1, config: DEFAULT_CONFIG, cache: null });
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== WEATHER_CONFIG_VERSION) {
      return Object.freeze({ version: 1, config: DEFAULT_CONFIG, cache: null });
    }
    const config = parsePrayerBoardWeatherConfig(parsed.config);
    const cacheValue = parsed.cache;
    if (!isRecord(cacheValue)) return Object.freeze({ version: 1, config, cache: null });
    const snapshot = parseWeatherSnapshot(cacheValue.snapshot);
    const cachedAtIso = isoDate(cacheValue.cachedAtIso);
    return Object.freeze({
      version: WEATHER_CONFIG_VERSION,
      config,
      cache:
        snapshot === null || cachedAtIso === null ? null : Object.freeze({ snapshot, cachedAtIso }),
    });
  } catch {
    return Object.freeze({ version: 1, config: DEFAULT_CONFIG, cache: null });
  }
}

function writePayload(storage: KeyValueStorage, payload: PrayerBoardWeatherStoragePayload): void {
  storage.setItem(PRAYER_BOARD_WEATHER_STORAGE_KEY, JSON.stringify(payload));
}

export function loadPrayerBoardWeatherConfig(storage: KeyValueStorage): PrayerBoardWeatherConfig {
  return readPayload(storage).config;
}

export function savePrayerBoardWeatherConfig(
  storage: KeyValueStorage,
  value: PrayerBoardWeatherConfig,
): PrayerBoardWeatherConfig {
  const config = parsePrayerBoardWeatherConfig(value);
  const current = readPayload(storage);
  writePayload(storage, Object.freeze({ ...current, config }));
  return config;
}

function withCacheFreshness(
  cache: PrayerBoardWeatherCache,
  now: Date,
): PrayerBoardWeatherDetails | null {
  const ageMs = now.getTime() - Date.parse(cache.cachedAtIso);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > WEATHER_STALE_MAX_AGE_MS) return null;
  return Object.freeze({
    ...cache.snapshot,
    state: ageMs <= WEATHER_FRESH_AGE_MS ? 'ready' : 'stale',
  });
}

export function loadUsablePrayerBoardWeather(
  storage: KeyValueStorage,
  now: Date = new Date(),
): PrayerBoardWeatherDetails | null {
  const payload = readPayload(storage);
  if (!payload.config.enabled || payload.cache === null) return null;
  return withCacheFreshness(payload.cache, now);
}

function weatherSummary(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Weather';
}

function weatherUrl(location: BestAvailableLocation): string {
  const url = new URL(OPEN_METEO_CURRENT_URL);
  url.searchParams.set('latitude', String(location.coordinates.latitude));
  url.searchParams.set('longitude', String(location.coordinates.longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
  );
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
  );
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('timeformat', 'unixtime');
  url.searchParams.set('forecast_days', '1');
  return url.toString();
}

function manualFallback(config: PrayerBoardWeatherConfig): LocationFallback | undefined {
  return config.latitude === null || config.longitude === null
    ? undefined
    : {
        coordinates: { latitude: config.latitude, longitude: config.longitude },
        source: 'manual',
        label: config.locationLabel,
      };
}

function savedFallback(storage: KeyValueStorage): LocationFallback | undefined {
  const settings = loadPersistedSettings(storage);
  return settings.location === null
    ? undefined
    : {
        coordinates: settings.location.coordinates,
        source: 'saved',
        ...(settings.location.timeZone === undefined
          ? {}
          : { timeZone: settings.location.timeZone }),
      };
}

export const resolveWeatherLocation: WeatherLocationResolver = async (storage, config, now) => {
  const saved = savedFallback(storage);
  const manual = manualFallback(config);
  const autoLocation = loadQiblaPermissionOnboarding(storage).autoLocation;
  return resolveBestAvailableLocation(storage, {
    live: autoLocation,
    now,
    ...(saved === undefined ? {} : { saved }),
    ...(manual === undefined ? {} : { manual }),
  });
};

function providerSnapshot(
  body: Record<string, unknown>,
  location: BestAvailableLocation,
  now: Date,
): PrayerBoardWeatherDetails {
  if (!isRecord(body.current)) throw new Error('Weather response is invalid');
  const current = body.current;
  const daily = isRecord(body.daily) ? body.daily : {};
  const temperatureC = nullableNumber(current.temperature_2m);
  const weatherCode = nullableNumber(current.weather_code);
  if (temperatureC === null || weatherCode === null) {
    throw new Error('Weather response is incomplete');
  }

  return Object.freeze({
    state: 'ready',
    temperatureC,
    summary: weatherSummary(weatherCode),
    observedAtIso: unixSecondsIso(current.time) ?? now.toISOString(),
    feelsLikeC: nullableNumber(current.apparent_temperature),
    highC: firstArrayNumber(daily.temperature_2m_max),
    lowC: firstArrayNumber(daily.temperature_2m_min),
    precipitationProbabilityPercent: boundedNumber(
      firstArrayNumber(daily.precipitation_probability_max),
      0,
      100,
    ),
    humidityPercent: boundedNumber(current.relative_humidity_2m, 0, 100),
    windSpeedKmh: nullableNumber(current.wind_speed_10m),
    uvIndex: firstArrayNumber(daily.uv_index_max),
    sunriseAtIso: firstArrayUnixIso(daily.sunrise),
    sunsetAtIso: firstArrayUnixIso(daily.sunset),
    locationSource: location.source,
    locationAccuracyMeters: location.accuracyMeters,
    locationLabel: location.label ?? configLabelForLocation(location),
    fetchedAtIso: now.toISOString(),
  });
}

function configLabelForLocation(location: BestAvailableLocation): string | null {
  return location.label;
}

export async function refreshPrayerBoardWeather(
  storage: KeyValueStorage,
  fetcher: WeatherFetch = fetch,
  now: Date = new Date(),
  locationResolver: WeatherLocationResolver = resolveWeatherLocation,
): Promise<PrayerBoardWeatherDetails | null> {
  const payload = readPayload(storage);
  const config = payload.config;
  if (!config.enabled) return null;

  try {
    const location = await locationResolver(storage, config, now);
    if (location === null) return loadUsablePrayerBoardWeather(storage, now);
    const response = await fetcher(weatherUrl(location));
    if (!response.ok) throw new Error('Weather provider request failed');
    const body: unknown = await response.json();
    if (!isRecord(body)) throw new Error('Weather response is invalid');
    const snapshot = providerSnapshot(body, location, now);
    writePayload(
      storage,
      Object.freeze({
        version: WEATHER_CONFIG_VERSION,
        config,
        cache: Object.freeze({ snapshot, cachedAtIso: now.toISOString() }),
      }),
    );
    return snapshot;
  } catch {
    // Weather is non-critical context. Provider/location failures must never
    // propagate into prayer calculations or prevent cached prayer data rendering.
    return loadUsablePrayerBoardWeather(storage, now);
  }
}
