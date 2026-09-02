import { describe, expect, it } from 'vitest';

import {
  calculateAsrConventionPreview,
  inferIsoCountryCodeFromTimeZone,
  suggestedCalculationMethodForCountry,
} from './firstRunPrayerSetup';

describe('first-run calculation method suggestions', () => {
  it('maps explicit ISO country codes to supported built-in methods', () => {
    expect(suggestedCalculationMethodForCountry('SA')).toBe('umm-al-qura');
    expect(suggestedCalculationMethodForCountry('eg')).toBe('egyptian');
    expect(suggestedCalculationMethodForCountry('PK')).toBe('karachi');
    expect(suggestedCalculationMethodForCountry('US')).toBe('isna');
    expect(suggestedCalculationMethodForCountry('CA')).toBe('isna');
    expect(suggestedCalculationMethodForCountry('TR')).toBe('diyanet');
    expect(suggestedCalculationMethodForCountry('SG')).toBe('muis');
    expect(suggestedCalculationMethodForCountry('AE')).toBe('dubai');
    expect(suggestedCalculationMethodForCountry('KW')).toBe('kuwait');
    expect(suggestedCalculationMethodForCountry('QA')).toBe('qatar');
  });

  it('uses Muslim World League as the documented fallback', () => {
    expect(suggestedCalculationMethodForCountry('AU')).toBe('muslim-world-league');
    expect(suggestedCalculationMethodForCountry('NZ')).toBe('muslim-world-league');
    expect(suggestedCalculationMethodForCountry('ZZ')).toBe('muslim-world-league');
    expect(suggestedCalculationMethodForCountry(null)).toBe('muslim-world-league');
  });

  it('uses conservative offline timezone hints without guessing ambiguous zones', () => {
    expect(inferIsoCountryCodeFromTimeZone('Australia/Sydney')).toBe('AU');
    expect(inferIsoCountryCodeFromTimeZone('Asia/Riyadh')).toBe('SA');
    expect(inferIsoCountryCodeFromTimeZone('America/Toronto')).toBe('CA');
    expect(inferIsoCountryCodeFromTimeZone('Europe/London')).toBeNull();
  });
});

describe('first-run Asr convention preview', () => {
  it('computes distinct Standard and Hanafi Asr times using the production prayer engine', () => {
    const preview = calculateAsrConventionPreview({
      instant: new Date('2026-09-02T02:00:00.000Z'),
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
      methodId: 'muslim-world-league',
    });

    expect(preview.standardLocalMinutes).not.toBeNull();
    expect(preview.hanafiLocalMinutes).not.toBeNull();
    if (preview.standardLocalMinutes === null || preview.hanafiLocalMinutes === null) {
      throw new Error('Expected both Asr preview times to be available');
    }
    expect(preview.standardLocalMinutes).toBeLessThan(preview.hanafiLocalMinutes);
    expect(preview.hanafiLocalMinutes - preview.standardLocalMinutes).toBeGreaterThan(20);
  });

  it('applies the selected calculation method Asr adjustment to both previews', () => {
    const base = calculateAsrConventionPreview({
      instant: new Date('2026-09-02T02:00:00.000Z'),
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
      methodId: 'muslim-world-league',
    });
    const dubai = calculateAsrConventionPreview({
      instant: new Date('2026-09-02T02:00:00.000Z'),
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
      methodId: 'dubai',
    });

    if (
      base.standardLocalMinutes === null ||
      base.hanafiLocalMinutes === null ||
      dubai.standardLocalMinutes === null ||
      dubai.hanafiLocalMinutes === null
    ) {
      throw new Error('Expected Asr preview times for both calculation methods');
    }
    expect(dubai.standardLocalMinutes).toBe(base.standardLocalMinutes + 3);
    expect(dubai.hanafiLocalMinutes).toBe(base.hanafiLocalMinutes + 3);
  });
});
