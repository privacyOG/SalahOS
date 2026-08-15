import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { createLocationPrayerContext } from './locationPrayerContext';
import { getCalculationMethod } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';

function expectAvailable(value: number | null): number {
  if (value === null) {
    throw new Error('Expected prayer time to be available');
  }
  return value;
}

function expectOrderedPrayerSchedule(
  coordinates: ReturnType<typeof createCoordinates>,
  instant: Date,
  expectedTimeZone: string,
  expectedUtcOffsetMinutes: number,
): void {
  const context = createLocationPrayerContext(instant, coordinates);

  expect(context.timeZone).toBe(expectedTimeZone);
  expect(context.utcOffsetMinutes).toBe(expectedUtcOffsetMinutes);
  expect(context.timezoneSource).toBe('offline-coordinate-lookup');

  const schedule = calculatePrayerSchedule({
    date: context.civilDate,
    latitude: context.coordinates.latitude,
    longitude: context.coordinates.longitude,
    utcOffsetMinutes: context.utcOffsetMinutes,
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
}

describe('location → timezone → prayer calculation integration', () => {
  it('resolves Sydney location context and calculates the local prayer schedule', () => {
    const coordinates = createCoordinates(-33.8688, 151.2093);
    const context = createLocationPrayerContext(new Date('2026-08-15T15:30:00.000Z'), coordinates);

    expect(context.timeZone).toBe('Australia/Sydney');
    expect(context.utcOffsetMinutes).toBe(600);
    expect(context.civilDate.toISOString()).toBe('2026-08-16T00:00:00.000Z');
    expect(context.timezoneSource).toBe('offline-coordinate-lookup');

    const schedule = calculatePrayerSchedule({
      date: context.civilDate,
      latitude: context.coordinates.latitude,
      longitude: context.coordinates.longitude,
      utcOffsetMinutes: context.utcOffsetMinutes,
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
  });

  it('rolls the Sydney civil date exactly at local midnight', () => {
    const coordinates = createCoordinates(-33.8688, 151.2093);
    const beforeMidnight = createLocationPrayerContext(
      new Date('2026-08-16T13:59:59.000Z'),
      coordinates,
    );
    const atMidnight = createLocationPrayerContext(
      new Date('2026-08-16T14:00:00.000Z'),
      coordinates,
    );

    expect(beforeMidnight.timeZone).toBe('Australia/Sydney');
    expect(beforeMidnight.utcOffsetMinutes).toBe(600);
    expect(beforeMidnight.civilDate.toISOString()).toBe('2026-08-16T00:00:00.000Z');
    expect(atMidnight.utcOffsetMinutes).toBe(600);
    expect(atMidnight.civilDate.toISOString()).toBe('2026-08-17T00:00:00.000Z');
  });

  const equinoxInstant = new Date('2026-03-20T12:00:00.000Z');
  const geographicCases = [
    {
      name: 'Madinah',
      latitude: 24.5247,
      longitude: 39.5692,
      timeZone: 'Asia/Riyadh',
      utcOffsetMinutes: 180,
    },
    {
      name: 'Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
      timeZone: 'Australia/Sydney',
      utcOffsetMinutes: 660,
    },
    {
      name: 'Melbourne',
      latitude: -37.8136,
      longitude: 144.9631,
      timeZone: 'Australia/Melbourne',
      utcOffsetMinutes: 660,
    },
    {
      name: 'Cairo',
      latitude: 30.0444,
      longitude: 31.2357,
      timeZone: 'Africa/Cairo',
      utcOffsetMinutes: 120,
    },
    {
      name: 'Istanbul',
      latitude: 41.0082,
      longitude: 28.9784,
      timeZone: 'Europe/Istanbul',
      utcOffsetMinutes: 180,
    },
    {
      name: 'Karachi',
      latitude: 24.8607,
      longitude: 67.0011,
      timeZone: 'Asia/Karachi',
      utcOffsetMinutes: 300,
    },
    {
      name: 'Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      timeZone: 'Asia/Jakarta',
      utcOffsetMinutes: 420,
    },
    {
      name: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      timeZone: 'Europe/London',
      utcOffsetMinutes: 0,
    },
    {
      name: 'New York',
      latitude: 40.7128,
      longitude: -74.006,
      timeZone: 'America/New_York',
      utcOffsetMinutes: -240,
    },
    {
      name: 'Oslo',
      latitude: 59.9139,
      longitude: 10.7522,
      timeZone: 'Europe/Oslo',
      utcOffsetMinutes: 60,
    },
    {
      name: 'Quito equatorial fixture',
      latitude: -0.1807,
      longitude: -78.4678,
      timeZone: 'America/Guayaquil',
      utcOffsetMinutes: -300,
    },
  ] as const;

  for (const location of geographicCases) {
    it(`resolves and calculates an ordered equinox schedule for ${location.name}`, () => {
      expectOrderedPrayerSchedule(
        createCoordinates(location.latitude, location.longitude),
        equinoxInstant,
        location.timeZone,
        location.utcOffsetMinutes,
      );
    });
  }

  it('covers northern, southern and equatorial latitude bands explicitly', () => {
    expect(geographicCases.some((location) => location.latitude > 0)).toBe(true);
    expect(geographicCases.some((location) => location.latitude < 0)).toBe(true);
    expect(geographicCases.some((location) => Math.abs(location.latitude) < 1)).toBe(true);
  });

  it('resolves Tromso seasonal IANA offsets without deriving them from longitude', () => {
    const coordinates = createCoordinates(69.6492, 18.9553);
    const summer = createLocationPrayerContext(new Date('2026-06-21T12:00:00.000Z'), coordinates);
    const winter = createLocationPrayerContext(new Date('2026-12-21T12:00:00.000Z'), coordinates);

    expect(summer.timeZone).toBe('Europe/Oslo');
    expect(summer.utcOffsetMinutes).toBe(120);
    expect(summer.civilDate.toISOString()).toBe('2026-06-21T00:00:00.000Z');
    expect(winter.timeZone).toBe('Europe/Oslo');
    expect(winter.utcOffsetMinutes).toBe(60);
    expect(winter.civilDate.toISOString()).toBe('2026-12-21T00:00:00.000Z');
  });
});
