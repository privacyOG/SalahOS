import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboardResult } from './dashboardResult';
import { calculationMethods } from './methods';

describe('buildPrayerDashboardResult', () => {
  it('returns a dashboard and reports no unavailable rows for an ordinary location', () => {
    const result = buildPrayerDashboardResult({
      instant: new Date('2026-08-16T01:30:00.000Z'),
      coordinates: createCoordinates(-33.8688, 151.2093),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dashboard.timeZone).toBe('Australia/Sydney');
      expect(result.unavailablePrayers).toEqual([]);
    }
  });

  it('surfaces prayer rows that remain astronomically unavailable', () => {
    const result = buildPrayerDashboardResult({
      instant: new Date('2026-06-21T12:00:00.000Z'),
      coordinates: createCoordinates(90, 0),
      highLatitudeRule: 'angle-based',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unavailablePrayers.length).toBeGreaterThan(0);
      expect(result.unavailablePrayers).toContain('sunrise');
    }
  });

  it('converts calculation exceptions into an explicit unavailable result', () => {
    const result = buildPrayerDashboardResult({
      instant: new Date('2026-08-16T01:30:00.000Z'),
      coordinates: createCoordinates(-33.8688, 151.2093),
      method: calculationMethods['muslim-world-league'],
      adjustments: { fajr: 181 },
    });

    expect(result).toEqual({ ok: false, reason: 'calculation-unavailable' });
  });
});
