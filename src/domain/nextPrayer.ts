import type { ObligatoryPrayerName, PrayerSchedule } from './prayerEngine';

const OBLIGATORY_PRAYERS: readonly ObligatoryPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export interface NextPrayerResult {
  readonly prayer: ObligatoryPrayerName;
  readonly localMinutes: number;
  readonly dayOffset: 0 | 1;
  readonly minutesUntil: number;
}

/**
 * Select the next obligatory prayer from today's and tomorrow's calculated
 * schedules. Sunrise is intentionally excluded from the obligatory sequence.
 */
export function findNextPrayer(
  currentLocalMinutes: number,
  today: PrayerSchedule,
  tomorrow: PrayerSchedule,
): NextPrayerResult | null {
  if (!Number.isFinite(currentLocalMinutes) || currentLocalMinutes < 0 || currentLocalMinutes >= 1_440) {
    throw new RangeError('Current local minutes must be between 0 and 1439.999...');
  }

  for (const prayer of OBLIGATORY_PRAYERS) {
    const prayerMinutes = today.prayers[prayer].roundedLocalMinutes;
    if (prayerMinutes !== null && prayerMinutes >= currentLocalMinutes) {
      return {
        prayer,
        localMinutes: prayerMinutes,
        dayOffset: 0,
        minutesUntil: prayerMinutes - currentLocalMinutes,
      };
    }
  }

  const tomorrowFajr = tomorrow.prayers.fajr.roundedLocalMinutes;
  if (tomorrowFajr === null) {
    return null;
  }

  return {
    prayer: 'fajr',
    localMinutes: tomorrowFajr,
    dayOffset: 1,
    minutesUntil: 1_440 - currentLocalMinutes + tomorrowFajr,
  };
}
