import { describe, expect, it } from 'vitest';
import {
  calendarDate,
  gregorianDateParts,
  hijriDateParts,
  supportsHijriCalendar,
} from './calendar';

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function findHijriTransition(
  start: Date,
  days: number,
  predicate: (
    previous: ReturnType<typeof hijriDateParts>,
    current: ReturnType<typeof hijriDateParts>,
  ) => boolean,
): { previousDate: Date; currentDate: Date } | null {
  let previousDate = start;
  let previous = hijriDateParts(previousDate);

  for (let offset = 1; offset <= days; offset += 1) {
    const currentDate = new Date(start.getTime() + offset * 86_400_000);
    const current = hijriDateParts(currentDate);
    if (predicate(previous, current)) {
      return { previousDate, currentDate };
    }
    previousDate = currentDate;
    previous = current;
  }

  return null;
}

describe('Gregorian and Hijri calendar domain', () => {
  it('requires runtime support for the selected Umm al-Qura calendar', () => {
    expect(supportsHijriCalendar('islamic-umalqura')).toBe(true);
  });

  it('returns Gregorian civil-date parts without host-timezone dependence', () => {
    expect(gregorianDateParts(utcDate('2026-08-16'))).toEqual({
      calendar: 'gregory',
      year: 2026,
      month: 8,
      day: 16,
      source: 'civil-date',
    });
  });

  it('represents a Gregorian leap day and advances to March without skipping a civil date', () => {
    expect(gregorianDateParts(utcDate('2024-02-29'))).toEqual({
      calendar: 'gregory',
      year: 2024,
      month: 2,
      day: 29,
      source: 'civil-date',
    });

    const nextCivilDate = new Date(utcDate('2024-02-29').getTime() + 86_400_000);
    expect(gregorianDateParts(nextCivilDate)).toEqual({
      calendar: 'gregory',
      year: 2024,
      month: 3,
      day: 1,
      source: 'civil-date',
    });
  });

  it('crosses the Gregorian year boundary on consecutive civil dates', () => {
    expect(gregorianDateParts(utcDate('2026-12-31'))).toMatchObject({
      year: 2026,
      month: 12,
      day: 31,
    });
    expect(gregorianDateParts(utcDate('2027-01-01'))).toMatchObject({
      year: 2027,
      month: 1,
      day: 1,
    });
  });

  it('returns explicit Hijri calendar provenance and no implicit correction', () => {
    const result = hijriDateParts(utcDate('2026-08-16'));

    expect(result.calendar).toBe('islamic-umalqura');
    expect(result.source).toBe('runtime-intl-calendar');
    expect(result.correctionDays).toBe(0);
    expect(result.year).toBeGreaterThan(1400);
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
    expect(result.day).toBeGreaterThanOrEqual(1);
    expect(result.day).toBeLessThanOrEqual(30);
  });

  it('applies manual Hijri correction by shifting the civil date explicitly', () => {
    const civilDate = utcDate('2026-08-16');

    expect(hijriDateParts(civilDate, 1)).toEqual({
      ...hijriDateParts(utcDate('2026-08-17')),
      correctionDays: 1,
    });
    expect(hijriDateParts(civilDate, -1)).toEqual({
      ...hijriDateParts(utcDate('2026-08-15')),
      correctionDays: -1,
    });
  });

  it('rejects corrections outside the documented ±2-day range', () => {
    const civilDate = utcDate('2026-08-16');
    expect(() => hijriDateParts(civilDate, 3)).toThrow(RangeError);
    expect(() => hijriDateParts(civilDate, -3)).toThrow(RangeError);
    expect(() => hijriDateParts(civilDate, 0.5)).toThrow(RangeError);
  });

  it('crosses a Hijri month boundary correctly within a bounded scan', () => {
    const transition = findHijriTransition(
      utcDate('2026-01-01'),
      70,
      (previous, current) => previous.month !== current.month,
    );

    expect(transition).not.toBeNull();
    if (transition === null) return;

    const previous = hijriDateParts(transition.previousDate);
    const current = hijriDateParts(transition.currentDate);
    expect(current.day).toBe(1);
    expect(previous.day).toBeGreaterThanOrEqual(29);
  });

  it('crosses a Hijri year boundary correctly within the Gregorian year', () => {
    const transition = findHijriTransition(
      utcDate('2026-01-01'),
      365,
      (previous, current) => previous.year !== current.year,
    );

    expect(transition).not.toBeNull();
    if (transition === null) return;

    const previous = hijriDateParts(transition.previousDate);
    const current = hijriDateParts(transition.currentDate);
    expect(current.month).toBe(1);
    expect(current.day).toBe(1);
    expect(current.year).toBe(previous.year + 1);
  });

  it('detects the Ramadan boundary as entry into Hijri month 9', () => {
    const transition = findHijriTransition(
      utcDate('2026-01-01'),
      120,
      (previous, current) => previous.month !== 9 && current.month === 9,
    );

    expect(transition).not.toBeNull();
    if (transition === null) return;

    const ramadanStart = hijriDateParts(transition.currentDate);
    expect(ramadanStart.month).toBe(9);
    expect(ramadanStart.day).toBe(1);
  });

  it('returns Gregorian and Hijri values together from the same civil date', () => {
    const result = calendarDate(utcDate('2026-08-16'), 0);
    expect(result.gregorian.year).toBe(2026);
    expect(result.hijri.calendar).toBe('islamic-umalqura');
    expect(result.civilDate.toISOString()).toBe('2026-08-16T00:00:00.000Z');
  });

  it('rejects non-midnight values so host clock instants cannot masquerade as civil dates', () => {
    expect(() => calendarDate(new Date('2026-08-16T12:00:00.000Z'))).toThrow(RangeError);
  });
});
