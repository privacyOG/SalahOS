import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';
import { buildNightPrayerPresentation } from './nightPrayerPresentation';
import { calculatePrayerSchedule } from './prayerEngine';
import { calculateIslamicMidnight } from './supplementaryTimes';

const method = getCalculationMethod('muslim-world-league');

function schedule(dateIso: string) {
  return calculatePrayerSchedule({
    date: new Date(`${dateIso}T00:00:00.000Z`),
    latitude: -33.8688,
    longitude: 151.2093,
    utcOffsetMinutes: 600,
    method,
  });
}

const previous = schedule('2026-08-15');
const today = schedule('2026-08-16');
const tomorrow = schedule('2026-08-17');

function available(value: number | null): number {
  if (value === null) throw new Error('Expected prayer time to be available');
  return value;
}

describe('night prayer presentation', () => {
  it('uses the previous civil day for the active night before Fajr', () => {
    const fajr = available(today.prayers.fajr.roundedLocalMinutes);
    const result = buildNightPrayerPresentation({
      previous,
      today,
      tomorrow,
      localMinutes: Math.max(0, fajr - 20),
      ishraqMinutesAfterSunrise: 15,
    });

    expect(result.prominent).toBe(true);
    expect(result.phase).toBe('active');
    expect(result.islamicMidnight.localMinutes).toBe(
      calculateIslamicMidnight(previous, today, 'fajr').localMinutes,
    );
    expect(result.ishraq?.localMinutes).toBe(
      (available(today.prayers.sunrise.roundedLocalMinutes) + 15) % 1_440,
    );
  });

  it('uses tonight and tomorrow morning after Isha', () => {
    const isha = available(today.prayers.isha.roundedLocalMinutes);
    const result = buildNightPrayerPresentation({
      previous,
      today,
      tomorrow,
      localMinutes: Math.min(1_439, isha + 10),
      ishraqMinutesAfterSunrise: 20,
    });

    expect(result.prominent).toBe(true);
    expect(result.phase).toBe('active');
    expect(result.islamicMidnight.localMinutes).toBe(
      calculateIslamicMidnight(today, tomorrow, 'fajr').localMinutes,
    );
    expect(result.ishraq?.localMinutes).toBe(
      (available(tomorrow.prayers.sunrise.roundedLocalMinutes) + 20) % 1_440,
    );
  });

  it('keeps the upcoming night under secondary context during the day', () => {
    const dhuhr = available(today.prayers.dhuhr.roundedLocalMinutes);
    const result = buildNightPrayerPresentation({
      previous,
      today,
      tomorrow,
      localMinutes: dhuhr,
    });

    expect(result.prominent).toBe(false);
    expect(result.phase).toBe('upcoming');
    expect(result.ishraq).toBeNull();
  });

  it('exposes the selected night-end convention and preserves provenance', () => {
    const result = buildNightPrayerPresentation({
      previous,
      today,
      tomorrow,
      localMinutes: available(today.prayers.dhuhr.roundedLocalMinutes),
      nightEndConvention: 'sunrise',
      ishraqMinutesAfterSunrise: 10,
    });

    expect(result.nightEndConvention).toBe('sunrise');
    expect(result.islamicMidnight.provenance).toContain('next sunrise');
    expect(result.lastThirdStart.provenance).toContain('next sunrise');
    expect(result.ishraq?.provenance).toContain('10 minutes after displayed sunrise');
  });

  it('rejects invalid local clock values', () => {
    expect(() =>
      buildNightPrayerPresentation({ previous, today, tomorrow, localMinutes: 1_440 }),
    ).toThrow(RangeError);
  });
});
