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

export function hasPublishedAustralianMosqueCongregationTimes(
  prayerTimes: MosqueDirectoryPrayerSummary | null,
): boolean {
  return OBLIGATORY_PRAYERS.some(
    (prayer) => publishedAustralianMosqueCongregationMinutes(prayerTimes, prayer).length > 0,
  );
}

/**
 * Adds mosque-published congregation times to a calculated dashboard without
 * pretending that sparse directory metadata is a complete mosque timetable.
 * The first published session is the primary Iqamah used by compact/hero
 * surfaces; callers that can render multiple sessions should read the complete
 * array through publishedAustralianMosqueCongregationMinutes().
 */
export function applyAustralianMosqueCongregationTimes(
  dashboard: SourcedPrayerDashboard,
  context: PublishedMosqueCongregationContext,
): SourcedPrayerDashboard {
  if (dashboard.sourceMode === 'local-mosque') return dashboard;

  const prayers = dashboard.prayers.map((row) => {
    const published = publishedAustralianMosqueCongregationMinutes(context.prayerTimes, row.name);
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
