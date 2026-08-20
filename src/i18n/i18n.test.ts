import { describe, expect, it } from 'vitest';
import {
  applyDocumentLocale,
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  formatZonedInstantTime,
  localeDirection,
  translate,
} from './i18n';

describe('localisation and RTL core', () => {
  it('provides English and Arabic translations for shared UI labels', () => {
    expect(translate('en', 'dailyPrayers')).toBe('Daily prayers');
    expect(translate('ar', 'dailyPrayers')).toBe('الصلوات اليومية');
    expect(translate('ar', 'prayerFajr')).toBe('الفجر');
    expect(translate('ar', 'prayerDhuhr')).toBe('الظهر');
    expect(translate('ar', 'prayerAsr')).toBe('العصر');
    expect(translate('ar', 'prayerMaghrib')).toBe('المغرب');
    expect(translate('ar', 'prayerIsha')).toBe('العشاء');
    expect(translate('tr', 'dailyPrayers')).toBe('Günlük namazlar');
    expect(translate('id', 'dailyPrayers')).toBe('Salat harian');
    expect(translate('tr', 'prayerFajr')).toBe('Sabah');
    expect(translate('id', 'prayerFajr')).toBe('Subuh');
  });

  it('uses RTL only for Arabic', () => {
    expect(localeDirection('en')).toBe('ltr');
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('tr')).toBe('ltr');
    expect(localeDirection('id')).toBe('ltr');
  });

  it('applies language and direction to a document-root compatible target', () => {
    const target = { lang: '', dir: '' };
    applyDocumentLocale(target, 'ar');
    expect(target.lang).toBe('ar');
    expect(target.dir).toBe('rtl');

    applyDocumentLocale(target, 'en');
    expect(target.lang).toBe('en');
    expect(target.dir).toBe('ltr');

    applyDocumentLocale(target, 'tr');
    expect(target.lang).toBe('tr');
    expect(target.dir).toBe('ltr');

    applyDocumentLocale(target, 'id');
    expect(target.lang).toBe('id');
    expect(target.dir).toBe('ltr');
  });

  it('formats 24-hour time predictably for both locales', () => {
    expect(formatLocalTime(5 * 60 + 7, 'en', 'h23')).toMatch(/05:07/);
    expect(formatLocalTime(17 * 60 + 42, 'ar', 'h23')).toContain(':');
  });

  it('formats an instant in the selected IANA timezone', () => {
    const instant = new Date('2026-08-16T00:05:06.000Z');
    expect(formatZonedInstantTime(instant, 'Australia/Sydney', 'en')).toContain('10:05:06');
  });

  it('formats Gregorian and Umm al-Qura dates using the selected locale', () => {
    const date = new Date('2026-08-16T00:00:00.000Z');
    const english = formatGregorianCivilDate(date, 'en');
    const arabic = formatGregorianCivilDate(date, 'ar');
    const hijri = formatHijriCivilDate(date, 'en');

    expect(english).not.toBe(arabic);
    expect(english.length).toBeGreaterThan(0);
    expect(arabic.length).toBeGreaterThan(0);
    expect(hijri.length).toBeGreaterThan(0);
  });

  it('formats countdowns without host-timezone dependence', () => {
    expect(formatCountdown(3_661, 'en')).toBe('01:01:01');
    expect(formatCountdown(0, 'en')).toBe('00:00:00');
  });

  it('rejects invalid local minute and countdown values', () => {
    expect(() => formatLocalTime(-1, 'en')).toThrow(RangeError);
    expect(() => formatLocalTime(1_440, 'en')).toThrow(RangeError);
    expect(() => formatLocalTime(10.5, 'en')).toThrow(RangeError);
    expect(() => formatCountdown(-1, 'en')).toThrow(RangeError);
  });
});
