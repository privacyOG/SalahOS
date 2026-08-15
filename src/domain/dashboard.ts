import { calendarDate } from './calendar';
import type { Coordinates } from './coordinates';
import { createLocationPrayerContext } from './locationPrayerContext';
import { calculationMethods } from './methods';
import type { CalculationMethod } from './methods';
import { findNextPrayer } from './nextPrayer';
import { calculatePrayerSchedule } from './prayerEngine';
import type {
  AsrConvention,
  HighLatitudeRule,
  ObligatoryPrayerName,
  PrayerName,
  PrayerSchedule,
} from './prayerEngine';
import { utcOffsetMinutesAt } from './timezone';

const DAY_MS = 86_400_000;
const PRAYER_ORDER: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface LocalClockParts {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly localMinutes: number;
}

export interface DashboardPrayerRow {
  readonly name: PrayerName;
  readonly localMinutes: number | null;
  readonly isNext: boolean;
  readonly highLatitudeRuleApplied: boolean;
  readonly manualAdjustmentMinutes: number;
}

export interface PrayerDashboardModel {
  readonly generatedAt: Date;
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly utcOffsetMinutes: number;
  readonly civilDate: Date;
  readonly clock: LocalClockParts;
  readonly gregorian: ReturnType<typeof calendarDate>['gregorian'];
  readonly hijri: ReturnType<typeof calendarDate>['hijri'];
  readonly method: CalculationMethod;
  readonly asrConvention: AsrConvention;
  readonly highLatitudeRule: HighLatitudeRule;
  readonly today: PrayerSchedule;
  readonly tomorrow: PrayerSchedule;
  readonly prayers: readonly DashboardPrayerRow[];
  readonly nextPrayer: ObligatoryPrayerName | null;
  readonly nextPrayerDayOffset: 0 | 1 | null;
  readonly nextPrayerLocalMinutes: number | null;
  readonly secondsUntilNextPrayer: number | null;
  readonly hasHighLatitudeFallback: boolean;
  readonly hasManualAdjustments: boolean;
}

function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) {
    throw new Error(`Clock formatter did not return ${type}`);
  }

  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric)) {
    throw new Error(`Clock formatter returned non-numeric ${type}`);
  }

  return numeric;
}

export function localClockParts(instant: Date, timeZone: string): LocalClockParts {
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError('Instant must be valid');
  }

  const parts = new Intl.DateTimeFormat('en-GB-u-nu-latn', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const hour = numericPart(parts, 'hour');
  const minute = numericPart(parts, 'minute');
  const second = numericPart(parts, 'second');

  return {
    hour,
    minute,
    second,
    localMinutes: hour * 60 + minute + second / 60,
  };
}

function addCivilDays(civilDate: Date, days: number): Date {
  return new Date(civilDate.getTime() + days * DAY_MS);
}

function offsetForCivilDate(civilDate: Date, timeZone: string): number {
  const representativeInstant = new Date(civilDate.getTime() + 12 * 60 * 60 * 1_000);
  return utcOffsetMinutesAt(representativeInstant, timeZone);
}

function scheduleFor(
  civilDate: Date,
  coordinates: Coordinates,
  utcOffsetMinutes: number,
  method: CalculationMethod,
  asrConvention: AsrConvention,
  highLatitudeRule: HighLatitudeRule,
  adjustments: Readonly<Partial<Record<PrayerName, number>>>,
): PrayerSchedule {
  return calculatePrayerSchedule({
    date: civilDate,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    utcOffsetMinutes,
    method,
    asrConvention,
    highLatitudeRule,
    adjustments,
  });
}

export function buildPrayerDashboard(input: {
  readonly instant: Date;
  readonly coordinates: Coordinates;
  readonly method?: CalculationMethod;
  readonly asrConvention?: AsrConvention;
  readonly highLatitudeRule?: HighLatitudeRule;
  readonly adjustments?: Readonly<Partial<Record<PrayerName, number>>>;
  readonly hijriCorrectionDays?: number;
}): PrayerDashboardModel {
  const method = input.method ?? calculationMethods['muslim-world-league'];
  const asrConvention = input.asrConvention ?? 'standard';
  const highLatitudeRule = input.highLatitudeRule ?? 'angle-based';
  const adjustments = input.adjustments ?? {};
  const context = createLocationPrayerContext(input.instant, input.coordinates);
  const clock = localClockParts(input.instant, context.timeZone);
  const today = scheduleFor(
    context.civilDate,
    input.coordinates,
    context.utcOffsetMinutes,
    method,
    asrConvention,
    highLatitudeRule,
    adjustments,
  );
  const tomorrowCivilDate = addCivilDays(context.civilDate, 1);
  const tomorrow = scheduleFor(
    tomorrowCivilDate,
    input.coordinates,
    offsetForCivilDate(tomorrowCivilDate, context.timeZone),
    method,
    asrConvention,
    highLatitudeRule,
    adjustments,
  );
  const next = findNextPrayer(clock.localMinutes, today, tomorrow);
  const calendar = calendarDate(context.civilDate, input.hijriCorrectionDays ?? 0);
  const prayers = PRAYER_ORDER.map((name): DashboardPrayerRow => {
    const prayer = today.prayers[name];
    return {
      name,
      localMinutes: prayer.roundedLocalMinutes,
      isNext: next?.dayOffset === 0 && next.prayer === name,
      highLatitudeRuleApplied: prayer.provenance.highLatitudeRuleApplied,
      manualAdjustmentMinutes: prayer.provenance.manualAdjustmentMinutes,
    };
  });
  const hasHighLatitudeFallback = prayers.some((prayer) => prayer.highLatitudeRuleApplied);
  const hasManualAdjustments = prayers.some((prayer) => prayer.manualAdjustmentMinutes !== 0);
  const secondsUntilNextPrayer =
    next === null ? null : Math.max(0, Math.round(next.minutesUntil * 60));

  return {
    generatedAt: new Date(input.instant.getTime()),
    coordinates: input.coordinates,
    timeZone: context.timeZone,
    utcOffsetMinutes: context.utcOffsetMinutes,
    civilDate: context.civilDate,
    clock,
    gregorian: calendar.gregorian,
    hijri: calendar.hijri,
    method,
    asrConvention,
    highLatitudeRule,
    today,
    tomorrow,
    prayers,
    nextPrayer: next?.prayer ?? null,
    nextPrayerDayOffset: next?.dayOffset ?? null,
    nextPrayerLocalMinutes: next?.localMinutes ?? null,
    secondsUntilNextPrayer,
    hasHighLatitudeFallback,
    hasManualAdjustments,
  };
}
