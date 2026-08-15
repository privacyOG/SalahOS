import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';

function expectAvailable(value: number | null): number {
  if (value === null) {
    throw new Error('Expected prayer time to be available');
  }
  return value;
}

describe('calculatePrayerSchedule', () => {
  it('calculates the five prayers plus sunrise in chronological order for Sydney', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-08-16T00:00:00.000Z'),
      latitude: -33.8688,
      longitude: 151.2093,
      utcOffsetMinutes: 600,
      method: getCalculationMethod('muslim-world-league'),
    });

    const fajr = expectAvailable(schedule.prayers.fajr.roundedLocalMinutes);
    const sunrise = expectAvailable(schedule.prayers.sunrise.roundedLocalMinutes);
    const dhuhr = expectAvailable(schedule.prayers.dhuhr.roundedLocalMinutes);
    const asr = expectAvailable(schedule.prayers.asr.roundedLocalMinutes);
    const maghrib = expectAvailable(schedule.prayers.maghrib.roundedLocalMinutes);
    const isha = expectAvailable(schedule.prayers.isha.roundedLocalMinutes);

    expect(fajr).toBeLessThan(sunrise);
    expect(sunrise).toBeLessThan(dhuhr);
    expect(dhuhr).toBeLessThan(asr);
    expect(asr).toBeLessThan(maghrib);
    expect(maghrib).toBeLessThan(isha);
    expect(schedule.asrConvention).toBe('standard');
  });

  it('calculates Hanafi Asr later than Standard Asr', () => {
    const base = {
      date: new Date('2026-08-16T00:00:00.000Z'),
      latitude: -33.8688,
      longitude: 151.2093,
      utcOffsetMinutes: 600,
      method: getCalculationMethod('muslim-world-league'),
    } as const;

    const standard = calculatePrayerSchedule({ ...base, asrConvention: 'standard' });
    const hanafi = calculatePrayerSchedule({ ...base, asrConvention: 'hanafi' });

    expect(expectAvailable(hanafi.prayers.asr.baseLocalMinutes)).toBeGreaterThan(
      expectAvailable(standard.prayers.asr.baseLocalMinutes),
    );
  });

  it('keeps raw, fallback/base, manual-adjusted and rounded values separate', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-08-16T00:00:00.000Z'),
      latitude: -33.8688,
      longitude: 151.2093,
      utcOffsetMinutes: 600,
      method: getCalculationMethod('muslim-world-league'),
      adjustments: { fajr: 3 },
      roundingPolicy: 'ceiling-minute',
    });

    const fajr = schedule.prayers.fajr;
    const base = expectAvailable(fajr.baseLocalMinutes);
    const adjusted = expectAvailable(fajr.adjustedLocalMinutes);

    expect(fajr.rawUtcMinutes).not.toBeNull();
    expect(fajr.rawLocalMinutes).not.toBeNull();
    expect(adjusted).toBeCloseTo((base + 3) % 1_440, 8);
    expect(fajr.roundedLocalMinutes).toBe(Math.ceil(adjusted) % 1_440);
    expect(fajr.provenance.manualAdjustmentMinutes).toBe(3);
    expect(fajr.provenance.roundingPolicy).toBe('ceiling-minute');
  });

  it('uses a fixed Isha interval without hiding it as an angle calculation', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-08-16T00:00:00.000Z'),
      latitude: 21.4225,
      longitude: 39.8262,
      utcOffsetMinutes: 180,
      method: getCalculationMethod('umm-al-qura'),
    });

    const maghrib = expectAvailable(schedule.prayers.maghrib.baseLocalMinutes);
    const isha = expectAvailable(schedule.prayers.isha.baseLocalMinutes);

    expect(isha - maghrib).toBeCloseTo(90, 8);
    expect(schedule.prayers.isha.provenance.source).toBe('fixed-interval');
  });

  it('applies a transparent high-latitude fallback when twilight angle is unavailable', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-06-21T00:00:00.000Z'),
      latitude: 51.5074,
      longitude: -0.1278,
      utcOffsetMinutes: 60,
      method: getCalculationMethod('muslim-world-league'),
      highLatitudeRule: 'angle-based',
    });

    expect(schedule.prayers.fajr.provenance.highLatitudeRuleApplied).toBe(true);
    expect(schedule.prayers.isha.provenance.highLatitudeRuleApplied).toBe(true);
    expect(schedule.prayers.fajr.provenance.source).toBe('high-latitude-fallback');
    expect(schedule.prayers.isha.provenance.source).toBe('high-latitude-fallback');
    expect(schedule.prayers.fajr.baseLocalMinutes).not.toBeNull();
    expect(schedule.prayers.isha.baseLocalMinutes).not.toBeNull();
  });

  it('does not fabricate sunrise, sunset-based Maghrib, or twilight during polar day', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-06-21T00:00:00.000Z'),
      latitude: 78.2232,
      longitude: 15.6469,
      utcOffsetMinutes: 120,
      method: getCalculationMethod('muslim-world-league'),
    });

    expect(schedule.prayers.sunrise.baseLocalMinutes).toBeNull();
    expect(schedule.prayers.maghrib.baseLocalMinutes).toBeNull();
    expect(schedule.prayers.fajr.baseLocalMinutes).toBeNull();
    expect(schedule.prayers.isha.baseLocalMinutes).toBeNull();
    expect(schedule.prayers.fajr.provenance.source).toBe('unavailable');
  });

  it('rejects out-of-range manual adjustments', () => {
    expect(() =>
      calculatePrayerSchedule({
        date: new Date('2026-08-16T00:00:00.000Z'),
        latitude: -33.8688,
        longitude: 151.2093,
        utcOffsetMinutes: 600,
        method: getCalculationMethod('muslim-world-league'),
        adjustments: { fajr: 181 },
      }),
    ).toThrow(RangeError);
  });
});
