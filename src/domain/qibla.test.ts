import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import { calculateQiblaBearing, KAABA_COORDINATES } from './qibla';

describe('Qibla bearing', () => {
  it.each([
    ['Sydney', -33.8688, 151.2093, 277.5],
    ['London', 51.5074, -0.1278, 118.99],
    ['New York', 40.7128, -74.006, 58.48],
    ['Jakarta', -6.2088, 106.8456, 295.15],
  ])(
    'calculates the initial great-circle bearing from %s',
    (_name, latitude, longitude, expected) => {
      const result = calculateQiblaBearing(createCoordinates(latitude, longitude));

      expect(result.degreesFromTrueNorth).toBeCloseTo(expected, 2);
      expect(result.destination).toEqual(KAABA_COORDINATES);
    },
  );

  it('returns a stable zero bearing at the Kaaba coordinate itself', () => {
    expect(calculateQiblaBearing(KAABA_COORDINATES).degreesFromTrueNorth).toBe(0);
  });

  it('revalidates supplied coordinate objects at the domain boundary', () => {
    expect(() => calculateQiblaBearing({ latitude: 91, longitude: 0 })).toThrow(/Latitude/u);
    expect(() => calculateQiblaBearing({ latitude: 0, longitude: 181 })).toThrow(/Longitude/u);
  });
});
