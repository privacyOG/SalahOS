import { describe, expect, it } from 'vitest';
import { calculationMethods, createCustomCalculationMethod, getCalculationMethod } from './methods';

describe('calculation method registry', () => {
  it('keeps built-in method parameters centralized and explicit', () => {
    expect(Object.keys(calculationMethods)).toHaveLength(10);
    expect(getCalculationMethod('muslim-world-league').fajrAngleDegrees).toBe(18);
    expect(getCalculationMethod('umm-al-qura').ishaRule).toEqual({
      kind: 'interval',
      minutesAfterMaghrib: 90,
    });
  });

  it('marks built-in values as pending primary-source verification', () => {
    for (const item of Object.values(calculationMethods)) {
      expect(item.verification).toBe('pending-authoritative-source');
      expect(item.provenance.length).toBeGreaterThan(0);
    }
  });

  it('creates validated custom parameters', () => {
    const custom = createCustomCalculationMethod({
      name: 'Local custom',
      fajrAngleDegrees: 18,
      ishaRule: { kind: 'angle', angleDegrees: 17 },
    });

    expect(custom.id).toBe('custom');
    expect(custom.verification).toBe('custom');
  });

  it('rejects unsafe custom ranges', () => {
    expect(() =>
      createCustomCalculationMethod({
        name: 'Invalid',
        fajrAngleDegrees: 31,
        ishaRule: { kind: 'angle', angleDegrees: 17 },
      }),
    ).toThrow(RangeError);
  });
});
