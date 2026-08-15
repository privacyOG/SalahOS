import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';
import {
  calculateImsak,
  calculateIshraqAfterSunrise,
  calculateIslamicMidnight,
  calculateLastThirdStart,
} from './supplementaryTimes';

const method = getCalculationMethod('muslim-world-league');

const today = calculatePrayerSchedule({
  date: new Date('2026-08-16T00:00:00.000Z'),
  latitude: -33.8688,
  longitude: 151.2093,
  utcOffsetMinutes: 600,
  method,
});

const tomorrow = calculatePrayerSchedule({
  date: new Date('2026-08-17T00:00:00.000Z'),
  latitude: -33.8688,
  longitude: 151.2093,
  utcOffsetMinutes: 600,
  method,
});

function expectAvailable(value: number | null): number {
  if (value === null) {
    throw new Error('Expected supplementary time to be available');
  }
  return value;
}

describe('supplementary prayer times', () => {
  it('keeps Imsak and Ishraq offsets explicit', () => {
    const fajr = expectAvailable(today.prayers.fajr.roundedLocalMinutes);
    const sunrise = expectAvailable(today.prayers.sunrise.roundedLocalMinutes);

    expect(calculateImsak(today, 10).localMinutes).toBe((fajr - 10 + 1_440) % 1_440);
    expect(calculateIshraqAfterSunrise(today, 15).localMinutes).toBe((sunrise + 15) % 1_440);
    expect(calculateImsak(today, 10).provenance).toContain('10 minutes');
    expect(calculateIshraqAfterSunrise(today, 15).provenance).toContain('15 minutes');
  });

  it('calculates Islamic midnight and final-third start across civil midnight', () => {
    const midnight = expectAvailable(calculateIslamicMidnight(today, tomorrow).localMinutes);
    const lastThird = expectAvailable(calculateLastThirdStart(today, tomorrow).localMinutes);

    expect(lastThird).not.toBe(midnight);
    expect(calculateIslamicMidnight(today, tomorrow).provenance).toContain('next fajr');
    expect(calculateLastThirdStart(today, tomorrow).provenance).toContain('next fajr');
  });

  it('supports sunrise as an explicit alternate night-end convention', () => {
    const fajrMidnight = calculateIslamicMidnight(today, tomorrow, 'fajr').localMinutes;
    const sunriseMidnight = calculateIslamicMidnight(today, tomorrow, 'sunrise').localMinutes;

    expect(fajrMidnight).not.toBe(sunriseMidnight);
  });

  it('rejects excessive configured offsets', () => {
    expect(() => calculateImsak(today, 241)).toThrow(RangeError);
    expect(() => calculateIshraqAfterSunrise(today, -1)).toThrow(RangeError);
  });
});
