import {
  buildPrayerDashboardResult,
  type PrayerDashboardResult,
} from '../domain/dashboardResult';
import {
  derivePrayerDashboardTick,
  prayerDashboardMatchesCivilDate,
} from '../domain/dashboardTick';
import type { PrayerName } from '../domain/prayerEngine';

export const TODAY_LIVE_FAST_TICK_MS = 1_000;
export const TODAY_LIVE_SLOW_TICK_MS = 60_000;
export const TODAY_FINAL_HOUR_SECONDS = 60 * 60;
export const TODAY_SCHEDULE_STATE_REFRESH_MS = 60_000;

const PRAYER_NAMES: readonly PrayerName[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

type DashboardBuildInput = Parameters<typeof buildPrayerDashboardResult>[0];
type DashboardBuilder = (input: DashboardBuildInput) => PrayerDashboardResult;

function adjustmentSignature(
  adjustments: DashboardBuildInput['adjustments'],
): readonly (number | null)[] {
  return PRAYER_NAMES.map((prayer) => adjustments?.[prayer] ?? null);
}

function methodAdjustmentSignature(
  input: DashboardBuildInput,
): readonly (number | null)[] {
  return PRAYER_NAMES.map((prayer) => input.method?.adjustments[prayer] ?? null);
}

function scheduleInputSignature(input: DashboardBuildInput): string {
  const method = input.method;
  return JSON.stringify({
    coordinates: [input.coordinates.latitude, input.coordinates.longitude],
    timeZone: input.timeZone ?? null,
    method:
      method === undefined
        ? null
        : {
            id: method.id,
            name: method.name,
            fajrAngleDegrees: method.fajrAngleDegrees,
            ishaRule: method.ishaRule,
            adjustments: methodAdjustmentSignature(input),
            provenance: method.provenance,
            verification: method.verification,
          },
    asrConvention: input.asrConvention ?? null,
    highLatitudeRule: input.highLatitudeRule ?? null,
    adjustments: adjustmentSignature(input.adjustments),
    hijriCorrectionDays: input.hijriCorrectionDays ?? null,
  });
}

function utcDateKey(instant: Date): string {
  return Number.isFinite(instant.getTime()) ? instant.toISOString().slice(0, 10) : 'invalid';
}

/**
 * Cache the expensive daily prayer schedule while continuing to derive live
 * clock/next/countdown state from the cached schedules. A rebuild occurs only
 * when schedule inputs change or the calculation timezone crosses a civil-date
 * boundary.
 */
export function createTodayPrayerDashboardResolver(
  builder: DashboardBuilder = buildPrayerDashboardResult,
): (input: DashboardBuildInput) => PrayerDashboardResult {
  let cachedSignature: string | null = null;
  let cachedResult: PrayerDashboardResult | null = null;
  let failedAttemptUtcDateKey: string | null = null;

  return (input) => {
    const signature = scheduleInputSignature(input);
    const signatureChanged = signature !== cachedSignature;
    const civilDateChanged =
      cachedResult?.ok === true &&
      !prayerDashboardMatchesCivilDate(cachedResult.dashboard, input.instant);
    const failedAttemptDateChanged =
      cachedResult?.ok === false && failedAttemptUtcDateKey !== utcDateKey(input.instant);

    if (
      cachedResult === null ||
      signatureChanged ||
      civilDateChanged ||
      failedAttemptDateChanged
    ) {
      cachedResult = builder(input);
      cachedSignature = signature;
      failedAttemptUtcDateKey = cachedResult.ok ? null : utcDateKey(input.instant);
    }

    if (!cachedResult.ok) return cachedResult;

    return {
      ...cachedResult,
      dashboard: derivePrayerDashboardTick(cachedResult.dashboard, input.instant),
    };
  };
}

export function todayLiveTickIntervalMilliseconds(input: {
  readonly secondsUntilNextPrayer: number | null;
  readonly clockVisible: boolean;
}): number {
  if (input.clockVisible) return TODAY_LIVE_FAST_TICK_MS;
  if (
    input.secondsUntilNextPrayer === null ||
    input.secondsUntilNextPrayer > TODAY_FINAL_HOUR_SECONDS
  ) {
    return TODAY_LIVE_SLOW_TICK_MS;
  }
  return TODAY_LIVE_FAST_TICK_MS;
}
