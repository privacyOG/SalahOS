import { describe, expect, it } from 'vitest';

import {
  createMonthlyTimetable,
  monthlyTimetableToCsv,
  monthlyTimetableToJson,
} from './monthlyTimetable';

const prayers = {
  fajr: { start: '05:21', iqamah: '05:45' },
  dhuhr: { start: '12:04', iqamah: '12:30' },
  asr: { start: '15:11', iqamah: '15:30' },
  maghrib: { start: '17:42', iqamah: '17:47' },
  isha: { start: '19:03', iqamah: '19:20' },
};

describe('monthly timetable', () => {
  it('normalizes, sorts and freezes authoritative daily rows', () => {
    const timetable = createMonthlyTimetable({
      mosqueId: 'Example-Masjid',
      mosqueName: 'Example Masjid',
      month: '2026-08',
      sourceLabel: 'Mosque-published timetable revision 4',
      revision: 4,
      days: [
        {
          date: '2026-08-02',
          hijriLabel: '19 Safar 1448',
          prayers,
          jumuah: [],
        },
        {
          date: '2026-08-01',
          hijriLabel: '18 Safar 1448',
          prayers,
          jumuah: [{ label: 'First Jumuah', khutbah: '12:20', start: '12:30' }],
        },
      ],
    });

    expect(timetable.mosqueId).toBe('example-masjid');
    expect(timetable.days.map((day) => day.date)).toEqual(['2026-08-01', '2026-08-02']);
    expect(timetable.days[0]?.jumuah[0]?.start).toBe('12:30');
    expect(Object.isFrozen(timetable)).toBe(true);
    expect(Object.isFrozen(timetable.days)).toBe(true);
  });

  it('rejects dates outside the selected Gregorian month', () => {
    expect(() =>
      createMonthlyTimetable({
        mosqueId: 'example-masjid',
        mosqueName: 'Example Masjid',
        month: '2026-08',
        sourceLabel: 'Published timetable',
        revision: 1,
        days: [
          {
            date: '2026-09-01',
            hijriLabel: null,
            prayers,
            jumuah: [],
          },
        ],
      }),
    ).toThrow(/outside 2026-08/u);
  });

  it('exports CSV and JSON with Salah, Iqamah, Jumuah and Hijri context', () => {
    const timetable = createMonthlyTimetable({
      mosqueId: 'example-masjid',
      mosqueName: 'Example Masjid',
      month: '2026-08',
      sourceLabel: 'Published timetable',
      revision: 2,
      days: [
        {
          date: '2026-08-07',
          hijriLabel: '24 Safar 1448',
          prayers,
          jumuah: [{ label: 'First Jumuah', khutbah: '12:20', start: '12:30' }],
        },
      ],
    });

    const csv = monthlyTimetableToCsv(timetable);
    expect(csv).toContain('Fajr Start,Fajr Iqamah');
    expect(csv).toContain('2026-08-07,24 Safar 1448');
    expect(csv).toContain('First Jumuah: 12:30');

    const parsed = JSON.parse(monthlyTimetableToJson(timetable)) as {
      month: string;
      revision: number;
    };
    expect(parsed).toEqual(expect.objectContaining({ month: '2026-08', revision: 2 }));
  });
});
