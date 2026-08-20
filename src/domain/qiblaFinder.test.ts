import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  applyMagneticDeclination,
  compensateHeadingForScreenOrientation,
  haversineDistanceMeters,
  isQiblaAligned,
  shouldRecalculateQibla,
  smoothCircularHeading,
} from './qiblaFinder';

describe('Qiblah Finder guidance math', () => {
  it('converts a magnetic heading to the true-north reference', () => {
    expect(applyMagneticDeclination(350, 12.5)).toBeCloseTo(2.5, 8);
    expect(applyMagneticDeclination(10, -15)).toBeCloseTo(355, 8);
  });

  it('compensates the heading for portrait and rotated screen orientations', () => {
    expect(compensateHeadingForScreenOrientation(15, 0)).toBe(15);
    expect(compensateHeadingForScreenOrientation(15, 90)).toBe(105);
    expect(compensateHeadingForScreenOrientation(15, 180)).toBe(195);
    expect(compensateHeadingForScreenOrientation(15, 270)).toBe(285);
  });

  it('smooths across north without rotating the long way around', () => {
    const smoothed = smoothCircularHeading(359, 1, 0.5);
    expect(smoothed === 0 || smoothed === 360).toBe(true);

    expect(smoothCircularHeading(1, 359, 0.5)).toBeCloseTo(0, 8);
  });

  it('uses a two-degree inclusive alignment tolerance by default', () => {
    expect(isQiblaAligned(277.5, 275.5)).toBe(true);
    expect(isQiblaAligned(277.5, 279.5)).toBe(true);
    expect(isQiblaAligned(277.5, 279.51)).toBe(false);
  });

  it('measures movement geodesically and only recalculates after 100 metres', () => {
    const origin = createCoordinates(-33.8688, 151.2093);
    const close = createCoordinates(-33.8684, 151.2093);
    const far = createCoordinates(-33.8677, 151.2093);

    expect(haversineDistanceMeters(origin, close)).toBeGreaterThan(40);
    expect(haversineDistanceMeters(origin, close)).toBeLessThan(50);
    expect(shouldRecalculateQibla(origin, close)).toBe(false);
    expect(haversineDistanceMeters(origin, far)).toBeGreaterThan(120);
    expect(shouldRecalculateQibla(origin, far)).toBe(true);
  });

  it('rejects invalid smoothing, declination and movement thresholds', () => {
    expect(() => applyMagneticDeclination(0, Number.NaN)).toThrow(/declination/u);
    expect(() => smoothCircularHeading(0, 10, 0)).toThrow(/smoothing/u);
    expect(() =>
      shouldRecalculateQibla(createCoordinates(0, 0), createCoordinates(0, 1), 0),
    ).toThrow(/threshold/u);
  });
});
