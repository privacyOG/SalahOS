export type HijriCalendarId = 'islamic-umalqura';

export interface GregorianDateParts {
  readonly calendar: 'gregory';
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly source: 'civil-date';
}

export interface HijriDateParts {
  readonly calendar: HijriCalendarId;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly correctionDays: number;
  readonly source: 'runtime-intl-calendar';
}

export interface CalendarDateResult {
  readonly civilDate: Date;
  readonly gregorian: GregorianDateParts;
  readonly hijri: HijriDateParts;
}

const MIN_HIJRI_CORRECTION_DAYS = -2;
const MAX_HIJRI_CORRECTION_DAYS = 2;

function assertCivilDate(date: Date): void {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError('Civil date must be valid');
  }

  if (
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0
  ) {
    throw new RangeError('Civil date must be represented at UTC midnight');
  }
}

function assertHijriCorrection(correctionDays: number): void {
  if (
    !Number.isInteger(correctionDays) ||
    correctionDays < MIN_HIJRI_CORRECTION_DAYS ||
    correctionDays > MAX_HIJRI_CORRECTION_DAYS
  ) {
    throw new RangeError('Hijri correction must be an integer between -2 and +2 days');
  }
}

function correctedCivilDate(civilDate: Date, correctionDays: number): Date {
  return new Date(civilDate.getTime() + correctionDays * 86_400_000);
}

function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const part = parts.find((candidate) => candidate.type === type);
  if (part === undefined) {
    throw new Error(`Calendar formatter did not return ${type}`);
  }

  const value = Number.parseInt(part.value, 10);
  if (!Number.isInteger(value)) {
    throw new Error(`Calendar formatter returned non-numeric ${type}`);
  }

  return value;
}

export function supportsHijriCalendar(calendar: HijriCalendarId = 'islamic-umalqura'): boolean {
  try {
    const resolved = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, {
      timeZone: 'UTC',
      year: 'numeric',
    }).resolvedOptions().calendar;
    return resolved === calendar;
  } catch {
    return false;
  }
}

export function gregorianDateParts(civilDate: Date): GregorianDateParts {
  assertCivilDate(civilDate);

  return {
    calendar: 'gregory',
    year: civilDate.getUTCFullYear(),
    month: civilDate.getUTCMonth() + 1,
    day: civilDate.getUTCDate(),
    source: 'civil-date',
  };
}

export function hijriDateParts(
  civilDate: Date,
  correctionDays = 0,
  calendar: HijriCalendarId = 'islamic-umalqura',
): HijriDateParts {
  assertCivilDate(civilDate);
  assertHijriCorrection(correctionDays);

  if (!supportsHijriCalendar(calendar)) {
    throw new Error(`Hijri calendar ${calendar} is not supported by this runtime`);
  }

  const correctedDate = correctedCivilDate(civilDate, correctionDays);
  const formatter = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(correctedDate);

  return {
    calendar,
    year: numericPart(parts, 'year'),
    month: numericPart(parts, 'month'),
    day: numericPart(parts, 'day'),
    correctionDays,
    source: 'runtime-intl-calendar',
  };
}

export function calendarDate(
  civilDate: Date,
  hijriCorrectionDays = 0,
  calendar: HijriCalendarId = 'islamic-umalqura',
): CalendarDateResult {
  assertCivilDate(civilDate);

  return {
    civilDate: new Date(civilDate.getTime()),
    gregorian: gregorianDateParts(civilDate),
    hijri: hijriDateParts(civilDate, hijriCorrectionDays, calendar),
  };
}
