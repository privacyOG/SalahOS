import { describe, expect, it } from 'vitest';

import { absoluteTurnToQibla, normalizeBearing, signedTurnToQibla } from './qiblaGuidance';

describe('Qibla compass guidance', () => {
  it('normalizes bearings into the 0 to <360 range', () => {
    expect(normalizeBearing(360)).toBe(0);
    expect(normalizeBearing(-10)).toBe(350);
    expect(normalizeBearing(725)).toBe(5);
  });

  it('returns the shortest signed turn from device heading to Qibla', () => {
    expect(signedTurnToQibla(10, 350)).toBe(20);
    expect(signedTurnToQibla(350, 10)).toBe(-20);
    expect(signedTurnToQibla(180, 0)).toBe(180);
  });

  it('reports absolute angular error for alignment UI', () => {
    expect(absoluteTurnToQibla(277.5, 280)).toBeCloseTo(2.5, 8);
  });

  it('rejects non-finite bearings', () => {
    expect(() => normalizeBearing(Number.NaN)).toThrow(/finite/u);
    expect(() => signedTurnToQibla(0, Number.POSITIVE_INFINITY)).toThrow(/finite/u);
  });
});
