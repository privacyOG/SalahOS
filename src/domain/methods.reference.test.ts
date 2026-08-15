import { describe, expect, it } from 'vitest';
import { getCalculationMethod } from './methods';

const referenceParameters = {
  'muslim-world-league': { fajr: 18, isha: { kind: 'angle', angleDegrees: 17 } },
  'umm-al-qura': { fajr: 18.5, isha: { kind: 'interval', minutesAfterMaghrib: 90 } },
  egyptian: { fajr: 19.5, isha: { kind: 'angle', angleDegrees: 17.5 } },
  karachi: { fajr: 18, isha: { kind: 'angle', angleDegrees: 18 } },
  isna: { fajr: 15, isha: { kind: 'angle', angleDegrees: 15 } },
  muis: { fajr: 20, isha: { kind: 'angle', angleDegrees: 18 } },
  kuwait: { fajr: 18, isha: { kind: 'angle', angleDegrees: 17.5 } },
  qatar: { fajr: 18, isha: { kind: 'interval', minutesAfterMaghrib: 90 } },
} as const;

describe('cross-checked calculation method registry', () => {
  for (const [id, expected] of Object.entries(referenceParameters)) {
    it(`${id} matches the documented frozen reference parameters`, () => {
      const method = getCalculationMethod(id as keyof typeof referenceParameters);

      expect(method.fajrAngleDegrees).toBe(expected.fajr);
      expect(method.ishaRule).toEqual(expected.isha);
      expect(method.maghribRule).toEqual({ kind: 'sunset' });
      expect(method.verification).toBe('cross-checked-reference');
    });
  }

  it('keeps Turkey and Dubai explicitly pending rather than overstating authority', () => {
    expect(getCalculationMethod('diyanet').verification).toBe('pending-authoritative-source');
    expect(getCalculationMethod('dubai').verification).toBe('pending-authoritative-source');
  });
});
