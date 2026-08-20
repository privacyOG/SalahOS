import { describe, expect, it } from 'vitest';

import {
  createWearableCompanionSnapshot,
  serializeWearableCompanionSnapshot,
  type WearableCompanionSnapshotDraft,
} from './wearableCompanion';

function draft(
  overrides: Partial<WearableCompanionSnapshotDraft> = {},
): WearableCompanionSnapshotDraft {
  return {
    generatedAt: '2026-08-20T07:30:00.000Z',
    staleAfter: '2026-08-21T07:30:00.000Z',
    civilDate: '2026-08-20',
    timezone: 'Australia/Sydney',
    locale: 'en',
    source: { kind: 'calculated', label: 'Local calculation' },
    prayers: [
      { id: 'fajr', startsAt: '2026-08-19T19:30:00.000Z', iqamahAt: null },
      { id: 'dhuhr', startsAt: '2026-08-20T02:00:00.000Z', iqamahAt: null },
      { id: 'asr', startsAt: '2026-08-20T05:15:00.000Z', iqamahAt: null },
      { id: 'maghrib', startsAt: '2026-08-20T07:30:00.000Z', iqamahAt: null },
      { id: 'isha', startsAt: '2026-08-20T08:45:00.000Z', iqamahAt: null },
    ],
    nextPrayer: {
      id: 'maghrib',
      startsAt: '2026-08-20T07:30:00.000Z',
      iqamahAt: '2026-08-20T07:40:00.000Z',
    },
    ...overrides,
  };
}

describe('wearable companion snapshot', () => {
  it('creates a deterministic, frozen five-prayer wrist payload', () => {
    const snapshot = createWearableCompanionSnapshot(draft());

    expect(snapshot.version).toBe(1);
    expect(snapshot.prayers.map((prayer) => prayer.id)).toEqual([
      'fajr',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ]);
    expect(snapshot.nextPrayer?.id).toBe('maghrib');
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.prayers)).toBe(true);
    expect(Object.isFrozen(snapshot.source)).toBe(true);
  });

  it('supports tomorrow Fajr as the next prayer without changing today prayer rows', () => {
    const snapshot = createWearableCompanionSnapshot(
      draft({
        nextPrayer: {
          id: 'fajr',
          startsAt: '2026-08-20T19:28:00.000Z',
          iqamahAt: '2026-08-20T19:48:00.000Z',
        },
      }),
    );

    expect(snapshot.prayers[0]?.startsAt).toBe('2026-08-19T19:30:00.000Z');
    expect(snapshot.nextPrayer?.startsAt).toBe('2026-08-20T19:28:00.000Z');
  });

  it('rejects missing or reordered obligatory prayer rows', () => {
    expect(() =>
      createWearableCompanionSnapshot(
        draft({ prayers: draft().prayers.slice(0, 4) }),
      ),
    ).toThrow(/exactly five/u);

    const reordered = draft().prayers.slice();
    const first = reordered[0];
    const second = reordered[1];
    if (first === undefined || second === undefined) {
      throw new Error('Test fixture requires Fajr and Dhuhr rows');
    }
    reordered[0] = second;
    reordered[1] = first;

    expect(() =>
      createWearableCompanionSnapshot(draft({ prayers: reordered })),
    ).toThrow(/canonical prayer order/u);
  });

  it('rejects invalid timezone, date and freshness metadata', () => {
    expect(() =>
      createWearableCompanionSnapshot(draft({ timezone: 'Not/A_Timezone' })),
    ).toThrow(/IANA timezone/u);
    expect(() =>
      createWearableCompanionSnapshot(draft({ civilDate: '2026-02-30' })),
    ).toThrow(/valid Gregorian date/u);
    expect(() =>
      createWearableCompanionSnapshot(
        draft({ staleAfter: '2026-08-20T07:30:00.000Z' }),
      ),
    ).toThrow(/later than generatedAt/u);
  });

  it('requires exact UTC timestamps and prevents Iqamah before prayer start', () => {
    expect(() =>
      createWearableCompanionSnapshot(
        draft({ generatedAt: '2026-08-20T17:30:00+10:00' }),
      ),
    ).toThrow(/exact ISO-8601 UTC/u);

    expect(() =>
      createWearableCompanionSnapshot(
        draft({
          nextPrayer: {
            id: 'maghrib',
            startsAt: '2026-08-20T07:30:00.000Z',
            iqamahAt: '2026-08-20T07:20:00.000Z',
          },
        }),
      ),
    ).toThrow(/must not precede prayer start/u);
  });

  it('serializes only the bounded display contract without precise location or credentials', () => {
    const serialized = serializeWearableCompanionSnapshot(
      createWearableCompanionSnapshot(draft()),
    );

    expect(JSON.parse(serialized)).toMatchObject({
      version: 1,
      civilDate: '2026-08-20',
      timezone: 'Australia/Sydney',
      source: { kind: 'calculated', label: 'Local calculation' },
    });
    expect(serialized).not.toContain('latitude');
    expect(serialized).not.toContain('longitude');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('password');
  });
});
