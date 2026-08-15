import {
  jumuahSessionsForDate,
  mosqueDayForDate,
  resolvePrayerSource,
} from './mosqueTimetable';
import type {
  JumuahSession,
  MosqueTimetable,
  PrayerSourceMode,
  ResolvedPrayerTime,
} from './mosqueTimetable';
import type { PrayerDashboardModel } from './dashboard';
import type { ObligatoryPrayerName, PrayerName } from './prayerEngine';

const OBLIGATORY_PRAYERS: readonly ObligatoryPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export interface SourcedDashboardPrayerRow {
  readonly name: PrayerName;
  readonly localMinutes: number | null;
  readonly iqamahLocalMinutes: number | null;
  readonly isNext: boolean;
  readonly highLatitudeRuleApplied: boolean;
  readonly manualAdjustmentMinutes: number;
  readonly source: PrayerSourceMode;
  readonly available: boolean;
}

export interface SourcedPrayerDashboard {
  readonly base: PrayerDashboardModel;
  readonly sourceMode: PrayerSourceMode;
  readonly mosqueName: string | null;
  readonly prayers: readonly SourcedDashboardPrayerRow[];
  readonly nextPrayer: ObligatoryPrayerName | null;
  readonly nextPrayerDayOffset: 0 | 1 | null;
  readonly nextPrayerLocalMinutes: number | null;
  readonly secondsUntilNextPrayer: number | null;
  readonly jumuahSessions: readonly JumuahSession[];
}

interface NextCandidate {
  readonly prayer: ObligatoryPrayerName;
  readonly dayOffset: 0 | 1;
  readonly localMinutes: number;
  readonly minutesUntil: number;
}

function findNextResolvedPrayer(
  currentLocalMinutes: number,
  today: Readonly<Record<ObligatoryPrayerName, ResolvedPrayerTime>>,
  tomorrow: Readonly<Record<ObligatoryPrayerName, ResolvedPrayerTime>>,
): NextCandidate | null {
  const candidates: NextCandidate[] = [];

  for (const prayer of OBLIGATORY_PRAYERS) {
    const todayMinutes = today[prayer].startLocalMinutes;
    if (todayMinutes !== null && todayMinutes >= currentLocalMinutes) {
      candidates.push({
        prayer,
        dayOffset: 0,
        localMinutes: todayMinutes,
        minutesUntil: todayMinutes - currentLocalMinutes,
      });
    }

    const tomorrowMinutes = tomorrow[prayer].startLocalMinutes;
    if (tomorrowMinutes !== null) {
      candidates.push({
        prayer,
        dayOffset: 1,
        localMinutes: tomorrowMinutes,
        minutesUntil: 1_440 - currentLocalMinutes + tomorrowMinutes,
      });
    }
  }

  return candidates.sort((left, right) => left.minutesUntil - right.minutesUntil)[0] ?? null;
}

export function applyPrayerSourceToDashboard(input: {
  readonly dashboard: PrayerDashboardModel;
  readonly sourceMode: PrayerSourceMode;
  readonly mosqueTimetable: MosqueTimetable | null;
}): SourcedPrayerDashboard {
  const todayMosqueDay =
    input.mosqueTimetable === null
      ? null
      : mosqueDayForDate(input.mosqueTimetable, input.dashboard.today.date);
  const tomorrowMosqueDay =
    input.mosqueTimetable === null
      ? null
      : mosqueDayForDate(input.mosqueTimetable, input.dashboard.tomorrow.date);
  const resolvedToday = resolvePrayerSource(
    input.sourceMode,
    input.dashboard.today,
    todayMosqueDay,
  );
  const resolvedTomorrow = resolvePrayerSource(
    input.sourceMode,
    input.dashboard.tomorrow,
    tomorrowMosqueDay,
  );
  const next = findNextResolvedPrayer(
    input.dashboard.clock.localMinutes,
    resolvedToday,
    resolvedTomorrow,
  );

  const prayers = input.dashboard.prayers.map((row): SourcedDashboardPrayerRow => {
    if (row.name === 'sunrise') {
      return {
        ...row,
        iqamahLocalMinutes: null,
        source: input.sourceMode,
        available: row.localMinutes !== null,
        isNext: false,
      };
    }

    const resolved = resolvedToday[row.name];
    return {
      ...row,
      localMinutes: resolved.startLocalMinutes,
      iqamahLocalMinutes: resolved.iqamahLocalMinutes,
      source: resolved.source,
      available: resolved.available,
      isNext: next?.dayOffset === 0 && next.prayer === row.name,
    };
  });

  return {
    base: input.dashboard,
    sourceMode: input.sourceMode,
    mosqueName: input.sourceMode === 'local-mosque' ? (input.mosqueTimetable?.mosqueName ?? null) : null,
    prayers,
    nextPrayer: next?.prayer ?? null,
    nextPrayerDayOffset: next?.dayOffset ?? null,
    nextPrayerLocalMinutes: next?.localMinutes ?? null,
    secondsUntilNextPrayer: next === null ? null : Math.max(0, Math.round(next.minutesUntil * 60)),
    jumuahSessions:
      input.sourceMode === 'local-mosque' && todayMosqueDay !== null
        ? jumuahSessionsForDate(todayMosqueDay)
        : [],
  };
}
