import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { findNextPrayer } from './nextPrayer';
import { calculatePrayerSchedule } from './prayerEngine';

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

function required(value: number | null): number {
  if (value === null) {
    throw new Error('Expected prayer time to be available');
  }
  return value;
}

describe('findNextPrayer', () => {
  it('selects the next obligatory prayer and ignores sunrise', () => {
    const fajr = required(today.prayers.fajr.roundedLocalMinutes);
    const sunrise = required(today.prayers.sunrise.roundedLocalMinutes);
    const result = findNextPrayer((fajr + sunrise) / 2, today, tomorrow);

    expect(result?.prayer).toBe('dhuhr');
    expect(result?.dayOffset).toBe(0);
  });

  it('rolls from after Isha to tomorrow Fajr', () => {
    const isha = required(today.prayers.isha.roundedLocalMinutes);
    const tomorrowFajr = required(tomorrow.prayers.fajr.roundedLocalMinutes);
    const now = Math.min(1_439, isha + 1);
    const result = findNextPrayer(now, today, tomorrow);

    expect(result).toEqual({
      prayer: 'fajr',
      localMinutes: tomorrowFajr,
      dayOffset: 1,
      minutesUntil: 1_440 - now + tomorrowFajr,
    });
  });

  it('returns null when tomorrow Fajr is astronomically unavailable', () => {
    const polarToday = calculatePrayerSchedule({
      date: new Date('2026-06-21T00:00:00.000Z'),
      latitude: 78.2232,
      longitude: 15.6469,
      utcOffsetMinutes: 120,
      method,
    });
    const polarTomorrow = calculatePrayerSchedule({
      date: new Date('2026-06-22T00:00:00.000Z'),
      latitude: 78.2232,
      longitude: 15.6469,
      utcOffsetMinutes: 120,
      method,
    });

    expect(findNextPrayer(1_439, polarToday, polarTomorrow)).toBeNull();
  });

  it('rejects invalid current local time input', () => {
    expect(() => findNextPrayer(-1, today, tomorrow)).toThrow(RangeError);
    expect(() => findNextPrayer(1_440, today, tomorrow)).toThrow(RangeError);
  });
});
