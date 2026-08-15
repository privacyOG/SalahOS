import { describe, expect, it } from 'vitest';
import {
  applyDocumentLocale,
  formatGregorianCivilDate,
  formatLocalTime,
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
  });

  it('uses RTL only for Arabic', () => {
    expect(localeDirection('en')).toBe('ltr');
    expect(localeDirection('ar')).toBe('rtl');
  });

  it('applies language and direction to a document-root compatible target', () => {
    const target = { lang: '', dir: '' };
    applyDocumentLocale(target, 'ar');
    expect(target.lang).toBe('ar');
    expect(target.dir).toBe('rtl');

    applyDocumentLocale(target, 'en');
    expect(target.lang).toBe('en');
    expect(target.dir).toBe('ltr');
  });

  it('formats 24-hour time predictably for both locales', () => {
    expect(formatLocalTime(5 * 60 + 7, 'en', 'h23')).toMatch(/05:07/);
    expect(formatLocalTime(17 * 60 + 42, 'ar', 'h23')).toContain(':');
  });

  it('formats the same Gregorian civil date using the selected locale', () => {
    const date = new Date('2026-08-16T00:00:00.000Z');
    const english = formatGregorianCivilDate(date, 'en');
    const arabic = formatGregorianCivilDate(date, 'ar');

    expect(english).not.toBe(arabic);
    expect(english.length).toBeGreaterThan(0);
    expect(arabic.length).toBeGreaterThan(0);
  });

  it('rejects invalid local minute values', () => {
    expect(() => formatLocalTime(-1, 'en')).toThrow(RangeError);
    expect(() => formatLocalTime(1_440, 'en')).toThrow(RangeError);
    expect(() => formatLocalTime(10.5, 'en')).toThrow(RangeError);
  });
});
