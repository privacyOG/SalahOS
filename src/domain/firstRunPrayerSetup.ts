import type { Coordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { calculationMethods, type CalculationMethodId } from './methods';
import type { HighLatitudeRule, PrayerName } from './prayerEngine';

export type BuiltInCalculationMethodId = Exclude<CalculationMethodId, 'custom'>;

export const DEFAULT_SUGGESTED_CALCULATION_METHOD: BuiltInCalculationMethodId =
  'muslim-world-league';

/**
 * Offline regional starter suggestions for first-run setup. This is deliberately
 * an explicit ISO 3166-1 alpha-2 mapping rather than a network lookup. A country
 * not listed here falls back to Muslim World League. The suggestion is not a
 * claim that every mosque in a country follows the same convention.
 */
export const calculationMethodSuggestionByCountry: Readonly<
  Partial<Record<string, BuiltInCalculationMethodId>>
> = Object.freeze({
  AU: 'muslim-world-league',
  NZ: 'muslim-world-league',
  SA: 'umm-al-qura',
  EG: 'egyptian',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
  US: 'isna',
  CA: 'isna',
  TR: 'diyanet',
  SG: 'muis',
  AE: 'dubai',
  KW: 'kuwait',
  QA: 'qatar',
});

export function suggestedCalculationMethodForCountry(
  isoCountryCode: string | null | undefined,
): BuiltInCalculationMethodId {
  const normalized = isoCountryCode?.trim().toUpperCase();
  if (!normalized) return DEFAULT_SUGGESTED_CALCULATION_METHOD;
  return calculationMethodSuggestionByCountry[normalized] ?? DEFAULT_SUGGESTED_CALCULATION_METHOD;
}

type TimeZoneCountryHint = Readonly<{
  value: string;
  countryCode: string;
  match: 'exact' | 'prefix';
}>;

/**
 * Conservative offline hints used only to connect a known IANA timezone to the
 * ISO-country recommendation table. Ambiguous or unknown zones intentionally
 * return null so the documented MWL fallback is used rather than guessing.
 */
const timeZoneCountryHints: readonly TimeZoneCountryHint[] = Object.freeze([
  { value: 'Australia/', countryCode: 'AU', match: 'prefix' },
  { value: 'Pacific/Auckland', countryCode: 'NZ', match: 'exact' },
  { value: 'Pacific/Chatham', countryCode: 'NZ', match: 'exact' },
  { value: 'Asia/Riyadh', countryCode: 'SA', match: 'exact' },
  { value: 'Africa/Cairo', countryCode: 'EG', match: 'exact' },
  { value: 'Asia/Karachi', countryCode: 'PK', match: 'exact' },
  { value: 'Asia/Kolkata', countryCode: 'IN', match: 'exact' },
  { value: 'Asia/Calcutta', countryCode: 'IN', match: 'exact' },
  { value: 'Asia/Dhaka', countryCode: 'BD', match: 'exact' },
  { value: 'Asia/Dacca', countryCode: 'BD', match: 'exact' },
  { value: 'Asia/Kabul', countryCode: 'AF', match: 'exact' },
  { value: 'Europe/Istanbul', countryCode: 'TR', match: 'exact' },
  { value: 'Asia/Istanbul', countryCode: 'TR', match: 'exact' },
  { value: 'Asia/Singapore', countryCode: 'SG', match: 'exact' },
  { value: 'Singapore', countryCode: 'SG', match: 'exact' },
  { value: 'Asia/Dubai', countryCode: 'AE', match: 'exact' },
  { value: 'Asia/Kuwait', countryCode: 'KW', match: 'exact' },
  { value: 'Asia/Qatar', countryCode: 'QA', match: 'exact' },
  { value: 'America/Toronto', countryCode: 'CA', match: 'exact' },
  { value: 'America/Vancouver', countryCode: 'CA', match: 'exact' },
  { value: 'America/Edmonton', countryCode: 'CA', match: 'exact' },
  { value: 'America/Winnipeg', countryCode: 'CA', match: 'exact' },
  { value: 'America/Halifax', countryCode: 'CA', match: 'exact' },
  { value: 'America/St_Johns', countryCode: 'CA', match: 'exact' },
  { value: 'America/Regina', countryCode: 'CA', match: 'exact' },
  { value: 'America/New_York', countryCode: 'US', match: 'exact' },
  { value: 'America/Chicago', countryCode: 'US', match: 'exact' },
  { value: 'America/Denver', countryCode: 'US', match: 'exact' },
  { value: 'America/Los_Angeles', countryCode: 'US', match: 'exact' },
  { value: 'America/Phoenix', countryCode: 'US', match: 'exact' },
  { value: 'America/Anchorage', countryCode: 'US', match: 'exact' },
  { value: 'America/Adak', countryCode: 'US', match: 'exact' },
  { value: 'Pacific/Honolulu', countryCode: 'US', match: 'exact' },
]);

export function inferIsoCountryCodeFromTimeZone(timeZone: string | undefined): string | null {
  const normalized = timeZone?.trim();
  if (!normalized) return null;
  const hint = timeZoneCountryHints.find((candidate) =>
    candidate.match === 'prefix'
      ? normalized.startsWith(candidate.value)
      : normalized === candidate.value,
  );
  return hint?.countryCode ?? null;
}

export interface AsrConventionPreview {
  readonly standardLocalMinutes: number | null;
  readonly hanafiLocalMinutes: number | null;
}

/** Calculate today's Standard and Hanafi Asr using the same prayer engine as the app. */
export function calculateAsrConventionPreview(input: {
  readonly instant: Date;
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly methodId: BuiltInCalculationMethodId;
  readonly highLatitudeRule?: HighLatitudeRule;
  readonly adjustments?: Readonly<Partial<Record<PrayerName, number>>>;
}): AsrConventionPreview {
  const method = calculationMethods[input.methodId];
  const shared = {
    instant: input.instant,
    coordinates: input.coordinates,
    timeZone: input.timeZone,
    method,
    ...(input.highLatitudeRule === undefined ? {} : { highLatitudeRule: input.highLatitudeRule }),
    ...(input.adjustments === undefined ? {} : { adjustments: input.adjustments }),
  };
  const standard = buildPrayerDashboard({ ...shared, asrConvention: 'standard' });
  const hanafi = buildPrayerDashboard({ ...shared, asrConvention: 'hanafi' });
  return Object.freeze({
    standardLocalMinutes: standard.today.prayers.asr.roundedLocalMinutes,
    hanafiLocalMinutes: hanafi.today.prayers.asr.roundedLocalMinutes,
  });
}
