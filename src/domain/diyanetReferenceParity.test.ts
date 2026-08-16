import { describe, expect, it } from 'vitest';
import { applyInstitutionalAdjustments } from './institutionalAdjustments';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';
import type { PrayerName } from './prayerEngine';

const PRAYERS: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function expectParity(
  actual: ReturnType<typeof calculatePrayerSchedule>,
  expected: Readonly<Record<PrayerName, number>>,
  toleranceMinutes: number,
): void {
  for (const prayer of PRAYERS) {
    const value = actual.prayers[prayer].roundedLocalMinutes;
    if (value === null) {
      throw new Error(`Expected ${prayer} to be available`);
    }
    expect(Math.abs(value - expected[prayer]), prayer).toBeLessThanOrEqual(toleranceMinutes);
  }
}

describe('Diyanet authoritative timetable parity', () => {
  it('matches the published Sydney timetable after official institutional corrections', () => {
    // Primary source checked 2026-08-16:
    // https://namazvakitleri.diyanet.gov.tr/tr-TR/22182/sydney-namaz-vakitleri
    // Published 2026-07-28 values: Imsak 05:24, Güneş 06:44, Öğle 12:07,
    // İkindi 14:56, Akşam 17:20, Yatsı 18:34. The same page publishes
    // astronomical sunrise 06:51 and sunset 17:13, directly demonstrating
    // Diyanet's documented 7-minute sunrise/sunset temkin policy.
    const schedule = applyInstitutionalAdjustments(
      calculatePrayerSchedule({
        date: new Date('2026-07-28T00:00:00.000Z'),
        latitude: -33.8688,
        longitude: 151.2093,
        utcOffsetMinutes: 600,
        method: getCalculationMethod('diyanet'),
        asrConvention: 'standard',
        highLatitudeRule: 'angle-based',
      }),
    );

    expectParity(
      schedule,
      {
        fajr: 5 * 60 + 24,
        sunrise: 6 * 60 + 44,
        dhuhr: 12 * 60 + 7,
        asr: 14 * 60 + 56,
        maghrib: 17 * 60 + 20,
        isha: 18 * 60 + 34,
      },
      2,
    );
  });

  it('matches the published Istanbul timetable on the 2026 summer profile', () => {
    // Primary source checked 2026-08-16:
    // https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti
    // Published 2026-08-16 values: Imsak 04:31, Güneş 06:08, Öğle 13:14,
    // İkindi 17:02, Akşam 20:10, Yatsı 21:40.
    const schedule = applyInstitutionalAdjustments(
      calculatePrayerSchedule({
        date: new Date('2026-08-16T00:00:00.000Z'),
        latitude: 41.0082,
        longitude: 28.9784,
        utcOffsetMinutes: 180,
        method: getCalculationMethod('diyanet'),
        asrConvention: 'standard',
        highLatitudeRule: 'angle-based',
      }),
    );

    expectParity(
      schedule,
      {
        fajr: 4 * 60 + 31,
        sunrise: 6 * 60 + 8,
        dhuhr: 13 * 60 + 14,
        asr: 17 * 60 + 2,
        maghrib: 20 * 60 + 10,
        isha: 21 * 60 + 40,
      },
      2,
    );
  });

  it('matches the published Istanbul timetable on the 2026 winter profile', () => {
    // Same primary source, annual timetable entry for 2026-01-01:
    // Imsak 06:50, Güneş 08:22, Öğle 13:12, İkindi 15:32,
    // Akşam 17:53, Yatsı 19:19.
    const schedule = applyInstitutionalAdjustments(
      calculatePrayerSchedule({
        date: new Date('2026-01-01T00:00:00.000Z'),
        latitude: 41.0082,
        longitude: 28.9784,
        utcOffsetMinutes: 180,
        method: getCalculationMethod('diyanet'),
        asrConvention: 'standard',
        highLatitudeRule: 'angle-based',
      }),
    );

    expectParity(
      schedule,
      {
        fajr: 6 * 60 + 50,
        sunrise: 8 * 60 + 22,
        dhuhr: 13 * 60 + 12,
        asr: 15 * 60 + 32,
        maghrib: 17 * 60 + 53,
        isha: 19 * 60 + 19,
      },
      2,
    );
  });
});
