import { describe, expect, it } from 'vitest';

import { localeDirection, localeTag, translate } from './i18n';
import { translations } from './translations';

describe('additional application locales', () => {
  it('keeps Turkish and Indonesian catalogues in exact key parity with English', () => {
    const englishKeys = Object.keys(translations.en).sort();

    expect(Object.keys(translations.tr).sort()).toEqual(englishKeys);
    expect(Object.keys(translations.id).sort()).toEqual(englishKeys);
    expect(Object.values(translations.tr).every((value) => value.trim().length > 0)).toBe(true);
    expect(Object.values(translations.id).every((value) => value.trim().length > 0)).toBe(true);
  });

  it('provides representative Turkish and Indonesian prayer/UI translations', () => {
    expect(translate('tr', 'dailyPrayers')).toBe('Günlük namazlar');
    expect(translate('tr', 'prayerFajr')).toBe('Sabah');
    expect(translate('id', 'dailyPrayers')).toBe('Salat harian');
    expect(translate('id', 'prayerFajr')).toBe('Subuh');
  });

  it('uses explicit formatting tags and left-to-right direction for both locales', () => {
    expect(localeTag('tr')).toBe('tr-TR');
    expect(localeTag('id')).toBe('id-ID');
    expect(localeDirection('tr')).toBe('ltr');
    expect(localeDirection('id')).toBe('ltr');
  });
});
