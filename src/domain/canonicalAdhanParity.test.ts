import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule, type PrayerName } from './prayerEngine';

const UPSTREAM_REFERENCE =
  'batoulapps/adhan-js@a6f1a5c4a00105103f310ef18200b95f7184d2e7:test/adhan.test.ts';
const PRAYERS: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function expectCanonicalParity(
  actual: ReturnType<typeof calculatePrayerSchedule>,
  expected: Readonly<Record<PrayerName, number>>,
): void {
  for (const prayer of PRAYERS) {
    const value = actual.prayers[prayer].roundedLocalMinutes;
    if (value === null) {
      throw new Error(`Expected ${prayer} to be available for ${UPSTREAM_REFERENCE}`);
    }
    // The upstream fixture is minute-formatted while SalahOS rounds only at its
    // presentation boundary. Two minutes covers independent second-level solar
    // math/rounding without hiding a materially different calculation result.
    expect(Math.abs(value - expected[prayer]), prayer).toBeLessThanOrEqual(2);
  }
}

describe('pinned Adhan JS canonical-output parity', () => {
  it('matches the upstream North America / Hanafi Raleigh fixture', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2015-07-12T00:00:00.000Z'),
      latitude: 35.775,
      longitude: -78.6336,
      utcOffsetMinutes: -240,
      method: getCalculationMethod('isna'),
      asrConvention: 'hanafi',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectCanonicalParity(schedule, {
      fajr: 4 * 60 + 42,
      sunrise: 6 * 60 + 8,
      dhuhr: 13 * 60 + 21,
      asr: 18 * 60 + 22,
      maghrib: 20 * 60 + 32,
      isha: 21 * 60 + 57,
    });
  });

  it('matches the upstream Egyptian Cairo fixture', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2020-01-01T00:00:00.000Z'),
      latitude: 30.028703,
      longitude: 31.249528,
      utcOffsetMinutes: 120,
      method: getCalculationMethod('egyptian'),
      asrConvention: 'standard',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectCanonicalParity(schedule, {
      fajr: 5 * 60 + 18,
      sunrise: 6 * 60 + 51,
      dhuhr: 11 * 60 + 59,
      asr: 14 * 60 + 47,
      maghrib: 17 * 60 + 6,
      isha: 18 * 60 + 29,
    });
  });

  it('matches the upstream Singapore method fixture', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2021-06-14T00:00:00.000Z'),
      latitude: 3.7333333333,
      longitude: 101.3833333333,
      utcOffsetMinutes: 480,
      method: getCalculationMethod('muis'),
      asrConvention: 'standard',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectCanonicalParity(schedule, {
      fajr: 5 * 60 + 41,
      sunrise: 7 * 60 + 5,
      dhuhr: 13 * 60 + 16,
      asr: 16 * 60 + 42,
      maghrib: 19 * 60 + 25,
      isha: 20 * 60 + 41,
    });
  });
});
