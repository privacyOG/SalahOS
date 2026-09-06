import type { PrayerSchedule } from './prayerEngine';
import {
  calculateIshraqAfterSunrise,
  calculateIslamicMidnight,
  calculateLastThirdStart,
  type NightEndConvention,
  type SupplementaryTime,
} from './supplementaryTimes';

export interface NightPrayerPresentationInput {
  readonly previous: PrayerSchedule;
  readonly today: PrayerSchedule;
  readonly tomorrow: PrayerSchedule;
  readonly localMinutes: number;
  readonly nightEndConvention?: NightEndConvention;
  readonly ishraqMinutesAfterSunrise?: number | null;
}

export interface NightPrayerPresentation {
  readonly phase: 'active' | 'upcoming';
  readonly prominent: boolean;
  readonly nightEndConvention: NightEndConvention;
  readonly islamicMidnight: SupplementaryTime;
  readonly lastThirdStart: SupplementaryTime;
  readonly ishraq: SupplementaryTime | null;
  readonly ishraqMinutesAfterSunrise: number | null;
}

function assertLocalMinutes(localMinutes: number): void {
  if (!Number.isFinite(localMinutes) || localMinutes < 0 || localMinutes >= 1_440) {
    throw new RangeError('Local minutes must be between 0 (inclusive) and 1440 (exclusive)');
  }
}

export function buildNightPrayerPresentation(
  input: NightPrayerPresentationInput,
): NightPrayerPresentation {
  assertLocalMinutes(input.localMinutes);
  const nightEndConvention = input.nightEndConvention ?? 'fajr';
  const fajr = input.today.prayers.fajr.roundedLocalMinutes;
  const isha = input.today.prayers.isha.roundedLocalMinutes;
  const beforeFajr = fajr !== null && input.localMinutes < fajr;
  const afterIsha = isha !== null && input.localMinutes >= isha;

  const nightStartSchedule = beforeFajr ? input.previous : input.today;
  const nightEndSchedule = beforeFajr ? input.today : input.tomorrow;
  const morningSchedule = beforeFajr ? input.today : input.tomorrow;
  const ishraqMinutesAfterSunrise = input.ishraqMinutesAfterSunrise ?? null;

  return {
    phase: beforeFajr || afterIsha ? 'active' : 'upcoming',
    prominent: beforeFajr || afterIsha,
    nightEndConvention,
    islamicMidnight: calculateIslamicMidnight(
      nightStartSchedule,
      nightEndSchedule,
      nightEndConvention,
    ),
    lastThirdStart: calculateLastThirdStart(
      nightStartSchedule,
      nightEndSchedule,
      nightEndConvention,
    ),
    ishraq:
      ishraqMinutesAfterSunrise === null
        ? null
        : calculateIshraqAfterSunrise(morningSchedule, ishraqMinutesAfterSunrise),
    ishraqMinutesAfterSunrise,
  };
}
