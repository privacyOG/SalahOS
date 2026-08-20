import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import {
  isFriday,
  jumuahSessionsForDate,
  resolvePrayerSource,
  taraweehSessionsForDate,
  validateMosqueDay,
  validateMosqueTimetable,
} from './mosqueTimetable';
import type { MosqueDayTimetable, MosqueTimetable } from './mosqueTimetable';
import { calculatePrayerSchedule } from './prayerEngine';

function calculatedSchedule() {
  return calculatePrayerSchedule({
    date: new Date('2026-08-21T00:00:00.000Z'),
    latitude: -33.8688,
    longitude: 151.2093,
    utcOffsetMinutes: 600,
    method: getCalculationMethod('muslim-world-league'),
  });
}

const friday: MosqueDayTimetable = {
  date: '2026-08-21',
  prayers: {
    fajr: {
      startLocalMinutes: 5 * 60 + 25,
      iqamah: { kind: 'offset', offsetMinutes: 20 },
    },
    dhuhr: {
      startLocalMinutes: 12 * 60 + 5,
      iqamah: { kind: 'fixed', localMinutes: 12 * 60 + 30 },
    },
    asr: { startLocalMinutes: 15 * 60 + 10 },
    maghrib: {
      startLocalMinutes: 17 * 60 + 35,
      iqamah: { kind: 'offset', offsetMinutes: 10 },
    },
    isha: {
      startLocalMinutes: 19 * 60,
      iqamah: { kind: 'fixed', localMinutes: 19 * 60 + 20 },
    },
  },
  jumuahSessions: [
    {
      label: 'First',
      khutbahLocalMinutes: 12 * 60 + 15,
      salahLocalMinutes: 12 * 60 + 35,
    },
    {
      label: 'Second',
      khutbahLocalMinutes: 13 * 60 + 15,
      salahLocalMinutes: 13 * 60 + 35,
    },
  ],
  taraweehSessions: [
    { label: 'Main hall', startLocalMinutes: 20 * 60 + 15 },
    { label: 'Late session', startLocalMinutes: 22 * 60 },
  ],
};

describe('mosque timetable domain', () => {
  it('keeps local mosque start and iqamah separate', () => {
    const resolved = resolvePrayerSource('local-mosque', calculatedSchedule(), friday);

    expect(resolved.fajr.startLocalMinutes).toBe(5 * 60 + 25);
    expect(resolved.fajr.iqamahLocalMinutes).toBe(5 * 60 + 45);
    expect(resolved.dhuhr.startLocalMinutes).toBe(12 * 60 + 5);
    expect(resolved.dhuhr.iqamahLocalMinutes).toBe(12 * 60 + 30);
    expect(resolved.asr.iqamahLocalMinutes).toBeNull();
    expect(resolved.fajr.source).toBe('local-mosque');
  });

  it('does not silently fall back to calculated time when a mosque entry is missing', () => {
    const incomplete: MosqueDayTimetable = {
      date: friday.date,
      prayers: {
        fajr: {
          startLocalMinutes: 5 * 60 + 25,
          iqamah: { kind: 'offset', offsetMinutes: 20 },
        },
      },
    };
    const resolved = resolvePrayerSource('local-mosque', calculatedSchedule(), incomplete);

    expect(resolved.fajr.available).toBe(true);
    expect(resolved.dhuhr.available).toBe(false);
    expect(resolved.dhuhr.startLocalMinutes).toBeNull();
    expect(resolved.dhuhr.source).toBe('local-mosque');
  });

  it('exposes calculated and calculated-adjustments as explicit source modes', () => {
    const calculated = calculatedSchedule();
    const plain = resolvePrayerSource('calculated', calculated, null);
    const adjusted = resolvePrayerSource('calculated-adjustments', calculated, null);

    expect(plain.fajr.startLocalMinutes).toBe(calculated.prayers.fajr.roundedLocalMinutes);
    expect(plain.fajr.source).toBe('calculated');
    expect(adjusted.fajr.source).toBe('calculated-adjustments');
  });

  it('returns configured Jumuah sessions only for Friday', () => {
    expect(isFriday('2026-08-21')).toBe(true);
    expect(jumuahSessionsForDate(friday)).toHaveLength(2);

    const saturday: MosqueDayTimetable = {
      ...friday,
      date: '2026-08-22',
    };
    expect(isFriday(saturday.date)).toBe(false);
    expect(jumuahSessionsForDate(saturday)).toEqual([]);
  });

  it('returns configured Taraweeh sessions without imposing a rakah convention', () => {
    expect(taraweehSessionsForDate(friday)).toEqual([
      { label: 'Main hall', startLocalMinutes: 20 * 60 + 15 },
      { label: 'Late session', startLocalMinutes: 22 * 60 },
    ]);
  });

  it('rejects invalid iqamah rollover and invalid Jumuah ordering', () => {
    expect(() => {
      validateMosqueDay({
        date: '2026-08-21',
        prayers: {
          isha: {
            startLocalMinutes: 23 * 60 + 50,
            iqamah: { kind: 'offset', offsetMinutes: 20 },
          },
        },
      });
    }).toThrow(RangeError);

    expect(() => {
      validateMosqueDay({
        date: '2026-08-21',
        prayers: {},
        jumuahSessions: [
          {
            label: 'First',
            khutbahLocalMinutes: 13 * 60,
            salahLocalMinutes: 12 * 60 + 55,
          },
        ],
      });
    }).toThrow(RangeError);
  });

  it('rejects empty or invalid Taraweeh sessions', () => {
    expect(() =>
      validateMosqueDay({
        date: '2026-08-21',
        prayers: {},
        taraweehSessions: [{ label: ' ', startLocalMinutes: 20 * 60 }],
      }),
    ).toThrow(/Taraweeh session label/u);

    expect(() =>
      validateMosqueDay({
        date: '2026-08-21',
        prayers: {},
        taraweehSessions: [{ label: 'Main', startLocalMinutes: 1_440 }],
      }),
    ).toThrow(/Taraweeh start/u);
  });

  it('rejects duplicate civil dates in one timetable', () => {
    const timetable: MosqueTimetable = {
      mosqueName: 'Example Mosque',
      days: [friday, { ...friday }],
    };
    expect(() => {
      validateMosqueTimetable(timetable);
    }).toThrow(/Duplicate timetable date/);
  });
});
