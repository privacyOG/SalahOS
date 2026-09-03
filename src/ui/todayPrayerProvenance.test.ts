import { describe, expect, it } from 'vitest';

import type { Locale } from '../i18n/translations';
import { todayPrayerProvenancePresentation } from './todayPrayerProvenance';

describe('Today prayer provenance presentation', () => {
  it('uses compact method labels and Standard Asr from the shared Asr presentation', () => {
    expect(
      todayPrayerProvenancePresentation({
        locale: 'en',
        methodId: 'muslim-world-league',
        asrConvention: 'standard',
        prayerAdjustments: {},
      }),
    ).toEqual({
      methodLabel: 'MWL',
      asrLabel: 'Standard Asr',
      adjustedLabel: null,
      ariaLabel: 'Prayer calculation settings: MWL, Standard Asr',
      hasManualAdjustments: false,
    });
  });

  it('uses Hanafi Asr and indicates any non-zero manual prayer adjustment', () => {
    expect(
      todayPrayerProvenancePresentation({
        locale: 'en',
        methodId: 'isna',
        asrConvention: 'hanafi',
        prayerAdjustments: { fajr: 2 },
      }),
    ).toEqual({
      methodLabel: 'ISNA',
      asrLabel: 'Hanafi Asr',
      adjustedLabel: 'Adjusted',
      ariaLabel: 'Prayer calculation settings: ISNA, Hanafi Asr, Adjusted',
      hasManualAdjustments: true,
    });
  });

  it('supports all four product locales', () => {
    const expected: Readonly<Record<Locale, readonly [string, string]>> = {
      en: ['Standard Asr', 'Adjusted'],
      ar: ['العصر القياسي', 'معدّل'],
      tr: ['Standart ikindi', 'Ayarlı'],
      id: ['Asar standar', 'Disesuaikan'],
    };
    const locales: readonly Locale[] = ['en', 'ar', 'tr', 'id'];

    for (const locale of locales) {
      const presentation = todayPrayerProvenancePresentation({
        locale,
        methodId: 'muslim-world-league',
        asrConvention: 'standard',
        prayerAdjustments: { isha: -1 },
      });
      expect([presentation.asrLabel, presentation.adjustedLabel]).toEqual(expected[locale]);
      expect(presentation.ariaLabel).toContain('MWL');
    }
  });

  it('keeps all built-in calculation method labels compact and deterministic', () => {
    const cases = [
      ['umm-al-qura', 'Umm al-Qura'],
      ['egyptian', 'Egyptian'],
      ['karachi', 'Karachi'],
      ['diyanet', 'Diyanet'],
      ['muis', 'MUIS'],
      ['dubai', 'Dubai'],
      ['kuwait', 'Kuwait'],
      ['qatar', 'Qatar'],
    ] as const;

    for (const [methodId, methodLabel] of cases) {
      expect(
        todayPrayerProvenancePresentation({
          locale: 'en',
          methodId,
          asrConvention: 'standard',
          prayerAdjustments: {},
        }).methodLabel,
      ).toBe(methodLabel);
    }
  });
});
