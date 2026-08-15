import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';

describe('createCoordinates', () => {
  it('accepts valid manual coordinates', () => {
    expect(createCoordinates(-33.8688, 151.2093)).toEqual({
      latitude: -33.8688,
      longitude: 151.2093,
    });
  });

  it('rejects invalid latitude and longitude values', () => {
    expect(() => createCoordinates(91, 0)).toThrow(RangeError);
    expect(() => createCoordinates(0, -181)).toThrow(RangeError);
    expect(() => createCoordinates(Number.NaN, 0)).toThrow(RangeError);
  });
});
