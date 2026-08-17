import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule, type PrayerName } from './prayerEngine';

interface CanonicalFixture {
  readonly label: string;
  readonly date: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly utcOffsetMinutes: number;
  readonly method: Parameters<typeof getCalculationMethod>[0];
  readonly asrConvention: 'standard' | 'hanafi';
  readonly expected: Readonly<Record<PrayerName, number>>;
}

const prayers: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const fixtures: readonly CanonicalFixture[] = [
  {
    label: 'Adhan JS NorthAmerica / Raleigh / Hanafi',
    date: '2015-07-12',
    latitude: 35.775,
    longitude: -78.6336,
    utcOffsetMinutes: -240,
    method: 'isna',
    asrConvention: 'hanafi',
    expected: {
      fajr: 4 * 60 + 42,
      sunrise: 6 * 60 + 8,
      dhuhr: 13 * 60 + 21,
      asr: 18 * 60 + 22,
      maghrib: 20 * 60 + 32,
      isha: 21 * 60 + 57,
    },
  },
  {
    label: 'Adhan JS MuslimWorldLeague / Raleigh / Standard',
    date: '2015-12-01',
    latitude: 35.775,
    longitude: -78.6336,
    utcOffsetMinutes: -300,
    method: 'muslim-world-league',
    asrConvention: 'standard',
    expected: {
      fajr: 5 * 60 + 35,
      sunrise: 7 * 60 + 6,
      dhuhr: 12 * 60 + 5,
      asr: 14 * 60 + 42,
      maghrib: 17 * 60 + 1,
      isha: 18 * 60 + 26,
    },
  },
  {
    label: 'Adhan JS Egyptian / Cairo / Standard',
    date: '2020-01-01',
    latitude: 30.028703,
    longitude: 31.249528,
    utcOffsetMinutes: 120,
    method: 'egyptian',
    asrConvention: 'standard',
    expected: {
      fajr: 5 * 60 + 18,
      sunrise: 6 * 60 + 51,
      dhuhr: 11 * 60 + 59,
      asr: 14 * 60 + 47,
      maghrib: 17 * 60 + 6,
      isha: 18 * 60 + 29,
    },
  },
  {
    label: 'Adhan JS Turkey / Istanbul / Standard',
    date: '2020-04-16',
    latitude: 41.005616,
    longitude: 28.97638,
    utcOffsetMinutes: 180,
    method: 'diyanet',
    asrConvention: 'standard',
    expected: {
      fajr: 4 * 60 + 44,
      sunrise: 6 * 60 + 16,
      dhuhr: 13 * 60 + 9,
      asr: 16 * 60 + 53,
      maghrib: 19 * 60 + 52,
      isha: 21 * 60 + 19,
    },
  },
  {
    label: 'Adhan JS Singapore / Malaysia / Standard',
    date: '2021-06-14',
    latitude: 3.7333333333,
    longitude: 101.3833333333,
    utcOffsetMinutes: 480,
    method: 'muis',
    asrConvention: 'standard',
    expected: {
      fajr: 5 * 60 + 41,
      sunrise: 7 * 60 + 5,
      dhuhr: 13 * 60 + 16,
      asr: 16 * 60 + 42,
      maghrib: 19 * 60 + 25,
      isha: 20 * 60 + 41,
    },
  },
];

function expectCanonicalParity(fixture: CanonicalFixture): void {
  const schedule = calculatePrayerSchedule({
    date: new Date(`${fixture.date}T00:00:00.000Z`),
    latitude: fixture.latitude,
    longitude: fixture.longitude,
    utcOffsetMinutes: fixture.utcOffsetMinutes,
    method: getCalculationMethod(fixture.method),
    asrConvention: fixture.asrConvention,
    highLatitudeRule: 'middle-of-the-night',
  });

  for (const prayer of prayers) {
    const actual = schedule.prayers[prayer].roundedLocalMinutes;
    expect(actual, `${fixture.label}: ${prayer} should be available`).not.toBeNull();
    expect(
      Math.abs(actual! - fixture.expected[prayer]),
      `${fixture.label}: ${prayer}`,
    ).toBeLessThanOrEqual(2);
  }
}

describe('pinned canonical Adhan JS 4.4.4 parity', () => {
  for (const fixture of fixtures) {
    it(`matches ${fixture.label} within two minutes`, () => {
      expectCanonicalParity(fixture);
    });
  }
});
