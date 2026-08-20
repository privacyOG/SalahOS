import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  clampQiblaMapZoom,
  coordinatesForMapPoint,
  qiblaBearingRayEndpoint,
  qiblaMapTiles,
} from './qiblaMap';

describe('Qiblah map projection', () => {
  const sydney = createCoordinates(-33.8688, 151.2093);

  it('builds a bounded visible tile grid around the selected coordinates', () => {
    const tiles = qiblaMapTiles(sydney, 15, 2);

    expect(tiles).toHaveLength(25);
    expect(new Set(tiles.map((tile) => tile.key)).size).toBe(tiles.length);
    expect(tiles.every((tile) => tile.zoom === 15)).toBe(true);
  });

  it('converts a map centre click back to the selected coordinates', () => {
    const selected = coordinatesForMapPoint(sydney, 15, 800, 600, { x: 400, y: 300 });

    expect(selected.latitude).toBeCloseTo(sydney.latitude, 8);
    expect(selected.longitude).toBeCloseTo(sydney.longitude, 8);
  });

  it('moves longitude east when the user drops a pin to the right of centre', () => {
    const selected = coordinatesForMapPoint(sydney, 15, 800, 600, { x: 500, y: 300 });

    expect(selected.longitude).toBeGreaterThan(sydney.longitude);
    expect(selected.latitude).toBeCloseTo(sydney.latitude, 2);
  });

  it('draws north, east, south and west bearings in screen coordinates', () => {
    const north = qiblaBearingRayEndpoint(0, 400, 400);
    const east = qiblaBearingRayEndpoint(90, 400, 400);
    const south = qiblaBearingRayEndpoint(180, 400, 400);
    const west = qiblaBearingRayEndpoint(270, 400, 400);

    expect(north.y).toBeLessThan(0);
    expect(east.x).toBeGreaterThan(400);
    expect(south.y).toBeGreaterThan(400);
    expect(west.x).toBeLessThan(0);
  });

  it('clamps supported zoom levels and rejects invalid viewport input', () => {
    expect(clampQiblaMapZoom(1)).toBe(3);
    expect(clampQiblaMapZoom(99)).toBe(18);
    expect(() => coordinatesForMapPoint(sydney, 15, 0, 600, { x: 1, y: 1 })).toThrow(
      /viewport/u,
    );
  });
});
