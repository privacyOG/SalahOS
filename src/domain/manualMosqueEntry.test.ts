import { describe, expect, it } from 'vitest';
import {
  buildManualMosqueDay,
  parseLocalClockTime,
  upsertManualMosqueDay,
} from './manualMosqueEntry';

const completeDrafts = {
  fajr: { start: '05:10', iqamah: '05:30' },
  dhuhr: { start: '12:15', iqamah: '12:45' },
  asr: { start: '15:40', iqamah: '16:00' },
  maghrib: { start: '18:05', iqamah: '' },
  isha: { start: '19:25', iqamah: '19:45' },
} as const;

describe('manual mosque timetable entry', () => {
  it('parses strict 24-hour clock values', () => {
    expect(parseLocalClockTime('00:00')).toBe(0);
    expect(parseLocalClockTime('23:59')).toBe(1_439);
    expect(parseLocalClockTime(' 05:07 ')).toBe(307);
    expect(() => parseLocalClockTime('5:07')).toThrow(RangeError);
    expect(() => parseLocalClockTime('24:00')).toThrow(RangeError);
    expect(() => parseLocalClockTime('12:60')).toThrow(RangeError);
  });

  it('builds a validated day with all five starts and optional fixed iqamah times', () => {
    const day = buildManualMosqueDay('2026-08-16', completeDrafts);

    expect(day.date).toBe('2026-08-16');
    expect(day.prayers.fajr).toEqual({
      startLocalMinutes: 310,
      iqamah: { kind: 'fixed', localMinutes: 330 },
    });
    expect(day.prayers.maghrib).toEqual({ startLocalMinutes: 1_085 });
  });

  it('rejects missing or invalid manual prayer starts', () => {
    expect(() =>
      buildManualMosqueDay('2026-08-16', {
        ...completeDrafts,
        asr: { start: '', iqamah: '' },
      }),
    ).toThrow(RangeError);
    expect(() => buildManualMosqueDay('2026-02-30', completeDrafts)).toThrow(RangeError);
  });

  it('creates a new timetable and replaces an existing day deterministically', () => {
    const first = buildManualMosqueDay('2026-08-16', completeDrafts);
    const created = upsertManualMosqueDay(null, '  Example   Mosque ', first);
    expect(created.mosqueName).toBe('Example Mosque');
    expect(created.days).toHaveLength(1);

    const replacement = buildManualMosqueDay('2026-08-16', {
      ...completeDrafts,
      fajr: { start: '05:15', iqamah: '05:35' },
    });
    const secondDay = buildManualMosqueDay('2026-08-17', completeDrafts);
    const withSecondDay = upsertManualMosqueDay(created, 'Example Mosque', secondDay);
    const replaced = upsertManualMosqueDay(withSecondDay, 'Example Mosque', replacement);

    expect(replaced.days.map((day) => day.date)).toEqual(['2026-08-16', '2026-08-17']);
    expect(replaced.days[0]?.prayers.fajr?.startLocalMinutes).toBe(315);
  });

  it('does not allow a manual edit to mutate a differently named timetable', () => {
    const day = buildManualMosqueDay('2026-08-16', completeDrafts);
    const existing = upsertManualMosqueDay(null, 'First Mosque', day);
    expect(() => upsertManualMosqueDay(existing, 'Second Mosque', day)).toThrow(RangeError);
  });
});
