import { describe, expect, it, vi } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import {
  buildPrayerDashboardResult,
  type PrayerDashboardResult,
} from '../domain/dashboardResult';
import { calculationMethods } from '../domain/methods';
import {
  TODAY_LIVE_FAST_TICK_MS,
  TODAY_LIVE_SLOW_TICK_MS,
  createTodayPrayerDashboardResolver,
  todayLiveTickIntervalMilliseconds,
} from './todayPrayerDashboardScheduler';

type DashboardBuildInput = Parameters<typeof buildPrayerDashboardResult>[0];

const baseInput: Omit<DashboardBuildInput, 'instant'> = {
  coordinates: createCoordinates(-33.8688, 151.2093),
  timeZone: 'Australia/Sydney',
  method: calculationMethods['muslim-world-league'],
  asrConvention: 'standard',
  highLatitudeRule: 'angle-based',
  adjustments: {},
  hijriCorrectionDays: 0,
};

function inputAt(iso: string): DashboardBuildInput {
  return { ...baseInput, instant: new Date(iso) };
}

describe('Today prayer dashboard schedule resolver', () => {
  it('reduces a simulated ten-minute one-second window from 601 astronomy builds to one', () => {
    const builder = vi.fn<(input: DashboardBuildInput) => PrayerDashboardResult>(
      buildPrayerDashboardResult,
    );
    const resolveDashboard = createTodayPrayerDashboardResolver(builder);
    const startMilliseconds = new Date('2026-09-06T00:00:00.000Z').getTime();
    const samples = Array.from({ length: 601 }, (_, index) =>
      new Date(startMilliseconds + index * 1_000),
    );

    for (const instant of samples) {
      const result = resolveDashboard({ ...baseInput, instant });
      expect(result.ok).toBe(true);
    }

    const beforeBuildCalls = samples.length;
    const afterBuildCalls = builder.mock.calls.length;
    expect(beforeBuildCalls).toBe(601);
    expect(afterBuildCalls).toBe(1);
  });

  it('rebuilds when schedule inputs or the calculation civil date changes', () => {
    const builder = vi.fn<(input: DashboardBuildInput) => PrayerDashboardResult>(
      buildPrayerDashboardResult,
    );
    const resolveDashboard = createTodayPrayerDashboardResolver(builder);

    resolveDashboard(inputAt('2026-09-06T00:00:00.000Z'));
    resolveDashboard(inputAt('2026-09-06T00:01:00.000Z'));
    expect(builder).toHaveBeenCalledTimes(1);

    resolveDashboard({
      ...inputAt('2026-09-06T00:02:00.000Z'),
      coordinates: createCoordinates(-33.86, 151.2),
    });
    expect(builder).toHaveBeenCalledTimes(2);

    resolveDashboard({
      ...inputAt('2026-09-06T14:00:00.000Z'),
      coordinates: createCoordinates(-33.86, 151.2),
    });
    expect(builder).toHaveBeenCalledTimes(3);
  });
});

describe('Today live tick cadence', () => {
  it('uses minute ticks only when the clock is hidden and the countdown is beyond one hour', () => {
    expect(
      todayLiveTickIntervalMilliseconds({
        secondsUntilNextPrayer: 3_601,
        clockVisible: false,
      }),
    ).toBe(TODAY_LIVE_SLOW_TICK_MS);
    expect(
      todayLiveTickIntervalMilliseconds({
        secondsUntilNextPrayer: 3_600,
        clockVisible: false,
      }),
    ).toBe(TODAY_LIVE_FAST_TICK_MS);
    expect(
      todayLiveTickIntervalMilliseconds({
        secondsUntilNextPrayer: 7_200,
        clockVisible: true,
      }),
    ).toBe(TODAY_LIVE_FAST_TICK_MS);
    expect(
      todayLiveTickIntervalMilliseconds({
        secondsUntilNextPrayer: null,
        clockVisible: false,
      }),
    ).toBe(TODAY_LIVE_SLOW_TICK_MS);
  });
});
