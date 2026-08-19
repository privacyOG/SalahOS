import type { PrayerSourceMode } from './mosqueTimetable';
import { calculateImsakFromDisplayedFajr } from './supplementaryTimes';

export interface PresentedPrayerTime {
  readonly localMinutes: number | null;
  readonly source: PrayerSourceMode;
}

export interface RamadanMealTime {
  readonly localMinutes: number | null;
  readonly source: PrayerSourceMode;
  readonly provenance: string;
}

export interface RamadanMealTimes {
  readonly suhurEnd: RamadanMealTime;
  readonly imsak: RamadanMealTime & {
    readonly configuredMinutesBeforeFajr: number | null;
  };
  readonly iftar: RamadanMealTime;
}

function assertDisplayedPrayerTime(value: PresentedPrayerTime, label: string): void {
  if (
    value.localMinutes !== null &&
    (!Number.isFinite(value.localMinutes) || value.localMinutes < 0 || value.localMinutes >= 1_440)
  ) {
    throw new RangeError(`${label} must be null or a local minute between 0 and 1439`);
  }
}

export function deriveRamadanMealTimes(input: {
  readonly fajr: PresentedPrayerTime;
  readonly maghrib: PresentedPrayerTime;
  readonly imsakMinutesBeforeFajr: number | null;
}): RamadanMealTimes {
  assertDisplayedPrayerTime(input.fajr, 'Displayed Fajr');
  assertDisplayedPrayerTime(input.maghrib, 'Displayed Maghrib');

  const imsak =
    input.imsakMinutesBeforeFajr === null
      ? null
      : calculateImsakFromDisplayedFajr(
          input.fajr.localMinutes,
          input.imsakMinutesBeforeFajr,
        );

  return Object.freeze({
    suhurEnd: Object.freeze({
      localMinutes: input.fajr.localMinutes,
      source: input.fajr.source,
      provenance: 'Suhur ends at displayed Fajr',
    }),
    imsak: Object.freeze({
      localMinutes: imsak?.localMinutes ?? null,
      source: input.fajr.source,
      configuredMinutesBeforeFajr: input.imsakMinutesBeforeFajr,
      provenance:
        imsak?.provenance ?? 'No optional Imsak offset configured; displayed Fajr remains Suhur end',
    }),
    iftar: Object.freeze({
      localMinutes: input.maghrib.localMinutes,
      source: input.maghrib.source,
      provenance: 'Iftar follows displayed Maghrib',
    }),
  });
}
