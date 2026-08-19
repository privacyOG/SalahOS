import type { ObligatoryPrayerName } from './prayerEngine';

const PRAYERS: readonly ObligatoryPrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface MonthlyTimetablePrayer {
  readonly start: string;
  readonly iqamah: string | null;
}

export interface MonthlyTimetableJumuah {
  readonly label: string;
  readonly khutbah: string | null;
  readonly start: string;
}

export interface MonthlyTimetableDayInput {
  readonly date: string;
  readonly hijriLabel: string | null;
  readonly prayers: Readonly<Record<ObligatoryPrayerName, MonthlyTimetablePrayer>>;
  readonly jumuah: readonly MonthlyTimetableJumuah[];
}

export interface MonthlyTimetableDay extends MonthlyTimetableDayInput {}

export interface MonthlyTimetable {
  readonly mosqueId: string;
  readonly mosqueName: string;
  readonly month: string;
  readonly sourceLabel: string;
  readonly revision: number;
  readonly days: readonly MonthlyTimetableDay[];
}

export interface MonthlyTimetableInput {
  readonly mosqueId: string;
  readonly mosqueName: string;
  readonly month: string;
  readonly sourceLabel: string;
  readonly revision: number;
  readonly days: readonly MonthlyTimetableDayInput[];
}

function normalizeText(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0 || normalized.length > maximum) {
    throw new RangeError(`${label} must be between 1 and ${String(maximum)} characters`);
  }
  return normalized;
}

function assertMonth(value: string): void {
  if (!/^\d{4}-\d{2}$/u.test(value)) {
    throw new RangeError('Timetable month must use YYYY-MM');
  }
  const parsed = new Date(`${value}-01T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 7) !== value) {
    throw new RangeError('Timetable month must be a valid Gregorian month');
  }
}

function assertDate(value: string, month: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new RangeError('Timetable date must use YYYY-MM-DD');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError('Timetable date must be a valid Gregorian date');
  }
  if (!value.startsWith(`${month}-`)) {
    throw new RangeError(`Timetable date ${value} is outside ${month}`);
  }
}

function assertClock(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(normalized)) {
    throw new RangeError(`${label} must use 24-hour HH:mm`);
  }
  return normalized;
}

function normalizePrayer(
  value: MonthlyTimetablePrayer,
  label: string,
): MonthlyTimetablePrayer {
  return Object.freeze({
    start: assertClock(value.start, `${label} start`),
    iqamah: value.iqamah === null ? null : assertClock(value.iqamah, `${label} Iqamah`),
  });
}

function normalizeJumuah(value: MonthlyTimetableJumuah): MonthlyTimetableJumuah {
  return Object.freeze({
    label: normalizeText(value.label, 'Jumuah label', 120),
    khutbah: value.khutbah === null ? null : assertClock(value.khutbah, 'Jumuah khutbah'),
    start: assertClock(value.start, 'Jumuah start'),
  });
}

export function createMonthlyTimetable(input: MonthlyTimetableInput): MonthlyTimetable {
  assertMonth(input.month);
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    throw new RangeError('Timetable revision must be a positive integer');
  }
  if (input.days.length === 0 || input.days.length > 31) {
    throw new RangeError('Timetable must contain between 1 and 31 days');
  }

  const seen = new Set<string>();
  const days = input.days.map((day) => {
    assertDate(day.date, input.month);
    if (seen.has(day.date)) {
      throw new RangeError(`Duplicate timetable date: ${day.date}`);
    }
    seen.add(day.date);

    const prayers = {} as Record<ObligatoryPrayerName, MonthlyTimetablePrayer>;
    for (const prayer of PRAYERS) {
      prayers[prayer] = normalizePrayer(day.prayers[prayer], prayer);
    }

    return Object.freeze({
      date: day.date,
      hijriLabel:
        day.hijriLabel === null
          ? null
          : normalizeText(day.hijriLabel, 'Hijri date label', 80),
      prayers: Object.freeze(prayers),
      jumuah: Object.freeze(day.jumuah.map(normalizeJumuah)),
    });
  });

  days.sort((left, right) => left.date.localeCompare(right.date));

  return Object.freeze({
    mosqueId: normalizeText(input.mosqueId, 'Mosque ID', 160).toLowerCase(),
    mosqueName: normalizeText(input.mosqueName, 'Mosque name', 160),
    month: input.month,
    sourceLabel: normalizeText(input.sourceLabel, 'Source label', 200),
    revision: input.revision,
    days: Object.freeze(days),
  });
}

function csvCell(value: string): string {
  if (!/[",\n]/u.test(value)) return value;
  return `"${value.replace(/"/gu, '""')}"`;
}

export function monthlyTimetableToCsv(timetable: MonthlyTimetable): string {
  const header = [
    'Date',
    'Hijri',
    'Fajr Start',
    'Fajr Iqamah',
    'Dhuhr Start',
    'Dhuhr Iqamah',
    'Asr Start',
    'Asr Iqamah',
    'Maghrib Start',
    'Maghrib Iqamah',
    'Isha Start',
    'Isha Iqamah',
    'Jumuah',
  ];
  const rows = timetable.days.map((day) => {
    const jumuah = day.jumuah
      .map((session) => `${session.label}: ${session.start}`)
      .join(' | ');
    return [
      day.date,
      day.hijriLabel ?? '',
      day.prayers.fajr.start,
      day.prayers.fajr.iqamah ?? '',
      day.prayers.dhuhr.start,
      day.prayers.dhuhr.iqamah ?? '',
      day.prayers.asr.start,
      day.prayers.asr.iqamah ?? '',
      day.prayers.maghrib.start,
      day.prayers.maghrib.iqamah ?? '',
      day.prayers.isha.start,
      day.prayers.isha.iqamah ?? '',
      jumuah,
    ]
      .map(csvCell)
      .join(',');
  });
  return `${header.join(',')}\n${rows.join('\n')}\n`;
}

export function monthlyTimetableToJson(timetable: MonthlyTimetable): string {
  return JSON.stringify(timetable, null, 2);
}
