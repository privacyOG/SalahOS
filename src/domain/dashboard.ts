import { calendarDate } from './calendar';
import type { Coordinates } from './coordinates';
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
import {
  assertIanaTimeZone,
  civilDateInTimeZone,
  resolveIanaTimeZone,
  utcOffsetMinutesAt,
} from './timezone';

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

export interface PrayerDashboardSchedulePrayerRow {
  readonly name: PrayerName;
  readonly localMinutes: number | null;
  readonly highLatitudeRuleApplied: boolean;
  readonly manualAdjustmentMinutes: number;
}

export interface PrayerDashboardScheduleModel {
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly civilDate: Date;
  readonly gregorian: ReturnType<typeof calendarDate>['gregorian'];
  readonly hijri: ReturnType<typeof calendarDate>['hijri'];
  readonly method: CalculationMethod;
  readonly asrConvention: AsrConvention;
  readonly highLatitudeRule: HighLatitudeRule;
  readonly today: PrayerSchedule;
  readonly tomorrow: PrayerSchedule;
  readonly prayers: readonly PrayerDashboardSchedulePrayerRow[];
  readonly hasHighLatitudeFallback: boolean;
  readonly hasManualAdjustments: boolean;
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

export interface PrayerDashboardScheduleInput {
  readonly civilDate: Date;
  readonly coordinates: Coordinates;
  readonly timeZone?: string;
  readonly method?: CalculationMethod;
  readonly asrConvention?: AsrConvention;
  readonly highLatitudeRule?: HighLatitudeRule;
  readonly adjustments?: Readonly<Partial<Record<PrayerName, number>>>;
  readonly hijriCorrectionDays?: number;
}

export interface PrayerDashboardInput {
  readonly instant: Date;
  readonly coordinates: Coordinates;
  readonly timeZone?: string;
  readonly method?: CalculationMethod;
  readonly asrConvention?: AsrConvention;
  readonly highLatitudeRule?: HighLatitudeRule;
  readonly adjustments?: Readonly<Partial<Record<PrayerName, number>>>;
  readonly hijriCorrectionDays?: number;
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

function normalizedCivilDate(civilDate: Date): Date {
  if (!Number.isFinite(civilDate.getTime())) {
    throw new RangeError('Civil date must be valid');
  }

  return new Date(
    Date.UTC(civilDate.getUTCFullYear(), civilDate.getUTCMonth(), civilDate.getUTCDate()),
  );
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

export function resolvePrayerDashboardTimeZone(
  coordinates: Coordinates,
  persistedTimeZone?: string,
): string {
  return persistedTimeZone === undefined
    ? resolveIanaTimeZone(coordinates).timeZone
    : assertIanaTimeZone(persistedTimeZone);
}

export function buildPrayerDashboardSchedule(
  input: PrayerDashboardScheduleInput,
): PrayerDashboardScheduleModel {
  const method = input.method ?? calculationMethods['muslim-world-league'];
  const asrConvention = input.asrConvention ?? 'standard';
  const highLatitudeRule = input.highLatitudeRule ?? 'angle-based';
  const adjustments = input.adjustments ?? {};
  const civilDate = normalizedCivilDate(input.civilDate);
  const timeZone = resolvePrayerDashboardTimeZone(input.coordinates, input.timeZone);
  const today = scheduleFor(
    civilDate,
    input.coordinates,
    offsetForCivilDate(civilDate, timeZone),
    method,
    asrConvention,
    highLatitudeRule,
    adjustments,
  );
  const tomorrowCivilDate = addCivilDays(civilDate, 1);
  const tomorrow = scheduleFor(
    tomorrowCivilDate,
    input.coordinates,
    offsetForCivilDate(tomorrowCivilDate, timeZone),
    method,
    asrConvention,
    highLatitudeRule,
    adjustments,
  );
  const calendar = calendarDate(civilDate, input.hijriCorrectionDays ?? 0);
  const prayers = PRAYER_ORDER.map((name): PrayerDashboardSchedulePrayerRow => {
    const prayer = today.prayers[name];
    return {
      name,
      localMinutes: prayer.roundedLocalMinutes,
      highLatitudeRuleApplied: prayer.provenance.highLatitudeRuleApplied,
      manualAdjustmentMinutes: prayer.provenance.manualAdjustmentMinutes,
    };
  });

  return {
    coordinates: input.coordinates,
    timeZone,
    civilDate,
    gregorian: calendar.gregorian,
    hijri: calendar.hijri,
    method,
    asrConvention,
    highLatitudeRule,
    today,
    tomorrow,
    prayers,
    hasHighLatitudeFallback: prayers.some((prayer) => prayer.highLatitudeRuleApplied),
    hasManualAdjustments: prayers.some((prayer) => prayer.manualAdjustmentMinutes !== 0),
  };
}

export function derivePrayerDashboard(
  schedule: PrayerDashboardScheduleModel,
  instant: Date,
): PrayerDashboardModel {
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError('Instant must be valid');
  }

  const currentCivilDate = civilDateInTimeZone(instant, schedule.timeZone);
  if (currentCivilDate.getTime() !== schedule.civilDate.getTime()) {
    throw new RangeError('Prayer dashboard schedule does not match the current civil date');
  }

  const clock = localClockParts(instant, schedule.timeZone);
  const next = findNextPrayer(clock.localMinutes, schedule.today, schedule.tomorrow);
  const prayers = schedule.prayers.map((prayer): DashboardPrayerRow => ({
    ...prayer,
    isNext: next?.dayOffset === 0 && next.prayer === prayer.name,
  }));

  return {
    generatedAt: new Date(instant.getTime()),
    coordinates: schedule.coordinates,
    timeZone: schedule.timeZone,
    utcOffsetMinutes: utcOffsetMinutesAt(instant, schedule.timeZone),
    civilDate: schedule.civilDate,
    clock,
    gregorian: schedule.gregorian,
    hijri: schedule.hijri,
    method: schedule.method,
    asrConvention: schedule.asrConvention,
    highLatitudeRule: schedule.highLatitudeRule,
    today: schedule.today,
    tomorrow: schedule.tomorrow,
    prayers,
    nextPrayer: next?.prayer ?? null,
    nextPrayerDayOffset: next?.dayOffset ?? null,
    nextPrayerLocalMinutes: next?.localMinutes ?? null,
    secondsUntilNextPrayer:
      next === null ? null : Math.max(0, Math.round(next.minutesUntil * 60)),
    hasHighLatitudeFallback: schedule.hasHighLatitudeFallback,
    hasManualAdjustments: schedule.hasManualAdjustments,
  };
}

export function buildPrayerDashboard(input: PrayerDashboardInput): PrayerDashboardModel {
  const timeZone = resolvePrayerDashboardTimeZone(input.coordinates, input.timeZone);
  const civilDate = civilDateInTimeZone(input.instant, timeZone);
  const schedule = buildPrayerDashboardSchedule({
    civilDate,
    coordinates: input.coordinates,
    timeZone,
    ...(input.method === undefined ? {} : { method: input.method }),
    ...(input.asrConvention === undefined ? {} : { asrConvention: input.asrConvention }),
    ...(input.highLatitudeRule === undefined
      ? {}
      : { highLatitudeRule: input.highLatitudeRule }),
    ...(input.adjustments === undefined ? {} : { adjustments: input.adjustments }),
    ...(input.hijriCorrectionDays === undefined
      ? {}
      : { hijriCorrectionDays: input.hijriCorrectionDays }),
  });

  return derivePrayerDashboard(schedule, input.instant);
}
