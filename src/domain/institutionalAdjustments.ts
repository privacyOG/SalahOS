import type { PrayerName, PrayerSchedule, PrayerTimeResult } from './prayerEngine';
import { roundMinutes } from './rounding';

const DAY_MINUTES = 1_440;
const INSTITUTIONAL_CORRECTION_MARKER = 'institutional method correction';
const PRAYERS: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function normalizeDayMinutes(minutes: number): number {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function applyPrayerAdjustment(
  prayer: PrayerTimeResult,
  adjustmentMinutes: number,
): PrayerTimeResult {
  if (
    adjustmentMinutes === 0 ||
    prayer.baseLocalMinutes === null ||
    prayer.provenance.formula.includes(INSTITUTIONAL_CORRECTION_MARKER)
  ) {
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
      formula: `${prayer.provenance.formula}; ${INSTITUTIONAL_CORRECTION_MARKER} ${sign}${String(adjustmentMinutes)} min`,
    },
  };
}

/**
 * Apply authority-published method corrections after astronomical event
 * calculation but before product presentation. Raw astronomical times remain
 * untouched and user/manual offsets remain separately identifiable in
 * provenance. Methods without an institutional correction are returned as-is.
 * Re-applying the layer is a no-op for prayers already carrying its provenance
 * marker, preventing accidental double application.
 */
export function applyInstitutionalAdjustments(schedule: PrayerSchedule): PrayerSchedule {
  const adjustments = schedule.method.institutionalAdjustments;
  if (Object.keys(adjustments).length === 0) {
    return schedule;
  }

  const prayers = { ...schedule.prayers };
  let changed = false;
  for (const name of PRAYERS) {
    const prayer = applyPrayerAdjustment(prayers[name], adjustments[name] ?? 0);
    if (prayer !== prayers[name]) {
      changed = true;
      prayers[name] = prayer;
    }
  }

  if (!changed) {
    return schedule;
  }

  return {
    ...schedule,
    prayers,
  };
}
