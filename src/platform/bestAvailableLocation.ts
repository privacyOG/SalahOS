import type { Coordinates } from '../domain/coordinates';
import { createCoordinates } from '../domain/coordinates';
import { resolveIanaTimeZone } from '../domain/timezone';
import {
  requestCurrentLocation,
  type CurrentLocationFix,
  type CurrentLocationResult,
} from './currentLocation';
import {
  loadPersistedSettings,
  savePersistedSettings,
  type KeyValueStorage,
  type PersistedLocation,
} from './settingsStorage';

export const BEST_AVAILABLE_LOCATION_STORAGE_KEY = 'salahos.bestAvailableLocation';
export const LOCATION_CONTEXT_CHANGE_EVENT = 'salahos:location-context-change';

const CACHE_VERSION = 1 as const;
const DEFAULT_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const SETTINGS_MOVE_THRESHOLD_METERS = 250;

export type BestAvailableLocationSource =
  | CurrentLocationFix['source']
  | 'recent-cache'
  | 'mosque'
  | 'saved'
  | 'manual';

export type LocationFreshness = 'live' | 'recent-cache' | 'fallback';

export interface BestAvailableLocation {
  readonly coordinates: Coordinates;
  readonly source: BestAvailableLocationSource;
  readonly accuracyMeters: number | null;
  readonly capturedAtIso: string;
  readonly timeZone: string;
  readonly label: string | null;
  readonly freshness: LocationFreshness;
  readonly isApproximate: boolean;
}

export interface LocationFallback {
  readonly coordinates: Coordinates;
  readonly source: 'mosque' | 'saved' | 'manual';
  readonly timeZone?: string;
  readonly label?: string | null;
}

export interface BestAvailableLocationOptions {
  readonly live?: boolean;
  readonly mosque?: LocationFallback;
  readonly saved?: LocationFallback;
  readonly manual?: LocationFallback;
  readonly now?: Date;
  readonly cacheMaxAgeMilliseconds?: number;
  readonly requestLive?: () => Promise<CurrentLocationResult>;
}

interface CachedLocationPayload {
  readonly version: 1;
  readonly coordinates: Coordinates;
  readonly accuracyMeters: number | null;
  readonly capturedAtIso: string;
  readonly timeZone: string;
  readonly isApproximate: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validIso(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function resolvedTimeZone(coordinates: Coordinates, explicit?: string): string {
  if (explicit !== undefined && explicit.trim().length > 0) return explicit;
  return resolveIanaTimeZone(coordinates).timeZone;
}

function locationIsApproximate(fix: CurrentLocationFix): boolean {
  return (
    fix.source === 'native-network-approximate' ||
    fix.source === 'browser-network-approximate' ||
    (fix.accuracyMeters !== null && fix.accuracyMeters > 250)
  );
}

function liveLocation(fix: CurrentLocationFix): BestAvailableLocation {
  return Object.freeze({
    coordinates: fix.coordinates,
    source: fix.source,
    accuracyMeters: fix.accuracyMeters,
    capturedAtIso: fix.capturedAtIso,
    timeZone: resolveIanaTimeZone(fix.coordinates).timeZone,
    label: null,
    freshness: 'live',
    isApproximate: locationIsApproximate(fix),
  });
}

function fallbackLocation(fallback: LocationFallback, now: Date): BestAvailableLocation {
  return Object.freeze({
    coordinates: fallback.coordinates,
    source: fallback.source,
    accuracyMeters: null,
    capturedAtIso: now.toISOString(),
    timeZone: resolvedTimeZone(fallback.coordinates, fallback.timeZone),
    label: fallback.label ?? null,
    freshness: 'fallback',
    isApproximate: fallback.source !== 'manual',
  });
}

function saveCachedLiveLocation(storage: KeyValueStorage, location: BestAvailableLocation): void {
  const payload: CachedLocationPayload = Object.freeze({
    version: CACHE_VERSION,
    coordinates: location.coordinates,
    accuracyMeters: location.accuracyMeters,
    capturedAtIso: location.capturedAtIso,
    timeZone: location.timeZone,
    isApproximate: location.isApproximate,
  });
  storage.setItem(BEST_AVAILABLE_LOCATION_STORAGE_KEY, JSON.stringify(payload));
}

export function loadRecentBestAvailableLocation(
  storage: KeyValueStorage,
  now: Date = new Date(),
  maxAgeMilliseconds: number = DEFAULT_CACHE_MAX_AGE_MS,
): BestAvailableLocation | null {
  const raw = storage.getItem(BEST_AVAILABLE_LOCATION_STORAGE_KEY);
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== CACHE_VERSION || !isRecord(parsed.coordinates)) {
      return null;
    }
    const coordinates = createCoordinates(
      Number(parsed.coordinates.latitude),
      Number(parsed.coordinates.longitude),
    );
    const capturedAtIso = validIso(parsed.capturedAtIso);
    if (capturedAtIso === null || typeof parsed.timeZone !== 'string') return null;
    const ageMilliseconds = now.getTime() - Date.parse(capturedAtIso);
    if (
      !Number.isFinite(ageMilliseconds) ||
      ageMilliseconds < 0 ||
      ageMilliseconds > maxAgeMilliseconds
    ) {
      return null;
    }
    const accuracyMeters =
      parsed.accuracyMeters === null
        ? null
        : Number.isFinite(Number(parsed.accuracyMeters)) && Number(parsed.accuracyMeters) >= 0
          ? Number(parsed.accuracyMeters)
          : null;
    return Object.freeze({
      coordinates,
      source: 'recent-cache',
      accuracyMeters,
      capturedAtIso,
      timeZone: resolvedTimeZone(coordinates, parsed.timeZone),
      label: null,
      freshness: 'recent-cache',
      isApproximate: parsed.isApproximate === true,
    });
  } catch {
    return null;
  }
}

/**
 * Resolve one shared location context for prayer calculations, Qiblah, weather
 * and nearby-mosque discovery. Live foreground positioning is preferred; a
 * recent live cache and explicit application fallbacks keep the app useful when
 * GPS, radio positioning or the network are temporarily unavailable.
 */
export async function resolveBestAvailableLocation(
  storage: KeyValueStorage,
  options: BestAvailableLocationOptions = {},
): Promise<BestAvailableLocation | null> {
  const now = options.now ?? new Date();
  if (options.live !== false) {
    const result = await (options.requestLive ?? requestCurrentLocation)();
    if (result.ok) {
      const location = liveLocation(result.location);
      saveCachedLiveLocation(storage, location);
      return location;
    }
  }

  const cached = loadRecentBestAvailableLocation(
    storage,
    now,
    options.cacheMaxAgeMilliseconds ?? DEFAULT_CACHE_MAX_AGE_MS,
  );
  if (cached !== null) return cached;
  if (options.mosque !== undefined) return fallbackLocation(options.mosque, now);
  if (options.saved !== undefined) return fallbackLocation(options.saved, now);
  if (options.manual !== undefined) return fallbackLocation(options.manual, now);
  return null;
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function locationDistanceMeters(left: Coordinates, right: Coordinates): number {
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function persistBestAvailableLocation(
  storage: KeyValueStorage,
  location: BestAvailableLocation,
): boolean {
  const settings = loadPersistedSettings(storage);
  const current = settings.location;
  const moved =
    current === null ||
    locationDistanceMeters(current.coordinates, location.coordinates) >= SETTINGS_MOVE_THRESHOLD_METERS;
  const timeZoneChanged = current?.timeZone !== location.timeZone;
  if (!moved && !timeZoneChanged) return false;

  const nextLocation: PersistedLocation = Object.freeze({
    coordinates: location.coordinates,
    timeZone: location.timeZone,
  });
  savePersistedSettings(storage, { ...settings, location: nextLocation });
  return true;
}
