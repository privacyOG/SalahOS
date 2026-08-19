import type { PrayerSchedule } from './prayerEngine';

const DAY_MINUTES = 1_440;

export type NightEndConvention = 'fajr' | 'sunrise';

export interface SupplementaryTime {
  readonly localMinutes: number | null;
  readonly provenance: string;
}

function normalizeDayMinutes(minutes: number): number {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function requireOffset(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 240) {
    throw new RangeError(`${label} must be between 0 and 240 minutes`);
  }
}

function available(minutes: number | null): number | null {
  return minutes;
}

/**
 * Optional Imsak/Suhur cutoff expressed explicitly as a caller-selected number
 * of minutes before the Fajr time that is actually being presented to the user.
 * This source-neutral boundary lets calculated and local-mosque Fajr times use
 * the same transparent rule without applying a hidden default.
 */
export function calculateImsakFromDisplayedFajr(
  displayedFajrLocalMinutes: number | null,
  minutesBeforeFajr: number,
): SupplementaryTime {
  requireOffset(minutesBeforeFajr, 'Imsak offset');

  return {
    localMinutes:
      displayedFajrLocalMinutes === null
        ? null
        : normalizeDayMinutes(displayedFajrLocalMinutes - minutesBeforeFajr),
    provenance: `Configured ${String(minutesBeforeFajr)} minutes before displayed Fajr`,
  };
}

/**
 * Backward-compatible schedule helper for calculated prayer schedules. New
 * source-aware presentation should call calculateImsakFromDisplayedFajr with
 * the resolved Fajr value that is visible to the user.
 */
export function calculateImsak(
  schedule: PrayerSchedule,
  minutesBeforeFajr: number,
): SupplementaryTime {
  return calculateImsakFromDisplayedFajr(
    available(schedule.prayers.fajr.roundedLocalMinutes),
    minutesBeforeFajr,
  );
}

/**
 * Optional Ishraq/Duha presentation expressed as a caller-selected safety
 * interval after sunrise. This avoids presenting one local convention as a
 * universal astronomical or jurisprudential constant.
 */
export function calculateIshraqAfterSunrise(
  schedule: PrayerSchedule,
  minutesAfterSunrise: number,
): SupplementaryTime {
  requireOffset(minutesAfterSunrise, 'Ishraq offset');
  const sunrise = available(schedule.prayers.sunrise.roundedLocalMinutes);

  return {
    localMinutes: sunrise === null ? null : normalizeDayMinutes(sunrise + minutesAfterSunrise),
    provenance: `Configured ${String(minutesAfterSunrise)} minutes after displayed sunrise`,
  };
}

function nightBounds(
  today: PrayerSchedule,
  tomorrow: PrayerSchedule,
  endConvention: NightEndConvention,
): { readonly start: number; readonly end: number } | null {
  const maghrib = today.prayers.maghrib.roundedLocalMinutes;
  const endPrayer =
    endConvention === 'fajr'
      ? tomorrow.prayers.fajr.roundedLocalMinutes
      : tomorrow.prayers.sunrise.roundedLocalMinutes;

  if (maghrib === null || endPrayer === null) {
    return null;
  }

  const end = endPrayer <= maghrib ? endPrayer + DAY_MINUTES : endPrayer;
  return { start: maghrib, end };
}

/** Calculate the midpoint of the selected Islamic-night interval. */
export function calculateIslamicMidnight(
  today: PrayerSchedule,
  tomorrow: PrayerSchedule,
  endConvention: NightEndConvention = 'fajr',
): SupplementaryTime {
  const bounds = nightBounds(today, tomorrow, endConvention);

  return {
    localMinutes:
      bounds === null ? null : normalizeDayMinutes(bounds.start + (bounds.end - bounds.start) / 2),
    provenance: `Midpoint from displayed Maghrib to next ${endConvention}`,
  };
}

/** Calculate the start of the final third of the selected Islamic-night interval. */
export function calculateLastThirdStart(
  today: PrayerSchedule,
  tomorrow: PrayerSchedule,
  endConvention: NightEndConvention = 'fajr',
): SupplementaryTime {
  const bounds = nightBounds(today, tomorrow, endConvention);

  return {
    localMinutes:
      bounds === null
        ? null
        : normalizeDayMinutes(bounds.start + ((bounds.end - bounds.start) * 2) / 3),
    provenance: `Start of final third from displayed Maghrib to next ${endConvention}`,
  };
}
