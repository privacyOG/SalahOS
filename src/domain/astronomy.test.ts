import { describe, expect, it } from 'vitest';
import { julianDay, solarCoordinates, solarDayEvents } from './astronomy';

describe('julianDay', () => {
  it('matches the J2000 epoch', () => {
    expect(julianDay(new Date('2000-01-01T12:00:00.000Z'))).toBe(2_451_545);
  });
});

describe('solarCoordinates', () => {
  it('places solar declination near zero at the March equinox', () => {
    const result = solarCoordinates(new Date('2026-03-20T14:46:00.000Z'));
    expect(Math.abs(result.declinationDegrees)).toBeLessThan(0.2);
  });

  it('keeps equation of time within its physical annual range', () => {
    const result = solarCoordinates(new Date('2026-08-16T00:00:00.000Z'));
    expect(result.equationOfTimeMinutes).toBeGreaterThan(-20);
    expect(result.equationOfTimeMinutes).toBeLessThan(20);
  });
});

describe('solarDayEvents', () => {
  it('returns sunrise before solar noon before sunset for Sydney', () => {
    const result = solarDayEvents(new Date('2026-08-16T00:00:00.000Z'), -33.8688, 151.2093);

    expect(result.sunriseUtcMinutes).not.toBeNull();
    expect(result.sunsetUtcMinutes).not.toBeNull();
    expect(result.sunriseUtcMinutes as number).toBeLessThan(result.solarNoonUtcMinutes);
    expect(result.solarNoonUtcMinutes).toBeLessThan(result.sunsetUtcMinutes as number);
  });

  it('reports unavailable events rather than fabricating them in polar day/night', () => {
    const result = solarDayEvents(new Date('2026-06-21T00:00:00.000Z'), 78.2232, 15.6469);
    expect(result.sunriseUtcMinutes).toBeNull();
    expect(result.sunsetUtcMinutes).toBeNull();
  });

  it('rejects invalid coordinates', () => {
    expect(() => solarDayEvents(new Date(), 91, 0)).toThrow(RangeError);
    expect(() => solarDayEvents(new Date(), 0, 181)).toThrow(RangeError);
  });
});
