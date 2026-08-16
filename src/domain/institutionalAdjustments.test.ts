import { describe, expect, it } from 'vitest';
import { applyInstitutionalAdjustments } from './institutionalAdjustments';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';

const DAY_MINUTES = 1_440;

function normalizeDayMinutes(minutes: number): number {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function requiredMinutes(value: number | null): number {
  if (value === null) {
    throw new Error('Expected prayer time to be available in institutional adjustment fixture');
  }
  return value;
}

describe('institutional prayer-method adjustments', () => {
  it('applies Diyanet corrections to method-default times without altering raw astronomy', () => {
    const raw = calculatePrayerSchedule({
      date: new Date('2026-08-16T00:00:00.000Z'),
      latitude: 41.0082,
      longitude: 28.9784,
      utcOffsetMinutes: 180,
      method: getCalculationMethod('diyanet'),
      asrConvention: 'standard',
      highLatitudeRule: 'angle-based',
      adjustments: { asr: 2 },
    });

    const adjusted = applyInstitutionalAdjustments(raw);

    expect(adjusted.prayers.fajr).toBe(raw.prayers.fajr);
    expect(adjusted.prayers.isha).toBe(raw.prayers.isha);

    expect(adjusted.prayers.sunrise.rawLocalMinutes).toBe(raw.prayers.sunrise.rawLocalMinutes);
    expect(adjusted.prayers.sunrise.baseLocalMinutes).toBe(
      normalizeDayMinutes(requiredMinutes(raw.prayers.sunrise.baseLocalMinutes) - 7),
    );
    expect(adjusted.prayers.dhuhr.baseLocalMinutes).toBe(
      normalizeDayMinutes(requiredMinutes(raw.prayers.dhuhr.baseLocalMinutes) + 5),
    );
    expect(adjusted.prayers.asr.baseLocalMinutes).toBe(
      normalizeDayMinutes(requiredMinutes(raw.prayers.asr.baseLocalMinutes) + 4),
    );
    expect(adjusted.prayers.maghrib.baseLocalMinutes).toBe(
      normalizeDayMinutes(requiredMinutes(raw.prayers.maghrib.baseLocalMinutes) + 7),
    );

    expect(adjusted.prayers.asr.provenance.manualAdjustmentMinutes).toBe(2);
    expect(adjusted.prayers.asr.adjustedLocalMinutes).toBe(
      normalizeDayMinutes(requiredMinutes(adjusted.prayers.asr.baseLocalMinutes) + 2),
    );
    expect(adjusted.prayers.asr.provenance.formula).toContain(
      'institutional method correction +4 min',
    );
  });

  it('returns the original schedule for a method without institutional corrections', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-08-16T00:00:00.000Z'),
      latitude: -33.8688,
      longitude: 151.2093,
      utcOffsetMinutes: 600,
      method: getCalculationMethod('muslim-world-league'),
      asrConvention: 'standard',
      highLatitudeRule: 'angle-based',
    });

    expect(applyInstitutionalAdjustments(schedule)).toBe(schedule);
  });
});
