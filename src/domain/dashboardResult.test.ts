import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import {
  buildPrayerDashboardResult,
  buildPrayerDashboardScheduleResult,
  derivePrayerDashboardResult,
} from './dashboardResult';
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

  it('builds astronomy once for a civil date and derives later live state from that schedule', () => {
    const scheduleResult = buildPrayerDashboardScheduleResult({
      civilDate: new Date('2026-08-16T00:00:00.000Z'),
      coordinates: createCoordinates(-33.8688, 151.2093),
      timeZone: 'Australia/Sydney',
    });

    expect(scheduleResult.ok).toBe(true);
    const first = derivePrayerDashboardResult(scheduleResult, new Date('2026-08-16T00:00:00.000Z'));
    const later = derivePrayerDashboardResult(scheduleResult, new Date('2026-08-16T00:10:00.000Z'));

    expect(first.ok).toBe(true);
    expect(later.ok).toBe(true);
    if (first.ok && later.ok) {
      expect(first.dashboard.today).toBe(later.dashboard.today);
      expect(first.dashboard.tomorrow).toBe(later.dashboard.tomorrow);
      expect(first.unavailablePrayers).toEqual(later.unavailablePrayers);
    }
  });

  it('turns a stale schedule derivation into an unavailable result at the civil-date boundary', () => {
    const scheduleResult = buildPrayerDashboardScheduleResult({
      civilDate: new Date('2026-08-16T00:00:00.000Z'),
      coordinates: createCoordinates(-33.8688, 151.2093),
      timeZone: 'Australia/Sydney',
    });

    expect(
      derivePrayerDashboardResult(scheduleResult, new Date('2026-08-16T14:00:00.000Z')),
    ).toEqual({ ok: false, reason: 'calculation-unavailable' });
  });
});
