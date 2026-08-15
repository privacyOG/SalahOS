import type { MosqueDayTimetable, MosqueTimetable } from './mosqueTimetable';
import { validateMosqueDay, validateMosqueTimetable } from './mosqueTimetable';
import type { ObligatoryPrayerName } from './prayerEngine';

export const MANUAL_MOSQUE_PRAYERS: readonly ObligatoryPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export interface ManualMosquePrayerDraft {
  readonly start: string;
  readonly iqamah: string;
}

export type ManualMosquePrayerDrafts = Readonly<
  Record<ObligatoryPrayerName, ManualMosquePrayerDraft>
>;

export function parseLocalClockTime(value: string): number {
  const trimmed = value.trim();
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);
  if (match === null) {
    throw new RangeError('Prayer time must use 24-hour HH:MM format');
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError('Prayer time must use a valid 24-hour HH:MM value');
  }
  return hour * 60 + minute;
}

export function buildManualMosqueDay(
  date: string,
  drafts: ManualMosquePrayerDrafts,
): MosqueDayTimetable {
  const prayers = Object.fromEntries(
    MANUAL_MOSQUE_PRAYERS.map((prayer) => {
      const draft = drafts[prayer];
      const startLocalMinutes = parseLocalClockTime(draft.start);
      const iqamahText = draft.iqamah.trim();
      return [
        prayer,
        {
          startLocalMinutes,
          ...(iqamahText === ''
            ? {}
            : {
                iqamah: {
                  kind: 'fixed' as const,
                  localMinutes: parseLocalClockTime(iqamahText),
                },
              }),
        },
      ];
    }),
  ) as MosqueDayTimetable['prayers'];

  const day: MosqueDayTimetable = { date: date.trim(), prayers };
  validateMosqueDay(day);
  return day;
}

export function upsertManualMosqueDay(
  existing: MosqueTimetable | null,
  mosqueName: string,
  day: MosqueDayTimetable,
): MosqueTimetable {
  const normalizedName = mosqueName.trim().replace(/\s+/g, ' ');
  if (normalizedName.length === 0 || normalizedName.length > 160) {
    throw new RangeError('Mosque name must contain 1 through 160 characters');
  }
  validateMosqueDay(day);

  if (existing !== null && existing.mosqueName.trim().replace(/\s+/g, ' ') !== normalizedName) {
    throw new RangeError('Existing timetable name must match the manual mosque name');
  }

  const days = existing === null ? [day] : [...existing.days.filter((entry) => entry.date !== day.date), day];
  days.sort((left, right) => left.date.localeCompare(right.date));
  const timetable: MosqueTimetable = { mosqueName: normalizedName, days };
  validateMosqueTimetable(timetable);
  return timetable;
}
