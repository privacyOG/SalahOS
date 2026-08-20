import { describe, expect, it } from 'vitest';

import { qiblaMapAttributionUrl, qiblaMapTileUrl } from './qiblaMapTiles';

describe('Qiblah map tile provider', () => {
  it('builds the reviewed OpenStreetMap tile URL shape', () => {
    expect(qiblaMapTileUrl(15, 27_148, 15_754)).toBe(
      'https://tile.openstreetmap.org/15/27148/15754.png',
    );
  });

  it('rejects malformed or out-of-range tile requests', () => {
    expect(() => qiblaMapTileUrl(2, 1, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl(19, 1, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl(15, -1, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl(15, 32_768, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl(15.5, 1, 1)).toThrow(RangeError);
  });

  it('exposes the required OpenStreetMap attribution destination', () => {
    expect(qiblaMapAttributionUrl()).toBe('https://www.openstreetmap.org/copyright');
  });
});
