import { translations } from './translations';
import type { Locale, TranslationKey } from './translations';

export type TextDirection = 'ltr' | 'rtl';

export interface DocumentLocaleTarget {
  lang: string;
  dir: string;
}

export function translate(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}

export function localeDirection(locale: Locale): TextDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function localeTag(locale: Locale): string {
  return locale === 'ar' ? 'ar' : 'en-AU';
}

export function formatLocalTime(
  localMinutes: number,
  locale: Locale,
  hourCycle: 'h12' | 'h23' = 'h23',
): string {
  if (!Number.isInteger(localMinutes) || localMinutes < 0 || localMinutes >= 1_440) {
    throw new RangeError('Local time must be an integer from 0 through 1439 minutes');
  }

  const instant = new Date(Date.UTC(2000, 0, 1, Math.floor(localMinutes / 60), localMinutes % 60));
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle,
  }).format(instant);
}

export function formatZonedInstantTime(
  instant: Date,
  timeZone: string,
  locale: Locale,
  hourCycle: 'h12' | 'h23' = 'h23',
): string {
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError('Instant must be valid');
  }

  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle,
  }).format(instant);
}

export function formatGregorianCivilDate(civilDate: Date, locale: Locale): string {
  if (!Number.isFinite(civilDate.getTime())) {
    throw new RangeError('Civil date must be valid');
  }

  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(civilDate);
}

export function formatHijriCivilDate(
  civilDate: Date,
  locale: Locale,
  correctionDays = 0,
): string {
  if (!Number.isFinite(civilDate.getTime())) {
    throw new RangeError('Civil date must be valid');
  }
  if (!Number.isInteger(correctionDays) || correctionDays < -2 || correctionDays > 2) {
    throw new RangeError('Hijri correction must be an integer between -2 and +2 days');
  }

  const corrected = new Date(civilDate.getTime() + correctionDays * 86_400_000);
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    calendar: 'islamic-umalqura',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(corrected);
}

export function formatCountdown(totalSeconds: number, locale: Locale): string {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0) {
    throw new RangeError('Countdown seconds must be a non-negative integer');
  }

  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const number = new Intl.NumberFormat(localeTag(locale), {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  return `${number.format(hours)}:${number.format(minutes)}:${number.format(seconds)}`;
}

export function applyDocumentLocale(target: DocumentLocaleTarget, locale: Locale): void {
  target.lang = locale;
  target.dir = localeDirection(locale);
}
