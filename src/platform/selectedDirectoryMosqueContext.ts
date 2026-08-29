import { createCoordinates, type Coordinates } from '../domain/coordinates';
import type { MosqueDirectoryPrayerSummary } from '../domain/mosqueDirectoryEnrichment';
import { assertIanaTimeZone } from '../domain/timezone';
import type { KeyValueStorage } from './settingsStorage';

export const SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY =
  'salahos.selectedDirectoryMosqueContext';
export const SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION = 1;

export interface SelectedDirectoryMosqueContext {
  readonly mosqueId: string;
  readonly mosqueName: string;
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly prayerTimes: MosqueDirectoryPrayerSummary | null;
}

type JsonRecord = Record<string, unknown>;

const PRAYER_TIME_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PRAYER_METADATA_KEYS = ['timetableUrl', 'sourceLabel', 'updatedAt'] as const;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizedString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0) throw new TypeError(`${label} must not be empty`);
  return normalized;
}

function optionalString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  return normalizedString(value, `Selected directory mosque ${key}`);
}

function parsePrayerTimes(value: unknown): MosqueDirectoryPrayerSummary | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new TypeError('Selected directory mosque prayer times are invalid');

  const output: Record<string, string> = {};
  for (const key of [...PRAYER_TIME_KEYS, ...PRAYER_METADATA_KEYS]) {
    const parsed = optionalString(value, key);
    if (parsed !== undefined) output[key] = parsed;
  }
  return Object.freeze(output as MosqueDirectoryPrayerSummary);
}

function normalizeContext(value: unknown): SelectedDirectoryMosqueContext {
  if (!isRecord(value)) throw new TypeError('Selected directory mosque context must be an object');
  if (!isRecord(value.coordinates)) {
    throw new TypeError('Selected directory mosque coordinates are invalid');
  }

  return Object.freeze({
    mosqueId: normalizedString(value.mosqueId, 'Selected directory mosque ID'),
    mosqueName: normalizedString(value.mosqueName, 'Selected directory mosque name'),
    coordinates: createCoordinates(
      Number(value.coordinates.latitude),
      Number(value.coordinates.longitude),
    ),
    timeZone: assertIanaTimeZone(
      normalizedString(value.timeZone, 'Selected directory mosque timezone'),
    ),
    prayerTimes: parsePrayerTimes(value.prayerTimes),
  });
}

export function parseSelectedDirectoryMosqueContext(raw: string): SelectedDirectoryMosqueContext {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION) {
    throw new RangeError('Unsupported selected-directory-mosque context schema version');
  }
  return normalizeContext(parsed);
}

export function loadSelectedDirectoryMosqueContext(
  storage: KeyValueStorage,
): SelectedDirectoryMosqueContext | null {
  const raw = storage.getItem(SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY);
  if (raw === null) return null;
  try {
    return parseSelectedDirectoryMosqueContext(raw);
  } catch {
    return null;
  }
}

export function saveSelectedDirectoryMosqueContext(
  storage: KeyValueStorage,
  context: SelectedDirectoryMosqueContext,
): void {
  const normalized = normalizeContext(context);
  storage.setItem(
    SELECTED_DIRECTORY_MOSQUE_CONTEXT_STORAGE_KEY,
    JSON.stringify({
      version: SELECTED_DIRECTORY_MOSQUE_CONTEXT_SCHEMA_VERSION,
      ...normalized,
    }),
  );
}
