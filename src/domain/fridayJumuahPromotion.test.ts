import { describe, expect, it } from 'vitest';

import type { JumuahSession } from './mosqueTimetable';
import { shouldPromoteFridayJumuah } from './fridayJumuahPromotion';

const sessions: readonly JumuahSession[] = Object.freeze([
  Object.freeze({ label: "Jumu'ah 1", khutbahLocalMinutes: 780, salahLocalMinutes: 800 }),
  Object.freeze({ label: "Jumu'ah 2", khutbahLocalMinutes: 840, salahLocalMinutes: 860 }),
]);

function civilDateIsoInTimeZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

describe('Friday Jumuah promotion', () => {
  it('promotes every configured-session set on a Friday calculation civil date', () => {
    expect(
      shouldPromoteFridayJumuah({
        civilDateIso: '2026-09-04',
        jumuahSessions: sessions,
      }),
    ).toBe(true);
  });

  it('does not promote sessions on a non-Friday calculation civil date', () => {
    expect(
      shouldPromoteFridayJumuah({
        civilDateIso: '2026-09-05',
        jumuahSessions: sessions,
      }),
    ).toBe(false);
  });

  it('does not promote Friday when no Jumuah sessions are configured', () => {
    expect(
      shouldPromoteFridayJumuah({
        civilDateIso: '2026-09-04',
        jumuahSessions: [],
      }),
    ).toBe(false);
  });

  it('uses the calculation civil date across a device/date-boundary disagreement', () => {
    const sameInstant = new Date('2026-09-04T14:30:00.000Z');
    const calculationCivilDate = civilDateIsoInTimeZone(sameInstant, 'America/Los_Angeles');
    const deviceCivilDate = civilDateIsoInTimeZone(sameInstant, 'Australia/Sydney');

    expect(calculationCivilDate).toBe('2026-09-04');
    expect(deviceCivilDate).toBe('2026-09-05');
    expect(
      shouldPromoteFridayJumuah({
        civilDateIso: calculationCivilDate,
        jumuahSessions: sessions,
      }),
    ).toBe(true);
  });

  it('rejects malformed or impossible civil dates', () => {
    expect(shouldPromoteFridayJumuah({ civilDateIso: '2026-02-30', jumuahSessions: sessions })).toBe(
      false,
    );
    expect(shouldPromoteFridayJumuah({ civilDateIso: '2026/09/04', jumuahSessions: sessions })).toBe(
      false,
    );
  });
});
