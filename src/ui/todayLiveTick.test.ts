import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import * as dashboardResult from '../domain/dashboardResult';
import {
  countdownTargetEpochMilliseconds,
  millisecondsUntilNextMinute,
  remainingCountdownSeconds,
  TODAY_FAST_TICK_MILLISECONDS,
  TODAY_SLOW_TICK_MILLISECONDS,
  todayCountdownTickMilliseconds,
  todayPrayerCivilDateIso,
} from './todayLiveTickModel';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Today live tick scheduling', () => {
  it('uses minute ticks while the app-bar clock is hidden and the next prayer is over an hour away', () => {
    expect(todayCountdownTickMilliseconds(3_601, true)).toBe(TODAY_SLOW_TICK_MILLISECONDS);
    expect(todayCountdownTickMilliseconds(7_200, true)).toBe(TODAY_SLOW_TICK_MILLISECONDS);
  });

  it('restores second ticks inside the final hour or whenever the app-bar clock is visible', () => {
    expect(todayCountdownTickMilliseconds(3_600, true)).toBe(TODAY_FAST_TICK_MILLISECONDS);
    expect(todayCountdownTickMilliseconds(600, true)).toBe(TODAY_FAST_TICK_MILLISECONDS);
    expect(todayCountdownTickMilliseconds(7_200, false)).toBe(TODAY_FAST_TICK_MILLISECONDS);
    expect(todayCountdownTickMilliseconds(null, true)).toBeNull();
  });

  it('aligns the parent refresh to the next minute boundary', () => {
    expect(millisecondsUntilNextMinute(new Date('2026-08-16T00:00:00.000Z'))).toBe(60_000);
    expect(millisecondsUntilNextMinute(new Date('2026-08-16T00:00:12.345Z'))).toBe(47_655);
  });

  it('derives a stable countdown target instead of decrementing parent dashboard state', () => {
    const generatedAt = new Date('2026-08-16T00:00:00.000Z');
    const target = countdownTargetEpochMilliseconds(generatedAt, 3_700);

    expect(target).toBe(generatedAt.getTime() + 3_700_000);
    expect(remainingCountdownSeconds(target, new Date('2026-08-16T00:00:10.000Z'))).toBe(3_690);
  });

  it('reduces buildPrayerDashboardResult-equivalent calls from 601 to 1 over a ten-minute same-date window', () => {
    const buildSpy = vi
      .spyOn(dashboardResult, 'buildPrayerDashboardResult')
      .mockReturnValue({ ok: false, reason: 'calculation-unavailable' });
    const coordinates = createCoordinates(-33.8688, 151.2093);
    const start = new Date('2026-08-16T00:00:00.000Z');
    const instants = Array.from(
      { length: 601 },
      (_, index) => new Date(start.getTime() + index * 1_000),
    );

    for (const instant of instants) {
      dashboardResult.buildPrayerDashboardResult({
        instant,
        coordinates,
        timeZone: 'Australia/Sydney',
      });
    }
    expect(buildSpy).toHaveBeenCalledTimes(601);

    buildSpy.mockClear();
    let previousCivilDateIso: string | null = null;
    for (const instant of instants) {
      const civilDateIso = todayPrayerCivilDateIso(instant, 'Australia/Sydney');
      if (civilDateIso === previousCivilDateIso) continue;
      previousCivilDateIso = civilDateIso;
      dashboardResult.buildPrayerDashboardResult({
        instant,
        coordinates,
        timeZone: 'Australia/Sydney',
      });
    }

    expect(previousCivilDateIso).toBe('2026-08-16');
    expect(buildSpy).toHaveBeenCalledTimes(1);
  });

  it('changes the schedule boundary exactly when the calculation timezone civil date changes', () => {
    expect(todayPrayerCivilDateIso(new Date('2026-08-16T13:59:59.000Z'), 'Australia/Sydney')).toBe(
      '2026-08-16',
    );
    expect(todayPrayerCivilDateIso(new Date('2026-08-16T14:00:00.000Z'), 'Australia/Sydney')).toBe(
      '2026-08-17',
    );
  });
});
