export type HijriCalendarId = 'islamic-umalqura';
export const HIJRI_MONTH_NAMES = Object.freeze([
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Akhir',
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
] as const);
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
const DAY = 86_400_000,
  MIN = -2,
  MAX = 2;
function assertCivilDate(date: Date) {
  if (!Number.isFinite(date.getTime())) throw new RangeError('Civil date must be valid');
  if (
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0 ||
    date.getUTCMilliseconds() !== 0
  )
    throw new RangeError('Civil date must be represented at UTC midnight');
}
function assertCorrection(n: number) {
  if (!Number.isInteger(n) || n < MIN || n > MAX)
    throw new RangeError('Hijri correction must be an integer between -2 and +2 days');
}
function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  const p = parts.find((x) => x.type === type);
  if (!p) throw new Error(`Calendar formatter did not return ${type}`);
  const n = Number.parseInt(p.value, 10);
  if (!Number.isInteger(n)) throw new Error(`Calendar formatter returned non-numeric ${type}`);
  return n;
}
export function supportsHijriCalendar(calendar: HijriCalendarId = 'islamic-umalqura') {
  try {
    return (
      new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, {
        timeZone: 'UTC',
        year: 'numeric',
      }).resolvedOptions().calendar === calendar
    );
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
  assertCorrection(correctionDays);
  if (!supportsHijriCalendar(calendar))
    throw new Error(`Hijri calendar ${calendar} is not supported by this runtime`);
  const corrected = new Date(civilDate.getTime() + correctionDays * DAY);
  const parts = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(corrected);
  return {
    calendar,
    year: numericPart(parts, 'year'),
    month: numericPart(parts, 'month'),
    day: numericPart(parts, 'day'),
    correctionDays,
    source: 'runtime-intl-calendar',
  };
}
export function hijriMonthName(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new RangeError('Hijri month must be 1 through 12');
  return HIJRI_MONTH_NAMES[month - 1];
}
export function formatHijriDateEnglish(civilDate: Date, correctionDays = 0) {
  const h = hijriDateParts(civilDate, correctionDays);
  return `${h.day} ${hijriMonthName(h.month)} ${h.year} AH`;
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
