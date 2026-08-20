import type { ObligatoryPrayerName, PrayerSchedule } from './prayerEngine';

export type PrayerSourceMode = 'calculated' | 'local-mosque' | 'calculated-adjustments';

export interface FixedIqamahRule {
  readonly kind: 'fixed';
  readonly localMinutes: number;
}

export interface OffsetIqamahRule {
  readonly kind: 'offset';
  readonly offsetMinutes: number;
}

export type IqamahRule = FixedIqamahRule | OffsetIqamahRule;

export interface MosquePrayerTime {
  readonly startLocalMinutes: number;
  readonly iqamah?: IqamahRule;
}

export interface JumuahSession {
  readonly label: string;
  readonly khutbahLocalMinutes: number;
  readonly salahLocalMinutes: number;
}

export interface TaraweehSession {
  readonly label: string;
  readonly startLocalMinutes: number;
}

export interface MosqueDayTimetable {
  readonly date: string;
  readonly prayers: Readonly<Partial<Record<ObligatoryPrayerName, MosquePrayerTime>>>;
  readonly jumuahSessions?: readonly JumuahSession[];
  readonly taraweehSessions?: readonly TaraweehSession[];
}

export interface MosqueTimetable {
  readonly mosqueName: string;
  readonly days: readonly MosqueDayTimetable[];
}

export interface ResolvedPrayerTime {
  readonly prayer: ObligatoryPrayerName;
  readonly startLocalMinutes: number | null;
  readonly iqamahLocalMinutes: number | null;
  readonly source: PrayerSourceMode;
  readonly available: boolean;
}

const OBLIGATORY_PRAYERS: readonly ObligatoryPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

function assertDayMinutes(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= 1_440) {
    throw new RangeError(`${label} must be an integer from 0 through 1439`);
  }
}

function assertDateKey(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError('Timetable date must use YYYY-MM-DD');
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Timetable date must be a valid Gregorian civil date');
  }
}

function iqamahMinutes(startLocalMinutes: number, rule: IqamahRule | undefined): number | null {
  if (rule === undefined) {
    return null;
  }

  if (rule.kind === 'fixed') {
    assertDayMinutes(rule.localMinutes, 'Fixed iqamah time');
    return rule.localMinutes;
  }

  if (!Number.isInteger(rule.offsetMinutes) || rule.offsetMinutes < 0 || rule.offsetMinutes > 180) {
    throw new RangeError('Iqamah offset must be an integer from 0 through 180 minutes');
  }

  const value = startLocalMinutes + rule.offsetMinutes;
  if (value >= 1_440) {
    throw new RangeError('Iqamah offset may not roll into the next civil day');
  }
  return value;
}

export function validateMosqueDay(day: MosqueDayTimetable): void {
  assertDateKey(day.date);

  for (const prayer of OBLIGATORY_PRAYERS) {
    const entry = day.prayers[prayer];
    if (entry === undefined) continue;
    assertDayMinutes(entry.startLocalMinutes, `${prayer} start`);
    iqamahMinutes(entry.startLocalMinutes, entry.iqamah);
  }

  for (const session of day.jumuahSessions ?? []) {
    if (session.label.trim().length === 0) {
      throw new RangeError('Jumuah session label may not be empty');
    }
    assertDayMinutes(session.khutbahLocalMinutes, 'Jumuah khutbah');
    assertDayMinutes(session.salahLocalMinutes, 'Jumuah salah');
    if (session.salahLocalMinutes < session.khutbahLocalMinutes) {
      throw new RangeError('Jumuah salah may not precede its khutbah');
    }
  }

  for (const session of day.taraweehSessions ?? []) {
    if (session.label.trim().length === 0) {
      throw new RangeError('Taraweeh session label may not be empty');
    }
    assertDayMinutes(session.startLocalMinutes, 'Taraweeh start');
  }
}

export function validateMosqueTimetable(timetable: MosqueTimetable): void {
  if (timetable.mosqueName.trim().length === 0) {
    throw new RangeError('Mosque name may not be empty');
  }

  const seenDates = new Set<string>();
  for (const day of timetable.days) {
    validateMosqueDay(day);
    if (seenDates.has(day.date)) {
      throw new RangeError(`Duplicate timetable date: ${day.date}`);
    }
    seenDates.add(day.date);
  }
}

export function mosqueDayForDate(
  timetable: MosqueTimetable,
  date: string,
): MosqueDayTimetable | null {
  validateMosqueTimetable(timetable);
  assertDateKey(date);
  return timetable.days.find((day) => day.date === date) ?? null;
}

export function resolvePrayerSource(
  mode: PrayerSourceMode,
  calculated: PrayerSchedule,
  mosqueDay: MosqueDayTimetable | null,
): Readonly<Record<ObligatoryPrayerName, ResolvedPrayerTime>> {
  if (mode === 'local-mosque' && mosqueDay !== null) {
    validateMosqueDay(mosqueDay);
    if (mosqueDay.date !== calculated.date) {
      throw new RangeError('Mosque timetable date must match the calculated schedule date');
    }
  }

  return Object.fromEntries(
    OBLIGATORY_PRAYERS.map((prayer) => {
      if (mode === 'local-mosque') {
        const mosqueEntry = mosqueDay?.prayers[prayer];
        if (mosqueEntry === undefined) {
          return [
            prayer,
            {
              prayer,
              startLocalMinutes: null,
              iqamahLocalMinutes: null,
              source: mode,
              available: false,
            },
          ];
        }

        return [
          prayer,
          {
            prayer,
            startLocalMinutes: mosqueEntry.startLocalMinutes,
            iqamahLocalMinutes: iqamahMinutes(mosqueEntry.startLocalMinutes, mosqueEntry.iqamah),
            source: mode,
            available: true,
          },
        ];
      }

      const calculatedEntry = calculated.prayers[prayer];
      return [
        prayer,
        {
          prayer,
          startLocalMinutes: calculatedEntry.roundedLocalMinutes,
          iqamahLocalMinutes: null,
          source: mode,
          available: calculatedEntry.roundedLocalMinutes !== null,
        },
      ];
    }),
  ) as Readonly<Record<ObligatoryPrayerName, ResolvedPrayerTime>>;
}

export function isFriday(date: string): boolean {
  assertDateKey(date);
  return new Date(`${date}T00:00:00.000Z`).getUTCDay() === 5;
}

export function jumuahSessionsForDate(day: MosqueDayTimetable): readonly JumuahSession[] {
  validateMosqueDay(day);
  return isFriday(day.date) ? (day.jumuahSessions ?? []) : [];
}

export function taraweehSessionsForDate(day: MosqueDayTimetable): readonly TaraweehSession[] {
  validateMosqueDay(day);
  return day.taraweehSessions ?? [];
}
