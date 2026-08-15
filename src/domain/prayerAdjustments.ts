import type { PrayerSourceMode } from './mosqueTimetable';
import type { PrayerName } from './prayerEngine';

export type PrayerAdjustments = Readonly<Partial<Record<PrayerName, number>>>;

export function manualPrayerAdjustmentMinutes(
  adjustments: PrayerAdjustments,
  prayer: PrayerName,
): number | null {
  const minutes = adjustments[prayer];
  return minutes === undefined || minutes === 0 ? null : minutes;
}

export function displayedManualPrayerAdjustmentMinutes(
  manualAdjustmentMinutes: number,
  sourceMode: PrayerSourceMode,
): number | null {
  if (sourceMode === 'local-mosque' || manualAdjustmentMinutes === 0) {
    return null;
  }
  return manualAdjustmentMinutes;
}

export function hasManualPrayerAdjustments(adjustments: PrayerAdjustments): boolean {
  return Object.values(adjustments).some((minutes) => minutes !== undefined && minutes !== 0);
}

export function resetManualPrayerAdjustments(): PrayerAdjustments {
  return {};
}
