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
});
