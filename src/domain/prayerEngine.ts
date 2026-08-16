import { solarCoordinates, solarDayEvents, solarEventUtcMinutes } from './astronomy';
import { resolveCalculationMethodForCivilDate } from './methodCalendarPolicy';
import type { CalculationMethod } from './methods';
import { defaultRoundingPolicy, roundMinutes } from './rounding';
import type { RoundingPolicy } from './rounding';

const DAY_MINUTES = 1_440;
const DAY_MS = 86_400_000;

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type ObligatoryPrayerName = Exclude<PrayerName, 'sunrise'>;
export type AsrConvention = 'standard' | 'hanafi';
export type HighLatitudeRule = 'middle-of-the-night' | 'one-seventh' | 'angle-based';

export interface PrayerProvenance {
  readonly methodId: CalculationMethod['id'];
  readonly methodName: string;
  readonly methodVerification: CalculationMethod['verification'];
  readonly asrConvention: AsrConvention;
  readonly highLatitudeRule: HighLatitudeRule;
  readonly highLatitudeRuleApplied: boolean;
  readonly source: 'astronomical' | 'fixed-interval' | 'high-latitude-fallback' | 'unavailable';
  readonly formula: string;
  readonly manualAdjustmentMinutes: number;
  readonly roundingPolicy: RoundingPolicy;
}

export interface PrayerTimeResult {
  readonly name: PrayerName;
  readonly rawUtcMinutes: number | null;
  readonly rawLocalMinutes: number | null;
  readonly baseLocalMinutes: number | null;
  readonly adjustedLocalMinutes: number | null;
  readonly roundedLocalMinutes: number | null;
  readonly provenance: PrayerProvenance;
}

export interface PrayerSchedule {
  readonly date: string;
  readonly utcOffsetMinutes: number;
  readonly method: CalculationMethod;
  readonly asrConvention: AsrConvention;
  readonly highLatitudeRule: HighLatitudeRule;
  readonly prayers: Readonly<Record<PrayerName, PrayerTimeResult>>;
}

export interface PrayerCalculationInput {
  readonly date: Date;
  readonly latitude: number;
  readonly longitude: number;
  readonly utcOffsetMinutes: number;
  readonly method: CalculationMethod;
  readonly asrConvention?: AsrConvention;
  readonly highLatitudeRule?: HighLatitudeRule;
  readonly adjustments?: Readonly<Partial<Record<PrayerName, number>>>;
  readonly roundingPolicy?: RoundingPolicy;
}

interface BaseEvent {
  readonly rawUtcMinutes: number | null;
  readonly effectiveUtcMinutes: number | null;
  readonly source: PrayerProvenance['source'];
  readonly formula: string;
  readonly highLatitudeRuleApplied: boolean;
}

function civilDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

function normalizeDayMinutes(minutes: number): number {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function addDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 0, 0, 0, 0),
  );
}

function validateInput(input: PrayerCalculationInput): void {
  if (
    !Number.isFinite(input.utcOffsetMinutes) ||
    input.utcOffsetMinutes < -840 ||
    input.utcOffsetMinutes > 840
  ) {
    throw new RangeError('UTC offset must be between -840 and 840 minutes');
  }

  for (const [name, adjustment] of Object.entries(input.adjustments ?? {})) {
    if (!Number.isFinite(adjustment) || adjustment < -180 || adjustment > 180) {
      throw new RangeError(`${name} adjustment must be between -180 and 180 minutes`);
    }
  }
}

function asrAltitudeDegrees(
  date: Date,
  latitudeDegrees: number,
  convention: AsrConvention,
): number {
  const midday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0),
  );
  const declination = solarCoordinates(midday).declinationDegrees;
  const shadowFactor = convention === 'standard' ? 1 : 2;
  const noonShadow = Math.tan((Math.abs(latitudeDegrees - declination) * Math.PI) / 180);
  return (Math.atan(1 / (shadowFactor + noonShadow)) * 180) / Math.PI;
}

function highLatitudePortion(rule: HighLatitudeRule, angleDegrees: number): number {
  switch (rule) {
    case 'middle-of-the-night':
      return 0.5;
    case 'one-seventh':
      return 1 / 7;
    case 'angle-based':
      return Math.min(0.5, angleDegrees / 60);
  }
}

function previousNightBounds(
  date: Date,
  latitude: number,
  longitude: number,
): { readonly previousSunset: number; readonly sunrise: number } | null {
  const sunrise = solarDayEvents(date, latitude, longitude).sunriseUtcMinutes;
  const previousSunset = solarDayEvents(addDays(date, -1), latitude, longitude).sunsetUtcMinutes;

  if (sunrise === null || previousSunset === null) {
    return null;
  }

  return { previousSunset: previousSunset - DAY_MINUTES, sunrise };
}

function nextNightBounds(
  date: Date,
  latitude: number,
  longitude: number,
): { readonly sunset: number; readonly nextSunrise: number } | null {
  const sunset = solarDayEvents(date, latitude, longitude).sunsetUtcMinutes;
  const nextSunrise = solarDayEvents(addDays(date, 1), latitude, longitude).sunriseUtcMinutes;

  if (sunset === null || nextSunrise === null) {
    return null;
  }

  return { sunset, nextSunrise: nextSunrise + DAY_MINUTES };
}

function applyFajrHighLatitudeRule(
  date: Date,
  latitude: number,
  longitude: number,
  rawUtcMinutes: number | null,
  angleDegrees: number,
  rule: HighLatitudeRule,
): BaseEvent {
  const bounds = previousNightBounds(date, latitude, longitude);
  if (bounds === null) {
    return {
      rawUtcMinutes,
      effectiveUtcMinutes: rawUtcMinutes,
      source: rawUtcMinutes === null ? 'unavailable' : 'astronomical',
      formula: `Sun altitude -${String(angleDegrees)}° before solar noon`,
      highLatitudeRuleApplied: false,
    };
  }

  const nightDuration = bounds.sunrise - bounds.previousSunset;
  const limit = bounds.sunrise - nightDuration * highLatitudePortion(rule, angleDegrees);
  const requiresFallback = rawUtcMinutes === null || rawUtcMinutes < limit;

  return {
    rawUtcMinutes,
    effectiveUtcMinutes: requiresFallback ? limit : rawUtcMinutes,
    source: requiresFallback ? 'high-latitude-fallback' : 'astronomical',
    formula: requiresFallback
      ? `${rule} Fajr portion of previous night`
      : `Sun altitude -${String(angleDegrees)}° before solar noon`,
    highLatitudeRuleApplied: requiresFallback,
  };
}

function applyIshaHighLatitudeRule(
  date: Date,
  latitude: number,
  longitude: number,
  rawUtcMinutes: number | null,
  angleDegrees: number,
  rule: HighLatitudeRule,
): BaseEvent {
  const bounds = nextNightBounds(date, latitude, longitude);
  if (bounds === null) {
    return {
      rawUtcMinutes,
      effectiveUtcMinutes: rawUtcMinutes,
      source: rawUtcMinutes === null ? 'unavailable' : 'astronomical',
      formula: `Sun altitude -${String(angleDegrees)}° after solar noon`,
      highLatitudeRuleApplied: false,
    };
  }

  const nightDuration = bounds.nextSunrise - bounds.sunset;
  const limit = bounds.sunset + nightDuration * highLatitudePortion(rule, angleDegrees);
  const comparableRaw =
    rawUtcMinutes === null || rawUtcMinutes < bounds.sunset ? null : rawUtcMinutes;
  const requiresFallback = comparableRaw === null || comparableRaw > limit;

  return {
    rawUtcMinutes,
    effectiveUtcMinutes: requiresFallback ? limit : comparableRaw,
    source: requiresFallback ? 'high-latitude-fallback' : 'astronomical',
    formula: requiresFallback
      ? `${rule} Isha portion of following night`
      : `Sun altitude -${String(angleDegrees)}° after solar noon`,
    highLatitudeRuleApplied: requiresFallback,
  };
}

function directEvent(
  rawUtcMinutes: number | null,
  formula: string,
  source: PrayerProvenance['source'] = 'astronomical',
): BaseEvent {
  return {
    rawUtcMinutes,
    effectiveUtcMinutes: rawUtcMinutes,
    source: rawUtcMinutes === null ? 'unavailable' : source,
    formula,
    highLatitudeRuleApplied: false,
  };
}

function makePrayerResult(
  name: PrayerName,
  event: BaseEvent,
  input: PrayerCalculationInput,
  asrConvention: AsrConvention,
  highLatitudeRule: HighLatitudeRule,
  roundingPolicy: RoundingPolicy,
): PrayerTimeResult {
  const adjustment = input.adjustments?.[name] ?? 0;
  const rawLocalMinutes =
    event.rawUtcMinutes === null
      ? null
      : normalizeDayMinutes(event.rawUtcMinutes + input.utcOffsetMinutes);
  const baseLocalMinutes =
    event.effectiveUtcMinutes === null
      ? null
      : normalizeDayMinutes(event.effectiveUtcMinutes + input.utcOffsetMinutes);
  const adjustedLocalMinutes =
    baseLocalMinutes === null ? null : normalizeDayMinutes(baseLocalMinutes + adjustment);
  const roundedLocalMinutes =
    adjustedLocalMinutes === null
      ? null
      : normalizeDayMinutes(roundMinutes(adjustedLocalMinutes, roundingPolicy));

  return {
    name,
    rawUtcMinutes: event.rawUtcMinutes,
    rawLocalMinutes,
    baseLocalMinutes,
    adjustedLocalMinutes,
    roundedLocalMinutes,
    provenance: {
      methodId: input.method.id,
      methodName: input.method.name,
      methodVerification: input.method.verification,
      asrConvention,
      highLatitudeRule,
      highLatitudeRuleApplied: event.highLatitudeRuleApplied,
      source: event.source,
      formula: event.formula,
      manualAdjustmentMinutes: adjustment,
      roundingPolicy,
    },
  };
}

/**
 * Calculate the five obligatory prayers plus sunrise for one civil date.
 * The engine is pure: it does not read device time, timezone, location, storage,
 * DOM, network, or platform APIs. Callers provide the resolved UTC offset.
 * Named calendar-dependent method policy is resolved from the supplied civil
 * date before astronomical/fixed-interval calculation.
 */
export function calculatePrayerSchedule(input: PrayerCalculationInput): PrayerSchedule {
  validateInput(input);

  const method = resolveCalculationMethodForCivilDate(input.method, input.date);
  const resolvedInput: PrayerCalculationInput = { ...input, method };
  const asrConvention = input.asrConvention ?? 'standard';
  const highLatitudeRule = input.highLatitudeRule ?? 'angle-based';
  const roundingPolicy = input.roundingPolicy ?? defaultRoundingPolicy;
  const dayEvents = solarDayEvents(input.date, input.latitude, input.longitude);

  const fajrRaw = solarEventUtcMinutes(
    input.date,
    input.latitude,
    input.longitude,
    -method.fajrAngleDegrees,
    'morning',
  );
  const fajr = applyFajrHighLatitudeRule(
    input.date,
    input.latitude,
    input.longitude,
    fajrRaw,
    method.fajrAngleDegrees,
    highLatitudeRule,
  );

  const asrAltitude = asrAltitudeDegrees(input.date, input.latitude, asrConvention);
  const asrRaw = solarEventUtcMinutes(
    input.date,
    input.latitude,
    input.longitude,
    asrAltitude,
    'evening',
  );

  const maghrib = directEvent(dayEvents.sunsetUtcMinutes, 'Apparent sunset');

  let isha: BaseEvent;
  if (method.ishaRule.kind === 'interval') {
    const ishaRaw =
      dayEvents.sunsetUtcMinutes === null
        ? null
        : dayEvents.sunsetUtcMinutes + method.ishaRule.minutesAfterMaghrib;
    isha = directEvent(
      ishaRaw,
      `${String(method.ishaRule.minutesAfterMaghrib)} minutes after Maghrib`,
      'fixed-interval',
    );
  } else {
    const ishaRaw = solarEventUtcMinutes(
      input.date,
      input.latitude,
      input.longitude,
      -method.ishaRule.angleDegrees,
      'evening',
    );
    isha = applyIshaHighLatitudeRule(
      input.date,
      input.latitude,
      input.longitude,
      ishaRaw,
      method.ishaRule.angleDegrees,
      highLatitudeRule,
    );
  }

  const events: Record<PrayerName, BaseEvent> = {
    fajr,
    sunrise: directEvent(dayEvents.sunriseUtcMinutes, 'Apparent sunrise'),
    dhuhr: directEvent(dayEvents.solarNoonUtcMinutes, 'Local apparent solar noon'),
    asr: directEvent(
      asrRaw,
      `${String(asrConvention === 'standard' ? 1 : 2)}× shadow-length Asr convention`,
    ),
    maghrib,
    isha,
  };

  return {
    date: civilDateKey(input.date),
    utcOffsetMinutes: input.utcOffsetMinutes,
    method,
    asrConvention,
    highLatitudeRule,
    prayers: {
      fajr: makePrayerResult(
        'fajr',
        events.fajr,
        resolvedInput,
        asrConvention,
        highLatitudeRule,
        roundingPolicy,
      ),
      sunrise: makePrayerResult(
        'sunrise',
        events.sunrise,
        resolvedInput,
        asrConvention,
        highLatitudeRule,
        roundingPolicy,
      ),
      dhuhr: makePrayerResult(
        'dhuhr',
        events.dhuhr,
        resolvedInput,
        asrConvention,
        highLatitudeRule,
        roundingPolicy,
      ),
      asr: makePrayerResult(
        'asr',
        events.asr,
        resolvedInput,
        asrConvention,
        highLatitudeRule,
        roundingPolicy,
      ),
      maghrib: makePrayerResult(
        'maghrib',
        events.maghrib,
        resolvedInput,
        asrConvention,
        highLatitudeRule,
        roundingPolicy,
      ),
      isha: makePrayerResult(
        'isha',
        events.isha,
        resolvedInput,
        asrConvention,
        highLatitudeRule,
        roundingPolicy,
      ),
    },
  };
}

export const prayerEngineAssumptions = Object.freeze({
  initialAsrConvention: 'standard' as const,
  initialHighLatitudeRule: 'angle-based' as const,
  maxManualAdjustmentMinutes: 180,
});

export function prayerDayDurationMilliseconds(): number {
  return DAY_MS;
}
