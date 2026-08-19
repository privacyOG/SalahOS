import type { KeyValueStorage } from './settingsStorage';

export const RAMADAN_PRESENTATION_STORAGE_KEY = 'salahos.ramadan-presentation';
const RAMADAN_PRESENTATION_SCHEMA_VERSION = 1;

export interface RamadanPresentationPreferences {
  readonly version: 1;
  readonly imsakMinutesBeforeFajr: number | null;
}

export const defaultRamadanPresentationPreferences: RamadanPresentationPreferences = Object.freeze({
  version: RAMADAN_PRESENTATION_SCHEMA_VERSION,
  imsakMinutesBeforeFajr: null,
});

function parseImsakOffset(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 240) {
    throw new RangeError('Imsak offset must be an integer between 0 and 240 minutes');
  }
  return Number(value);
}

export function parseRamadanPresentationPreferences(
  raw: string,
): RamadanPresentationPreferences {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('Ramadan presentation preferences must be an object');
  }

  const value = parsed as Record<string, unknown>;
  if (value.version !== RAMADAN_PRESENTATION_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported Ramadan presentation schema version: ${String(value.version)}`);
  }

  return Object.freeze({
    version: RAMADAN_PRESENTATION_SCHEMA_VERSION,
    imsakMinutesBeforeFajr: parseImsakOffset(value.imsakMinutesBeforeFajr),
  });
}

export function loadRamadanPresentationPreferences(
  storage: KeyValueStorage,
): RamadanPresentationPreferences {
  const raw = storage.getItem(RAMADAN_PRESENTATION_STORAGE_KEY);
  if (raw === null) {
    return defaultRamadanPresentationPreferences;
  }

  try {
    return parseRamadanPresentationPreferences(raw);
  } catch {
    return defaultRamadanPresentationPreferences;
  }
}

export function saveRamadanPresentationPreferences(
  storage: KeyValueStorage,
  preferences: RamadanPresentationPreferences,
): void {
  storage.setItem(RAMADAN_PRESENTATION_STORAGE_KEY, JSON.stringify(preferences));
}
