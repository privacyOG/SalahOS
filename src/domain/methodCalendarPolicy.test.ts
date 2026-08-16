import { describe, expect, it } from 'vitest';
import { resolveCalculationMethodForCivilDate } from './methodCalendarPolicy';
import { calculationMethods } from './methods';
import { calculatePrayerSchedule } from './prayerEngine';

describe('calendar-dependent calculation method policy', () => {
  it('uses the Umm al-Qura 120-minute Isha interval during Ramadan', () => {
    const base = calculationMethods['umm-al-qura'];
    const resolved = resolveCalculationMethodForCivilDate(
      base,
      new Date('2026-02-18T00:00:00.000Z'),
    );

    expect(base.ishaRule).toEqual({ kind: 'interval', minutesAfterMaghrib: 90 });
    expect(base.seasonalIshaPolicy).toEqual({ ramadanMinutesAfterMaghrib: 120 });
    expect(resolved).not.toBe(base);
    expect(resolved.id).toBe('umm-al-qura');
    expect(resolved.ishaRule).toEqual({ kind: 'interval', minutesAfterMaghrib: 120 });
  });

  it('applies the seasonal interval to direct prayer-engine callers', () => {
    const schedule = calculatePrayerSchedule({
      date: new Date('2026-02-18T00:00:00.000Z'),
      latitude: 21.3891,
      longitude: 39.8579,
      utcOffsetMinutes: 180,
      method: calculationMethods['umm-al-qura'],
      asrConvention: 'standard',
      highLatitudeRule: 'angle-based',
    });

    expect(schedule.method.ishaRule).toEqual({
      kind: 'interval',
      minutesAfterMaghrib: 120,
    });
    expect(schedule.prayers.isha.provenance.formula).toBe('120 minutes after Maghrib');

    const maghrib = schedule.prayers.maghrib.roundedLocalMinutes;
    const isha = schedule.prayers.isha.roundedLocalMinutes;
    expect(maghrib).not.toBeNull();
    expect(isha).not.toBeNull();
    expect((isha ?? 0) - (maghrib ?? 0)).toBe(120);
  });

  it('returns the base Umm al-Qura interval outside Ramadan', () => {
    const base = calculationMethods['umm-al-qura'];

    expect(
      resolveCalculationMethodForCivilDate(base, new Date('2026-02-17T00:00:00.000Z')),
    ).toBe(base);
    expect(
      resolveCalculationMethodForCivilDate(base, new Date('2026-03-20T00:00:00.000Z')),
    ).toBe(base);
  });

  it('does not alter methods without a seasonal Isha policy', () => {
    const mwl = calculationMethods['muslim-world-league'];
    expect(resolveCalculationMethodForCivilDate(mwl, new Date('2026-02-18T00:00:00.000Z'))).toBe(
      mwl,
    );
  });
});
