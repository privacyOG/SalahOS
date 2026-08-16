import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboard, localClockParts } from './dashboard';
import { calculationMethods } from './methods';

describe('shared prayer dashboard model', () => {
  const sydney = createCoordinates(-33.8688, 151.2093);

  it('builds a complete local dashboard from coordinates and one instant', () => {
    const model = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney,
    });

    expect(model.timeZone).toBe('Australia/Sydney');
    expect(model.utcOffsetMinutes).toBe(600);
    expect(model.today.date).toBe('2026-08-16');
    expect(model.tomorrow.date).toBe('2026-08-17');
    expect(model.prayers).toHaveLength(6);
    expect(model.prayers.map((prayer) => prayer.name)).toEqual([
      'fajr',
      'sunrise',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ]);
    expect(model.gregorian).toMatchObject({ year: 2026, month: 8, day: 16 });
    expect(model.hijri.calendar).toBe('islamic-umalqura');
    expect(model.nextPrayer).not.toBeNull();
    expect(model.secondsUntilNextPrayer).not.toBeNull();
  });

  it('selects tomorrow Fajr after today Isha', () => {
    const model = buildPrayerDashboard({
      instant: new Date('2026-08-16T13:59:30.000Z'),
      coordinates: sydney,
    });

    expect(model.clock.hour).toBe(23);
    expect(model.clock.minute).toBe(59);
    expect(model.nextPrayer).toBe('fajr');
    expect(model.nextPrayerDayOffset).toBe(1);
    expect(model.prayers.every((prayer) => !prayer.isNext)).toBe(true);
  });

  it('keeps local clock extraction independent of the host timezone', () => {
    const instant = new Date('2026-07-01T00:05:06.000Z');
    expect(localClockParts(instant, 'Australia/Sydney')).toMatchObject({
      hour: 10,
      minute: 5,
      second: 6,
    });
    expect(localClockParts(instant, 'Europe/London')).toMatchObject({
      hour: 1,
      minute: 5,
      second: 6,
    });
  });

  it('carries Hijri correction into dashboard provenance', () => {
    const corrected = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney,
      hijriCorrectionDays: 2,
    });

    expect(corrected.hijri.correctionDays).toBe(2);
  });

  it('composes selected calculation settings and prayer adjustments', () => {
    const configured = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney,
      method: calculationMethods['umm-al-qura'],
      asrConvention: 'hanafi',
      highLatitudeRule: 'one-seventh',
      adjustments: { fajr: 2 },
    });

    expect(configured.method.id).toBe('umm-al-qura');
    expect(configured.asrConvention).toBe('hanafi');
    expect(configured.highLatitudeRule).toBe('one-seventh');
    expect(
      configured.prayers.find((prayer) => prayer.name === 'fajr')?.manualAdjustmentMinutes,
    ).toBe(2);
    expect(configured.hasManualAdjustments).toBe(true);
  });

  it('resolves Umm al-Qura Isha separately across the Ramadan to Shawwal boundary', () => {
    const makkah = createCoordinates(21.3891, 39.8579);
    const model = buildPrayerDashboard({
      instant: new Date('2026-03-19T12:00:00.000Z'),
      coordinates: makkah,
      timeZone: 'Asia/Riyadh',
      method: calculationMethods['umm-al-qura'],
      hijriCorrectionDays: 2,
    });

    expect(model.today.date).toBe('2026-03-19');
    expect(model.tomorrow.date).toBe('2026-03-20');
    expect(model.hijri.month).toBe(10);
    expect(model.hijri.correctionDays).toBe(2);
    expect(model.today.method.ishaRule).toEqual({
      kind: 'interval',
      minutesAfterMaghrib: 120,
    });
    expect(model.tomorrow.method.ishaRule).toEqual({
      kind: 'interval',
      minutesAfterMaghrib: 90,
    });

    const todayMaghrib = model.today.prayers.maghrib.roundedLocalMinutes;
    const todayIsha = model.today.prayers.isha.roundedLocalMinutes;
    const tomorrowMaghrib = model.tomorrow.prayers.maghrib.roundedLocalMinutes;
    const tomorrowIsha = model.tomorrow.prayers.isha.roundedLocalMinutes;
    expect(todayMaghrib).not.toBeNull();
    expect(todayIsha).not.toBeNull();
    expect(tomorrowMaghrib).not.toBeNull();
    expect(tomorrowIsha).not.toBeNull();
    expect((todayIsha ?? 0) - (todayMaghrib ?? 0)).toBe(120);
    expect((tomorrowIsha ?? 0) - (tomorrowMaghrib ?? 0)).toBe(90);
  });
});
