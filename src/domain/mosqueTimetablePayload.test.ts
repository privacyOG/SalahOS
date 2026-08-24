import { describe, expect, it } from 'vitest';
import { parseMosqueTimetablePayload } from './mosqueTimetablePayload';

describe('mosque timetable persisted payload parser', () => {
  it('parses the persisted timetable shape without importing the CSV/JSON import module', () => {
    expect(
      parseMosqueTimetablePayload({
        mosqueName: 'Example Masjid',
        days: [
          {
            date: '2026-08-25',
            prayers: {
              fajr: { startLocalMinutes: 310, iqamah: { kind: 'fixed', localMinutes: 330 } },
              isha: { startLocalMinutes: 1180, iqamah: { kind: 'offset', offsetMinutes: 20 } },
            },
          },
        ],
      }),
    ).toEqual({
      mosqueName: 'Example Masjid',
      days: [
        {
          date: '2026-08-25',
          prayers: {
            fajr: { startLocalMinutes: 310, iqamah: { kind: 'fixed', localMinutes: 330 } },
            isha: { startLocalMinutes: 1180, iqamah: { kind: 'offset', offsetMinutes: 20 } },
          },
        },
      ],
    });
  });

  it('rejects unknown prayer keys and invalid nested payloads', () => {
    expect(() =>
      parseMosqueTimetablePayload({
        mosqueName: 'Example Masjid',
        days: [{ date: '2026-08-25', prayers: { sunrise: { startLocalMinutes: 400 } } }],
      }),
    ).toThrow(/unknown prayer/u);

    expect(() =>
      parseMosqueTimetablePayload({
        mosqueName: 'Example Masjid',
        days: [{ date: '2026-08-25', prayers: { fajr: { startLocalMinutes: '05:10' } } }],
      }),
    ).toThrow(/finite number/u);
  });
});
