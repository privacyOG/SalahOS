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

export function applyDocumentLocale(target: DocumentLocaleTarget, locale: Locale): void {
  target.lang = locale;
  target.dir = localeDirection(locale);
}
