import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import {
  assertIanaTimeZone,
  civilDateInTimeZone,
  resolveIanaTimeZone,
  utcOffsetMinutesAt,
} from './timezone';

describe('offline IANA timezone resolution', () => {
  it('resolves well-known inhabited coordinates without a network request', () => {
    expect(resolveIanaTimeZone(createCoordinates(-33.8688, 151.2093)).timeZone).toBe(
      'Australia/Sydney',
    );
    expect(resolveIanaTimeZone(createCoordinates(21.4225, 39.8262)).timeZone).toBe('Asia/Riyadh');
  });

  it('uses IANA rules to apply Sydney daylight saving instead of deriving offsets from longitude', () => {
    expect(utcOffsetMinutesAt(new Date('2026-01-15T00:00:00.000Z'), 'Australia/Sydney')).toBe(660);
    expect(utcOffsetMinutesAt(new Date('2026-07-15T00:00:00.000Z'), 'Australia/Sydney')).toBe(600);
  });

  it('handles the 2026 Sydney DST end boundary', () => {
    expect(utcOffsetMinutesAt(new Date('2026-04-04T15:59:00.000Z'), 'Australia/Sydney')).toBe(660);
    expect(utcOffsetMinutesAt(new Date('2026-04-04T16:01:00.000Z'), 'Australia/Sydney')).toBe(600);
  });

  it('handles the 2026 Sydney DST start boundary', () => {
    expect(utcOffsetMinutesAt(new Date('2026-10-03T15:59:00.000Z'), 'Australia/Sydney')).toBe(600);
    expect(utcOffsetMinutesAt(new Date('2026-10-03T16:01:00.000Z'), 'Australia/Sydney')).toBe(660);
  });

  it('uses IANA rules across a northern-hemisphere DST zone', () => {
    expect(utcOffsetMinutesAt(new Date('2026-01-15T00:00:00.000Z'), 'Europe/London')).toBe(0);
    expect(utcOffsetMinutesAt(new Date('2026-07-15T00:00:00.000Z'), 'Europe/London')).toBe(60);
  });

  it('handles the 2026 London DST transition boundaries', () => {
    expect(utcOffsetMinutesAt(new Date('2026-03-29T00:59:00.000Z'), 'Europe/London')).toBe(0);
    expect(utcOffsetMinutesAt(new Date('2026-03-29T01:01:00.000Z'), 'Europe/London')).toBe(60);
    expect(utcOffsetMinutesAt(new Date('2026-10-25T00:59:00.000Z'), 'Europe/London')).toBe(60);
    expect(utcOffsetMinutesAt(new Date('2026-10-25T01:01:00.000Z'), 'Europe/London')).toBe(0);
  });

  it('derives the correct local civil date across a UTC day boundary', () => {
    const localDate = civilDateInTimeZone(new Date('2026-08-15T15:30:00.000Z'), 'Australia/Sydney');
    expect(localDate.toISOString()).toBe('2026-08-16T00:00:00.000Z');
  });

  it('rejects invalid IANA timezone identifiers', () => {
    expect(() => assertIanaTimeZone('Not/A_Real_Zone')).toThrow(RangeError);
  });
});
