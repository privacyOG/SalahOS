import type { PrayerName, PrayerSchedule, PrayerTimeResult } from './prayerEngine';
import { roundMinutes } from './rounding';

const DAY_MINUTES = 1_440;
const PRAYERS: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function normalizeDayMinutes(minutes: number): number {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function applyPrayerAdjustment(
  prayer: PrayerTimeResult,
  adjustmentMinutes: number,
): PrayerTimeResult {
  if (adjustmentMinutes === 0 || prayer.baseLocalMinutes === null) {
    return prayer;
  }

  const baseLocalMinutes = normalizeDayMinutes(prayer.baseLocalMinutes + adjustmentMinutes);
  const adjustedLocalMinutes = normalizeDayMinutes(
    baseLocalMinutes + prayer.provenance.manualAdjustmentMinutes,
  );
  const roundedLocalMinutes = normalizeDayMinutes(
    roundMinutes(adjustedLocalMinutes, prayer.provenance.roundingPolicy),
  );
  const sign = adjustmentMinutes > 0 ? '+' : '';

  return {
    ...prayer,
    baseLocalMinutes,
    adjustedLocalMinutes,
    roundedLocalMinutes,
    provenance: {
      ...prayer.provenance,
      formula: `${prayer.provenance.formula}; institutional method correction ${sign}${String(adjustmentMinutes)} min`,
    },
  };
}

/**
 * Apply authority-published method corrections after astronomical event
 * calculation but before product presentation. Raw astronomical times remain
 * untouched and user/manual offsets remain separately identifiable in
 * provenance. Methods without an institutional correction are returned as-is.
 */
export function applyInstitutionalAdjustments(schedule: PrayerSchedule): PrayerSchedule {
  const adjustments = schedule.method.institutionalAdjustments;
  if (Object.keys(adjustments).length === 0) {
    return schedule;
  }

  const prayers = { ...schedule.prayers };
  for (const name of PRAYERS) {
    prayers[name] = applyPrayerAdjustment(prayers[name], adjustments[name] ?? 0);
  }

  return {
    ...schedule,
    prayers,
  };
}
