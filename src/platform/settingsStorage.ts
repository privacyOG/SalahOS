import { createCoordinates } from '../domain/coordinates';
import type { Coordinates } from '../domain/coordinates';
import type { CalculationMethodId } from '../domain/methods';
import { validateMosqueTimetable } from '../domain/mosqueTimetable';
import type { MosqueTimetable, PrayerSourceMode } from '../domain/mosqueTimetable';
import {
  defaultNotificationPreferences,
  parseNotificationPreferences,
} from '../domain/notificationPreferences';
import type { NotificationPreferences } from '../domain/notificationPreferences';
import type { AsrConvention, HighLatitudeRule, PrayerName } from '../domain/prayerEngine';
import { assertIanaTimeZone } from '../domain/timezone';
import type { Locale } from '../i18n/translations';

export const SETTINGS_STORAGE_KEY = 'salahos.settings';
export const SETTINGS_SCHEMA_VERSION = 2;

export type ThemePreference = 'system' | 'light' | 'dark';
export type TimeFormatPreference = 'h12' | 'h23';

export interface PersistedLocation {
  readonly coordinates: Coordinates;
  readonly timeZone?: string;
}

export interface PersistedSettings {
  readonly version: 2;
  readonly locale: Locale;
  readonly theme: ThemePreference;
  readonly timeFormat: TimeFormatPreference;
  readonly calculationMethodId: Exclude<CalculationMethodId, 'custom'>;
  readonly asrConvention: AsrConvention;
  readonly highLatitudeRule: HighLatitudeRule;
  readonly hijriCorrectionDays: number;
  readonly prayerAdjustments: Readonly<Partial<Record<PrayerName, number>>>;
  readonly prayerSourceMode: PrayerSourceMode;
  readonly location: PersistedLocation | null;
  readonly mosqueTimetable: MosqueTimetable | null;
  readonly notifications: NotificationPreferences;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const BUILT_IN_METHODS = new Set<Exclude<CalculationMethodId, 'custom'>>([
  'muslim-world-league',
  'umm-al-qura',
  'egyptian',
  'karachi',
  'isna',
  'diyanet',
  'muis',
  'dubai',
  'kuwait',
  'qatar',
]);
const PRAYER_NAMES: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const defaultPersistedSettings: PersistedSettings = Object.freeze({
  version: SETTINGS_SCHEMA_VERSION,
  locale: 'en',
  theme: 'system',
  timeFormat: 'h23',
  calculationMethodId: 'muslim-world-league',
  asrConvention: 'standard',
  highLatitudeRule: 'angle-based',
  hijriCorrectionDays: 0,
  prayerAdjustments: Object.freeze({}),
  prayerSourceMode: 'calculated',
  location: null,
  mosqueTimetable: null,
  notifications: defaultNotificationPreferences,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLocale(value: unknown): Locale {
  return value === 'ar' ? 'ar' : 'en';
}

function parseTheme(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

function parseTimeFormat(value: unknown): TimeFormatPreference {
  return value === 'h12' ? 'h12' : 'h23';
}

function parseMethod(value: unknown): PersistedSettings['calculationMethodId'] {
  if (
    typeof value === 'string' &&
    BUILT_IN_METHODS.has(value as PersistedSettings['calculationMethodId'])
  ) {
    return value as PersistedSettings['calculationMethodId'];
  }
  return defaultPersistedSettings.calculationMethodId;
}

function parseAsrConvention(value: unknown): AsrConvention {
  return value === 'hanafi' ? 'hanafi' : 'standard';
}

function parseHighLatitudeRule(value: unknown): HighLatitudeRule {
  if (value === 'middle-of-the-night' || value === 'one-seventh') {
    return value;
  }
  return 'angle-based';
}

function parseHijriCorrection(value: unknown): number {
  return Number.isInteger(value) && Number(value) >= -2 && Number(value) <= 2 ? Number(value) : 0;
}

function parseSourceMode(value: unknown): PrayerSourceMode {
  if (value === 'local-mosque' || value === 'calculated-adjustments') {
    return value;
  }
  return 'calculated';
}

function parseLocation(value: unknown): PersistedLocation | null {
  if (!isRecord(value) || !isRecord(value.coordinates)) {
    return null;
  }

  try {
    const coordinates = createCoordinates(
      Number(value.coordinates.latitude),
      Number(value.coordinates.longitude),
    );
    const timeZone =
      typeof value.timeZone === 'string' && value.timeZone.trim()
        ? assertIanaTimeZone(value.timeZone.trim())
        : undefined;
    return timeZone === undefined ? { coordinates } : { coordinates, timeZone };
  } catch {
    return null;
  }
}

function parsePrayerAdjustments(value: unknown): PersistedSettings['prayerAdjustments'] {
  if (!isRecord(value)) {
    return {};
  }

  const parsed: Partial<Record<PrayerName, number>> = {};
  for (const prayer of PRAYER_NAMES) {
    const adjustment = value[prayer];
    if (
      adjustment !== undefined &&
      Number.isInteger(adjustment) &&
      Number(adjustment) >= -180 &&
      Number(adjustment) <= 180
    ) {
      parsed[prayer] = Number(adjustment);
    }
  }
  return parsed;
}

function parseMosqueTimetable(value: unknown): MosqueTimetable | null {
  if (!isRecord(value)) {
    return null;
  }

  try {
    const candidate = value as unknown as MosqueTimetable;
    validateMosqueTimetable(candidate);
    return candidate;
  } catch {
    return null;
  }
}

function migrateSettings(value: Record<string, unknown>): Record<string, unknown> {
  if (!('version' in value)) {
    return {
      version: SETTINGS_SCHEMA_VERSION,
      locale: value.locale,
      location: isRecord(value.coordinates)
        ? { coordinates: value.coordinates, timeZone: value.timeZone }
        : value.location,
      notifications: defaultNotificationPreferences,
    };
  }

  if (value.version === 1) {
    return {
      ...value,
      version: SETTINGS_SCHEMA_VERSION,
      notifications: defaultNotificationPreferences,
    };
  }

  return value;
}

export function parsePersistedSettings(raw: string): PersistedSettings {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new TypeError('Persisted settings must be an object');
  }

  const migrated = migrateSettings(parsed);
  if (migrated.version !== SETTINGS_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported settings schema version: ${String(migrated.version)}`);
  }

  return {
    version: SETTINGS_SCHEMA_VERSION,
    locale: parseLocale(migrated.locale),
    theme: parseTheme(migrated.theme),
    timeFormat: parseTimeFormat(migrated.timeFormat),
    calculationMethodId: parseMethod(migrated.calculationMethodId),
    asrConvention: parseAsrConvention(migrated.asrConvention),
    highLatitudeRule: parseHighLatitudeRule(migrated.highLatitudeRule),
    hijriCorrectionDays: parseHijriCorrection(migrated.hijriCorrectionDays),
    prayerAdjustments: parsePrayerAdjustments(migrated.prayerAdjustments),
    prayerSourceMode: parseSourceMode(migrated.prayerSourceMode),
    location: parseLocation(migrated.location),
    mosqueTimetable: parseMosqueTimetable(migrated.mosqueTimetable),
    notifications: parseNotificationPreferences(migrated.notifications),
  };
}

export function serializePersistedSettings(settings: PersistedSettings): string {
  return JSON.stringify(settings);
}

export function loadPersistedSettings(storage: KeyValueStorage): PersistedSettings {
  const raw = storage.getItem(SETTINGS_STORAGE_KEY);
  if (raw === null) {
    return defaultPersistedSettings;
  }

  try {
    return parsePersistedSettings(raw);
  } catch {
    return defaultPersistedSettings;
  }
}

export function savePersistedSettings(storage: KeyValueStorage, settings: PersistedSettings): void {
  storage.setItem(SETTINGS_STORAGE_KEY, serializePersistedSettings(settings));
}

export function resetPersistedSettings(storage: KeyValueStorage): void {
  storage.removeItem(SETTINGS_STORAGE_KEY);
}

export function importPersistedSettings(raw: string): PersistedSettings {
  return parsePersistedSettings(raw);
}

export function exportPersistedSettings(settings: PersistedSettings): string {
  return serializePersistedSettings(settings);
}
