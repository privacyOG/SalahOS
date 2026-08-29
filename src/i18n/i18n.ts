import { formatHijriDateEnglish, hijriDateParts } from '../domain/calendar';
import { translations } from './translations';
import type { Locale, TranslationKey } from './translations';
export type TextDirection = 'ltr' | 'rtl';
export interface DocumentLocaleTarget {
  lang: string;
  dir: string;
}
export function translate(locale: Locale, key: TranslationKey) {
  return translations[locale][key];
}
const localeTags: Readonly<Record<Locale, string>> = Object.freeze({
  en: 'en-AU',
  ar: 'ar',
  tr: 'tr-TR',
  id: 'id-ID',
});
export function localeDirection(locale: Locale): TextDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
export function localeTag(locale: Locale) {
  return localeTags[locale];
}
export function formatLocalTime(
  localMinutes: number,
  locale: Locale,
  hourCycle: 'h12' | 'h23' = 'h23',
) {
  if (!Number.isInteger(localMinutes) || localMinutes < 0 || localMinutes >= 1440)
    throw new RangeError('Local time must be an integer from 0 through 1439 minutes');
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
) {
  if (!Number.isFinite(instant.getTime())) throw new RangeError('Instant must be valid');
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle,
  }).format(instant);
}
export function formatGregorianCivilDate(civilDate: Date, locale: Locale) {
  if (!Number.isFinite(civilDate.getTime())) throw new RangeError('Civil date must be valid');
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(civilDate);
}
export function formatHijriCivilDate(civilDate: Date, locale: Locale, correctionDays = 0) {
  if (!Number.isFinite(civilDate.getTime())) throw new RangeError('Civil date must be valid');
  if (locale === 'en') return formatHijriDateEnglish(civilDate, correctionDays);
  const h = hijriDateParts(civilDate, correctionDays);
  const number = new Intl.NumberFormat(localeTag(locale), { useGrouping: false });
  const month = new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    calendar: 'islamic-umalqura',
    month: 'long',
  }).format(new Date(civilDate.getTime() + correctionDays * 86_400_000));
  const era = locale === 'ar' ? 'هـ' : 'AH';
  return `${number.format(h.day)} ${month} ${number.format(h.year)} ${era}`;
}
export function formatCountdown(totalSeconds: number, locale: Locale) {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0)
    throw new RangeError('Countdown seconds must be a non-negative integer');
  const h = Math.floor(totalSeconds / 3600),
    m = Math.floor((totalSeconds % 3600) / 60),
    s = totalSeconds % 60;
  const n = new Intl.NumberFormat(localeTag(locale), {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  return `${n.format(h)}:${n.format(m)}:${n.format(s)}`;
}
export function applyDocumentLocale(target: DocumentLocaleTarget, locale: Locale) {
  target.lang = locale;
  target.dir = localeDirection(locale);
}
