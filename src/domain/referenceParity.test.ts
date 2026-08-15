import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';
import type { PrayerName } from './prayerEngine';

const OBLIGATORY_AND_SUNRISE: readonly PrayerName[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

function expectParity(
  actual: ReturnType<typeof calculatePrayerSchedule>,
  expected: Readonly<Record<PrayerName, number>>,
  toleranceMinutes: number,
): void {
  for (const prayer of OBLIGATORY_AND_SUNRISE) {
    const value = actual.prayers[prayer].roundedLocalMinutes;
    if (value === null) {
      throw new Error(`Expected ${prayer} to be available`);
    }
    expect(Math.abs(value - expected[prayer]), prayer).toBeLessThanOrEqual(toleranceMinutes);
  }
}

describe('pinned external prayer-time parity fixtures', () => {
  it('matches the pinned Umm al-Qura Makkah fixture within two minutes', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2016-06-04T00:00:00.000Z'),
      latitude: 21.427009,
      longitude: 39.828685,
      utcOffsetMinutes: 180,
      method: getCalculationMethod('umm-al-qura'),
      asrConvention: 'standard',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectParity(
      schedule,
      {
        fajr: 4 * 60 + 11,
        sunrise: 5 * 60 + 38,
        dhuhr: 12 * 60 + 19,
        asr: 15 * 60 + 36,
        maghrib: 19 * 60 + 1,
        isha: 20 * 60 + 31,
      },
      2,
    );
  });

  it('matches the pinned MUIS Singapore fixture within its published two-minute variance', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2020-01-01T00:00:00.000Z'),
      latitude: 1.370844612058886,
      longitude: 103.80145644060552,
      utcOffsetMinutes: 480,
      method: getCalculationMethod('muis'),
      asrConvention: 'standard',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectParity(
      schedule,
      {
        fajr: 5 * 60 + 44,
        sunrise: 7 * 60 + 7,
        dhuhr: 13 * 60 + 10,
        asr: 16 * 60 + 34,
        maghrib: 19 * 60 + 10,
        isha: 20 * 60 + 25,
      },
      2,
    );
  });

  it('matches the pinned Qatar ministry Doha fixture within its documented two-minute adjustment range', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2016-06-01T00:00:00.000Z'),
      latitude: 25.283897,
      longitude: 51.52877,
      utcOffsetMinutes: 180,
      method: getCalculationMethod('qatar'),
      asrConvention: 'standard',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectParity(
      schedule,
      {
        fajr: 3 * 60 + 15,
        sunrise: 4 * 60 + 43,
        dhuhr: 11 * 60 + 32,
        asr: 14 * 60 + 56,
        maghrib: 18 * 60 + 20,
        isha: 19 * 60 + 50,
      },
      2,
    );
  });

  it('matches the pinned Kuwait City fixture within its published two-minute variance', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2016-06-01T00:00:00.000Z'),
      latitude: 29.370865,
      longitude: 47.979139,
      utcOffsetMinutes: 180,
      method: getCalculationMethod('kuwait'),
      asrConvention: 'standard',
      highLatitudeRule: 'middle-of-the-night',
    });

    expectParity(
      schedule,
      {
        fajr: 3 * 60 + 15,
        sunrise: 4 * 60 + 49,
        dhuhr: 11 * 60 + 46,
        asr: 15 * 60 + 20,
        maghrib: 18 * 60 + 43,
        isha: 20 * 60 + 13,
      },
      2,
    );
  });
});
