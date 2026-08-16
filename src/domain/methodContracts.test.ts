import { describe, expect, it } from 'vitest';
import { calculationMethods } from './methods';

const verifiedContracts = {
  'muslim-world-league': {
    fajrAngleDegrees: 18,
    ishaRule: { kind: 'angle', angleDegrees: 17 },
  },
  'umm-al-qura': {
    fajrAngleDegrees: 18.5,
    ishaRule: { kind: 'interval', minutesAfterMaghrib: 90 },
  },
  egyptian: {
    fajrAngleDegrees: 19.5,
    ishaRule: { kind: 'angle', angleDegrees: 17.5 },
  },
  karachi: {
    fajrAngleDegrees: 18,
    ishaRule: { kind: 'angle', angleDegrees: 18 },
  },
  isna: {
    fajrAngleDegrees: 15,
    ishaRule: { kind: 'angle', angleDegrees: 15 },
  },
  muis: {
    fajrAngleDegrees: 20,
    ishaRule: { kind: 'angle', angleDegrees: 18 },
  },
  kuwait: {
    fajrAngleDegrees: 18,
    ishaRule: { kind: 'angle', angleDegrees: 17.5 },
  },
  qatar: {
    fajrAngleDegrees: 18,
    ishaRule: { kind: 'interval', minutesAfterMaghrib: 90 },
  },
} as const;

describe('named calculation method contracts', () => {
  it('locks every cross-checked built-in to its reviewed Fajr and Isha parameters', () => {
    for (const [id, expected] of Object.entries(verifiedContracts)) {
      const method = calculationMethods[id as keyof typeof calculationMethods];
      expect(method.verification).toBe('cross-checked-reference');
      expect(method.fajrAngleDegrees).toBe(expected.fajrAngleDegrees);
      expect(method.ishaRule).toEqual(expected.ishaRule);
      expect(method.maghribRule).toEqual({ kind: 'sunset' });
      expect(method.provenance.trim().length).toBeGreaterThan(0);
    }
  });

  it('does not accidentally promote approximation-only profiles to verified', () => {
    expect(calculationMethods.diyanet.verification).toBe('pending-authoritative-source');
    expect(calculationMethods.dubai.verification).toBe('pending-authoritative-source');
  });

  it('keeps the verified and pending sets exhaustive for built-in methods', () => {
    const verified = Object.entries(calculationMethods)
      .filter(([, method]) => method.verification === 'cross-checked-reference')
      .map(([id]) => id)
      .sort();
    const expectedVerified = Object.keys(verifiedContracts).sort();
    const pending = Object.entries(calculationMethods)
      .filter(([, method]) => method.verification === 'pending-authoritative-source')
      .map(([id]) => id)
      .sort();

    expect(verified).toEqual(expectedVerified);
    expect(pending).toEqual(['diyanet', 'dubai']);
  });
});
