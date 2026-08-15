import { describe, expect, it } from 'vitest';
import { resolveZonedCivilTime } from './zonedCivilTime';

describe('IANA civil-time resolution', () => {
  it('resolves an ordinary Sydney wall-clock time to one exact instant', () => {
    const resolution = resolveZonedCivilTime(
      { date: '2026-08-16', localMinutes: 5 * 60 + 30 },
      'Australia/Sydney',
    );

    expect(resolution.status).toBe('exact');
    if (resolution.status !== 'exact') return;
    expect(resolution.candidate.instant.toISOString()).toBe('2026-08-15T19:30:00.000Z');
    expect(resolution.candidate.offsetMinutes).toBe(600);
  });

  it('returns both candidates for the repeated London hour at DST end', () => {
    const resolution = resolveZonedCivilTime(
      { date: '2026-10-25', localMinutes: 90 },
      'Europe/London',
    );

    expect(resolution.status).toBe('ambiguous');
    if (resolution.status !== 'ambiguous') return;
    expect(resolution.earlier.instant.toISOString()).toBe('2026-10-25T00:30:00.000Z');
    expect(resolution.earlier.offsetMinutes).toBe(60);
    expect(resolution.later.instant.toISOString()).toBe('2026-10-25T01:30:00.000Z');
    expect(resolution.later.offsetMinutes).toBe(0);
  });

  it('does not fabricate an instant for the skipped London hour at DST start', () => {
    expect(
      resolveZonedCivilTime({ date: '2026-03-29', localMinutes: 90 }, 'Europe/London'),
    ).toEqual({ status: 'nonexistent' });
  });

  it('handles southern-hemisphere repeated and skipped hours', () => {
    const repeated = resolveZonedCivilTime(
      { date: '2026-04-05', localMinutes: 150 },
      'Australia/Sydney',
    );
    expect(repeated.status).toBe('ambiguous');
    if (repeated.status === 'ambiguous') {
      expect(repeated.earlier.instant.toISOString()).toBe('2026-04-04T15:30:00.000Z');
      expect(repeated.later.instant.toISOString()).toBe('2026-04-04T16:30:00.000Z');
    }

    expect(
      resolveZonedCivilTime({ date: '2026-10-04', localMinutes: 150 }, 'Australia/Sydney'),
    ).toEqual({ status: 'nonexistent' });
  });

  it('rejects invalid civil input and timezone identifiers', () => {
    expect(() =>
      resolveZonedCivilTime({ date: '2026-02-30', localMinutes: 300 }, 'Australia/Sydney'),
    ).toThrow(RangeError);
    expect(() =>
      resolveZonedCivilTime({ date: '2026-08-16', localMinutes: 1_440 }, 'Australia/Sydney'),
    ).toThrow(RangeError);
    expect(() =>
      resolveZonedCivilTime({ date: '2026-08-16', localMinutes: 300 }, 'Not/A_Zone'),
    ).toThrow(RangeError);
  });
});
