import { describe, expect, it } from 'vitest';
import {
  exportMosqueTimetableCsv,
  exportMosqueTimetableJson,
  parseMosqueTimetableCsv,
  parseMosqueTimetableJson,
} from './timetableImport';

const SAMPLE_CSV = `date,fajr,fajr_iqamah,dhuhr,dhuhr_iqamah,asr,asr_iqamah,maghrib,maghrib_iqamah,isha,isha_iqamah
2026-08-21,05:25,+20,12:05,12:30,15:10,,17:35,+10,19:00,19:20
2026-08-22,05:24,+20,12:05,12:30,15:11,,17:36,+10,19:01,19:20`;

describe('mosque timetable import and export', () => {
  it('parses strict CSV into validated prayer and iqamah entries', () => {
    const timetable = parseMosqueTimetableCsv(SAMPLE_CSV, 'Example Mosque');

    expect(timetable.mosqueName).toBe('Example Mosque');
    expect(timetable.days).toHaveLength(2);
    expect(timetable.days[0]?.prayers.fajr).toEqual({
      startLocalMinutes: 5 * 60 + 25,
      iqamah: { kind: 'offset', offsetMinutes: 20 },
    });
    expect(timetable.days[0]?.prayers.dhuhr?.iqamah).toEqual({
      kind: 'fixed',
      localMinutes: 12 * 60 + 30,
    });
  });

  it('round-trips the supported CSV schema without changing timetable data', () => {
    const timetable = parseMosqueTimetableCsv(SAMPLE_CSV, 'Example Mosque');
    const exported = exportMosqueTimetableCsv(timetable);
    expect(parseMosqueTimetableCsv(exported, 'Example Mosque')).toEqual(timetable);
  });

  it('round-trips validated JSON', () => {
    const timetable = parseMosqueTimetableCsv(SAMPLE_CSV, 'Example Mosque');
    const exported = exportMosqueTimetableJson(timetable);
    expect(parseMosqueTimetableJson(exported)).toEqual(timetable);
  });

  it('rejects unexpected CSV schemas, invalid times and orphan iqamah values', () => {
    expect(() =>
      parseMosqueTimetableCsv('date,fajr\n2026-08-21,05:25', 'Example Mosque'),
    ).toThrow(/CSV header/);

    expect(() =>
      parseMosqueTimetableCsv(
        SAMPLE_CSV.replace('05:25', '25:99'),
        'Example Mosque',
      ),
    ).toThrow(RangeError);

    expect(() =>
      parseMosqueTimetableCsv(
        SAMPLE_CSV.replace('05:25,+20', ',+20'),
        'Example Mosque',
      ),
    ).toThrow(/cannot exist without/);
  });

  it('rejects malformed or structurally invalid JSON before activation', () => {
    expect(() => parseMosqueTimetableJson('{')).toThrow(/invalid/);
    expect(() =>
      parseMosqueTimetableJson(JSON.stringify({ mosqueName: '', days: [] })),
    ).toThrow(RangeError);
  });
});
