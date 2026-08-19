import type { KeyValueStorage } from './settingsStorage';

export const RAMADAN_PRESENTATION_STORAGE_KEY = 'salahos.ramadan-presentation';
const RAMADAN_PRESENTATION_SCHEMA_VERSION = 1;

export const RAMADAN_IMSAK_OFFSET_OPTIONS = [5, 10, 15, 20, 30] as const;
export type RamadanImsakOffset = (typeof RAMADAN_IMSAK_OFFSET_OPTIONS)[number];

export interface RamadanPresentationPreferences {
  readonly version: 1;
  readonly imsakMinutesBeforeFajr: RamadanImsakOffset | null;
}

export const defaultRamadanPresentationPreferences: RamadanPresentationPreferences = Object.freeze({
  version: RAMADAN_PRESENTATION_SCHEMA_VERSION,
  imsakMinutesBeforeFajr: null,
});

function parseImsakOffset(value: unknown): RamadanImsakOffset | null {
  if (value === null || value === undefined) {
    return null;
  }

  const offset = Number(value);
  if (
    !Number.isInteger(offset) ||
    !RAMADAN_IMSAK_OFFSET_OPTIONS.includes(offset as RamadanImsakOffset)
  ) {
    throw new RangeError('Imsak offset must be one of the supported explicit display choices');
  }
  return offset as RamadanImsakOffset;
}

export function parseRamadanPresentationPreferences(raw: string): RamadanPresentationPreferences {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('Ramadan presentation preferences must be an object');
  }

  const value = parsed as Record<string, unknown>;
  if (value.version !== RAMADAN_PRESENTATION_SCHEMA_VERSION) {
    throw new RangeError(
      `Unsupported Ramadan presentation schema version: ${String(value.version)}`,
    );
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
