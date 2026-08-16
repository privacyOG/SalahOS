import { createCoordinates } from '../domain/coordinates';
import type { Coordinates } from '../domain/coordinates';
import { assertIanaTimeZone } from '../domain/timezone';
import type { KeyValueStorage } from './settingsStorage';

export const SAVED_LOCATIONS_STORAGE_KEY = 'salahos.savedLocations';
export const SAVED_LOCATIONS_SCHEMA_VERSION = 1;

export interface SavedLocation {
  readonly id: string;
  readonly label: string;
  readonly coordinates: Coordinates;
  readonly timeZone?: string;
}

interface SavedLocationEnvelope {
  readonly version: 1;
  readonly locations: readonly SavedLocation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSavedLocation(value: unknown): SavedLocation {
  if (!isRecord(value) || !isRecord(value.coordinates)) {
    throw new TypeError('Saved location must be an object with coordinates');
  }

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const label = typeof value.label === 'string' ? value.label.trim() : '';
  if (id.length === 0 || id.length > 128) {
    throw new RangeError('Saved location id must contain 1 through 128 characters');
  }
  if (label.length === 0 || label.length > 100) {
    throw new RangeError('Saved location label must contain 1 through 100 characters');
  }

  const coordinates = createCoordinates(
    Number(value.coordinates.latitude),
    Number(value.coordinates.longitude),
  );
  const timeZone =
    typeof value.timeZone === 'string' && value.timeZone.trim().length > 0
      ? assertIanaTimeZone(value.timeZone.trim())
      : undefined;

  return timeZone === undefined ? { id, label, coordinates } : { id, label, coordinates, timeZone };
}

export function savedLocationId(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`;
}

export function parseSavedLocations(raw: string): readonly SavedLocation[] {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== SAVED_LOCATIONS_SCHEMA_VERSION) {
    throw new RangeError('Unsupported saved-locations schema version');
  }
  if (!Array.isArray(parsed.locations)) {
    throw new TypeError('Saved locations must be an array');
  }

  const locations = parsed.locations.map(parseSavedLocation);
  const ids = new Set<string>();
  for (const location of locations) {
    if (ids.has(location.id)) {
      throw new RangeError(`Duplicate saved location id: ${location.id}`);
    }
    ids.add(location.id);
  }
  return locations;
}

export function serializeSavedLocations(locations: readonly SavedLocation[]): string {
  const envelope: SavedLocationEnvelope = {
    version: SAVED_LOCATIONS_SCHEMA_VERSION,
    locations: locations.map(parseSavedLocation),
  };
  return JSON.stringify(envelope);
}

export function loadSavedLocations(storage: KeyValueStorage): readonly SavedLocation[] {
  const raw = storage.getItem(SAVED_LOCATIONS_STORAGE_KEY);
  if (raw === null) return [];
  try {
    return parseSavedLocations(raw);
  } catch {
    return [];
  }
}

export function saveSavedLocations(
  storage: KeyValueStorage,
  locations: readonly SavedLocation[],
): void {
  storage.setItem(SAVED_LOCATIONS_STORAGE_KEY, serializeSavedLocations(locations));
}

export function upsertSavedLocation(
  locations: readonly SavedLocation[],
  location: SavedLocation,
): readonly SavedLocation[] {
  const validated = parseSavedLocation(location);
  const existingIndex = locations.findIndex((candidate) => candidate.id === validated.id);
  if (existingIndex === -1) {
    return [...locations, validated];
  }
  return locations.map((candidate, index) => (index === existingIndex ? validated : candidate));
}

export function removeSavedLocation(
  locations: readonly SavedLocation[],
  id: string,
): readonly SavedLocation[] {
  return locations.filter((location) => location.id !== id);
}
