import type { MosqueDirectoryPrayerSummary } from './mosqueDirectoryEnrichment';
import type { ObligatoryPrayerName, PrayerName } from './prayerEngine';
import type { SourcedPrayerDashboard } from './sourcedDashboard';

const OBLIGATORY_PRAYERS: readonly ObligatoryPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const AUSTRALIAN_MOSQUE_CONGREGATION_ACCEPTANCE_WINDOW_MINUTES = Object.freeze({
  fajr: 120,
  dhuhr: 90,
  asr: 90,
  maghrib: 90,
  isha: 90,
}) satisfies Readonly<Record<ObligatoryPrayerName, number>>;

const MINUTES_PER_DAY = 1_440;
const TWELVE_HOUR_CLOCK = /^(\d{1,2}):(\d{2})\s*(am|pm)$/u;
const TWENTY_FOUR_HOUR_CLOCK = /^(\d{1,2}):(\d{2})$/u;

export interface PublishedMosqueCongregationContext {
  readonly mosqueName: string;
  readonly prayerTimes: MosqueDirectoryPrayerSummary | null;
}

function parseClock(value: string): number | null {
  const normalized = value.trim().toLocaleLowerCase('en-AU');
  const twelveHour = TWELVE_HOUR_CLOCK.exec(normalized);
  if (twelveHour !== null) {
    const [, hourText, minuteText, period] = twelveHour;
    if (hourText === undefined || minuteText === undefined || period === undefined) return null;
    const hour = Number.parseInt(hourText, 10);
    const minute = Number.parseInt(minuteText, 10);
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    const hour24 = (hour % 12) + (period === 'pm' ? 12 : 0);
    return hour24 * 60 + minute;
  }

  const twentyFourHour = TWENTY_FOUR_HOUR_CLOCK.exec(normalized);
  if (twentyFourHour === null) return null;
  const [, hourText, minuteText] = twentyFourHour;
  if (hourText === undefined || minuteText === undefined) return null;
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function publishedAustralianMosqueCongregationMinutes(
  prayerTimes: MosqueDirectoryPrayerSummary | null,
  prayer: PrayerName,
): readonly number[] {
  if (prayer === 'sunrise') return Object.freeze([]);
  const raw = prayerTimes?.[prayer];
  if (raw === undefined) return Object.freeze([]);

  const values = raw
    .split(/\s*\/\s*/u)
    .map(parseClock)
    .filter((value): value is number => value !== null);
  return Object.freeze([...new Set(values)]);
}

function minutesAfterPrayerStart(
  prayer: ObligatoryPrayerName,
  publishedLocalMinutes: number,
  startLocalMinutes: number,
): number {
  const sameDayDelta = publishedLocalMinutes - startLocalMinutes;
  if (prayer === 'isha' && sameDayDelta < 0) {
    return sameDayDelta + MINUTES_PER_DAY;
  }
  return sameDayDelta;
}

/**
 * Returns only mosque-published congregation times that plausibly follow the
 * calculated/resolved prayer start. Values outside the acceptance window are
 * discarded rather than adjusted so sparse or misclassified directory data
 * cannot become an asserted Iqamah time.
 */
export function guardedPublishedAustralianMosqueCongregationMinutes(
  prayerTimes: MosqueDirectoryPrayerSummary | null,
  prayer: PrayerName,
  startLocalMinutes: number | null,
): readonly number[] {
  if (prayer === 'sunrise' || startLocalMinutes === null) return Object.freeze([]);

  const maximumDelay = AUSTRALIAN_MOSQUE_CONGREGATION_ACCEPTANCE_WINDOW_MINUTES[prayer];
  return Object.freeze(
    publishedAustralianMosqueCongregationMinutes(prayerTimes, prayer).filter((value) => {
      const delay = minutesAfterPrayerStart(prayer, value, startLocalMinutes);
      return delay >= 0 && delay <= maximumDelay;
    }),
  );
}

export function hasPublishedAustralianMosqueCongregationTimes(
  prayerTimes: MosqueDirectoryPrayerSummary | null,
): boolean {
  return OBLIGATORY_PRAYERS.some(
    (prayer) => publishedAustralianMosqueCongregationMinutes(prayerTimes, prayer).length > 0,
  );
}

/**
 * Adds plausible mosque-published congregation times to a calculated dashboard
 * without pretending that sparse directory metadata is a complete mosque
 * timetable. The first accepted session is the primary Iqamah used by
 * compact/hero surfaces; raw callers can still inspect every parsed published
 * value through publishedAustralianMosqueCongregationMinutes().
 */
export function applyAustralianMosqueCongregationTimes(
  dashboard: SourcedPrayerDashboard,
  context: PublishedMosqueCongregationContext,
): SourcedPrayerDashboard {
  if (dashboard.sourceMode === 'local-mosque') return dashboard;

  const prayers = dashboard.prayers.map((row) => {
    const published = guardedPublishedAustralianMosqueCongregationMinutes(
      context.prayerTimes,
      row.name,
      row.localMinutes,
    );
    const primary = published[0];
    return primary === undefined
      ? row
      : Object.freeze({
          ...row,
          iqamahLocalMinutes: primary,
        });
  });

  return Object.freeze({
    ...dashboard,
    mosqueName: context.mosqueName,
    prayers: Object.freeze(prayers),
  });
}
