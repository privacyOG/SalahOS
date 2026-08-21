import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import { buildPrayerBoardData, type PrayerBoardData } from '../domain/prayerBoardTemplate';
import type { ObligatoryPrayerName } from '../domain/prayerEngine';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';

export type PrayerBoardPreviewScenario =
  'before-prayer' | 'near-athan' | 'between-athan-iqamah' | 'iqamah-now' | 'jumuah';

const BASE_DATA = buildPrayerBoardData({
  dashboard: applyPrayerSourceToDashboard({
    dashboard: buildPrayerDashboard({
      instant: new Date('2026-08-21T02:30:00.000Z'),
      coordinates: createCoordinates(-33.8688, 151.2093),
      timeZone: 'Australia/Sydney',
    }),
    sourceMode: 'calculated',
    mosqueTimetable: null,
  }),
});

function iqamahOffset(prayer: ObligatoryPrayerName): number {
  return prayer === 'maghrib' ? 10 : 20;
}

function withIqamahRows(
  currentPrayer: ObligatoryPrayerName,
  nextPrayer: ObligatoryPrayerName,
): PrayerBoardData['prayers'] {
  return Object.freeze(
    BASE_DATA.prayers.map((prayer) => {
      const obligatory = prayer.name !== 'sunrise';
      return Object.freeze({
        ...prayer,
        iqamahLocalMinutes:
          obligatory && prayer.startLocalMinutes !== null
            ? prayer.startLocalMinutes + iqamahOffset(prayer.name)
            : null,
        isCurrent: prayer.name === currentPrayer,
        isNext: prayer.name === nextPrayer,
      });
    }),
  );
}

function prayerStart(name: ObligatoryPrayerName): number {
  const row = BASE_DATA.prayers.find((prayer) => prayer.name === name);
  if (row?.startLocalMinutes === null || row?.startLocalMinutes === undefined) {
    throw new Error(`Preview fixture is missing ${name}`);
  }
  return row.startLocalMinutes;
}

function clockAt(localMinutes: number): PrayerBoardData['clock'] {
  const normalized = ((localMinutes % 1_440) + 1_440) % 1_440;
  const hour = Math.floor(normalized / 60);
  const minute = Math.floor(normalized % 60);
  const second = Math.round((normalized - Math.floor(normalized)) * 60);
  return Object.freeze({ hour, minute, second, localMinutes: normalized });
}

export function buildPrayerBoardPreviewData(scenario: PrayerBoardPreviewScenario): PrayerBoardData {
  const dhuhrStart = prayerStart('dhuhr');
  const dhuhrIqamah = dhuhrStart + iqamahOffset('dhuhr');
  const asrStart = prayerStart('asr');
  const asrIqamah = asrStart + iqamahOffset('asr');
  const beforeDhuhr =
    scenario === 'before-prayer' || scenario === 'near-athan' || scenario === 'jumuah';
  const localMinutes =
    scenario === 'before-prayer'
      ? dhuhrStart - 42
      : scenario === 'near-athan'
        ? dhuhrStart - 3
        : scenario === 'between-athan-iqamah'
          ? dhuhrStart + 7
          : scenario === 'iqamah-now'
            ? dhuhrIqamah
            : dhuhrStart - 12;
  const currentPrayer: ObligatoryPrayerName = beforeDhuhr ? 'fajr' : 'dhuhr';
  const nextPrayerName: ObligatoryPrayerName = beforeDhuhr ? 'dhuhr' : 'asr';
  const nextPrayerStart = beforeDhuhr ? dhuhrStart : asrStart;
  const nextPrayerIqamah = beforeDhuhr ? dhuhrIqamah : asrIqamah;

  return Object.freeze({
    ...BASE_DATA,
    clock: clockAt(localMinutes),
    mosqueName: 'SalahOS Community Masjid & Learning Centre',
    prayers: withIqamahRows(currentPrayer, nextPrayerName),
    currentPrayer,
    nextPrayer: Object.freeze({
      name: nextPrayerName,
      dayOffset: 0,
      startLocalMinutes: nextPrayerStart,
      iqamahLocalMinutes: nextPrayerIqamah,
      secondsUntil: Math.max(0, Math.round((nextPrayerStart - localMinutes) * 60)),
    }),
    jumuahSessions:
      scenario === 'jumuah'
        ? Object.freeze([
            Object.freeze({ label: "Jumu'ah 1", khutbahLocalMinutes: 780, salahLocalMinutes: 800 }),
            Object.freeze({ label: "Jumu'ah 2", khutbahLocalMinutes: 840, salahLocalMinutes: 860 }),
          ])
        : Object.freeze([]),
  });
}
