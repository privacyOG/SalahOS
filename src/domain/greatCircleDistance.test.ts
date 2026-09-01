import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  greatCircleDistanceKilometers,
  MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS,
} from './greatCircleDistance';

describe('great-circle distance', () => {
  it('returns zero for the same coordinates', () => {
    const sydney = createCoordinates(-33.8688, 151.2093);
    expect(greatCircleDistanceKilometers(sydney, sydney)).toBeCloseTo(0, 4);
  });

  it('matches the Sydney to Melbourne surface distance', () => {
    const distance = greatCircleDistanceKilometers(
      createCoordinates(-33.8688, 151.2093),
      createCoordinates(-37.8136, 144.9631),
    );
    expect(distance).toBeGreaterThan(710);
    expect(distance).toBeLessThan(720);
  });

  it('keeps the 150 km relocation threshold explicit', () => {
    expect(MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS).toBe(150);
    const origin = createCoordinates(0, 0);
    expect(greatCircleDistanceKilometers(origin, createCoordinates(0, 1.34))).toBeLessThan(150);
    expect(greatCircleDistanceKilometers(origin, createCoordinates(0, 1.36))).toBeGreaterThan(150);
  });
});
