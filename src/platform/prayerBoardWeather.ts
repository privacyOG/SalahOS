import type { PrayerBoardWeatherSnapshot } from '../domain/prayerBoardTemplate';
import type { KeyValueStorage } from './settingsStorage';

export const PRAYER_BOARD_WEATHER_STORAGE_KEY = 'salahos.prayerBoardWeather';
export const PRAYER_BOARD_WEATHER_CHANGE_EVENT = 'salahos:prayer-board-weather-change';

const WEATHER_CONFIG_VERSION = 1 as const;
const WEATHER_CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const OPEN_METEO_CURRENT_URL = 'https://api.open-meteo.com/v1/forecast';

export interface PrayerBoardWeatherConfig {
  readonly version: 1;
  readonly enabled: boolean;
  readonly provider: 'open-meteo';
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationLabel: string | null;
}

interface PrayerBoardWeatherCache {
  readonly snapshot: PrayerBoardWeatherSnapshot;
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

const DEFAULT_CONFIG: PrayerBoardWeatherConfig = Object.freeze({
  version: WEATHER_CONFIG_VERSION,
  enabled: false,
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

export function parsePrayerBoardWeatherConfig(value: unknown): PrayerBoardWeatherConfig {
  if (!isRecord(value) || value.version !== WEATHER_CONFIG_VERSION) return DEFAULT_CONFIG;
  return Object.freeze({
    version: WEATHER_CONFIG_VERSION,
    enabled: value.enabled === true,
    provider: 'open-meteo',
    latitude: normalizeCoordinate(value.latitude, -90, 90),
    longitude: normalizeCoordinate(value.longitude, -180, 180),
    locationLabel: normalizeLocationLabel(value.locationLabel),
  });
}

function parseWeatherSnapshot(value: unknown): PrayerBoardWeatherSnapshot | null {
  if (!isRecord(value)) return null;
  const state = value.state;
  if (state !== 'ready' && state !== 'loading' && state !== 'stale' && state !== 'error') {
    return null;
  }
  const temperatureC =
    value.temperatureC === null
      ? null
      : Number.isFinite(Number(value.temperatureC))
        ? Number(value.temperatureC)
        : null;
  const summary =
    typeof value.summary === 'string' && value.summary.trim().length > 0
      ? value.summary.trim().slice(0, 160)
      : null;
  const observedAtIso =
    typeof value.observedAtIso === 'string' && Number.isFinite(Date.parse(value.observedAtIso))
      ? value.observedAtIso
      : null;
  return Object.freeze({ state, temperatureC, summary, observedAtIso });
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
    const cachedAtIso =
      typeof cacheValue.cachedAtIso === 'string' && Number.isFinite(Date.parse(cacheValue.cachedAtIso))
        ? cacheValue.cachedAtIso
        : null;
    return Object.freeze({
      version: WEATHER_CONFIG_VERSION,
      config,
      cache:
        snapshot === null || cachedAtIso === null
          ? null
          : Object.freeze({ snapshot, cachedAtIso }),
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

export function loadUsablePrayerBoardWeather(
  storage: KeyValueStorage,
  now: Date = new Date(),
): PrayerBoardWeatherSnapshot | null {
  const payload = readPayload(storage);
  if (!payload.config.enabled || payload.cache === null) return null;
  const ageMs = now.getTime() - Date.parse(payload.cache.cachedAtIso);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > WEATHER_CACHE_MAX_AGE_MS) return null;
  return payload.cache.snapshot.state === 'ready' ? payload.cache.snapshot : null;
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

function weatherUrl(config: PrayerBoardWeatherConfig): string {
  if (config.latitude === null || config.longitude === null) {
    throw new Error('Weather requires an explicitly configured fixed latitude and longitude');
  }
  const url = new URL(OPEN_METEO_CURRENT_URL);
  url.searchParams.set('latitude', String(config.latitude));
  url.searchParams.set('longitude', String(config.longitude));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('timezone', 'UTC');
  return url.toString();
}

export async function refreshPrayerBoardWeather(
  storage: KeyValueStorage,
  fetcher: WeatherFetch = fetch,
  now: Date = new Date(),
): Promise<PrayerBoardWeatherSnapshot | null> {
  const payload = readPayload(storage);
  const config = payload.config;
  if (!config.enabled || config.latitude === null || config.longitude === null) return null;

  try {
    const response = await fetcher(weatherUrl(config));
    if (!response.ok) throw new Error('Weather provider request failed');
    const body: unknown = await response.json();
    if (!isRecord(body) || !isRecord(body.current)) throw new Error('Weather response is invalid');
    const temperatureC = Number(body.current.temperature_2m);
    const weatherCode = Number(body.current.weather_code);
    const observedAtIso =
      typeof body.current.time === 'string' && Number.isFinite(Date.parse(`${body.current.time}Z`))
        ? `${body.current.time}Z`
        : now.toISOString();
    if (!Number.isFinite(temperatureC) || !Number.isFinite(weatherCode)) {
      throw new Error('Weather response is incomplete');
    }
    const snapshot: PrayerBoardWeatherSnapshot = Object.freeze({
      state: 'ready',
      temperatureC,
      summary: weatherSummary(weatherCode),
      observedAtIso,
    });
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
    return loadUsablePrayerBoardWeather(storage, now);
  }
}
