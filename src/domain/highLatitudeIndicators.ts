import type { PrayerSourceMode } from './mosqueTimetable';
import type { PrayerName } from './prayerEngine';

export function displayedHighLatitudeRuleApplied(
  prayer: PrayerName,
  highLatitudeRuleApplied: boolean,
  sourceMode: PrayerSourceMode,
): boolean {
  if (!highLatitudeRuleApplied) {
    return false;
  }

  const mosqueReplacesDisplayedTime = sourceMode === 'local-mosque' && prayer !== 'sunrise';
  return !mosqueReplacesDisplayedTime;
}
