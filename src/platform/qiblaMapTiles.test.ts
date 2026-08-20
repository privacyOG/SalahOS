import { describe, expect, it } from 'vitest';

import { qiblaMapAttributionUrl, qiblaMapTileUrl } from './qiblaMapTiles';

describe('Qiblah map tile providers', () => {
  it('builds the reviewed OpenStreetMap and Esri tile URL shapes', () => {
    expect(qiblaMapTileUrl('standard', 15, 27_148, 15_754)).toBe(
      'https://tile.openstreetmap.org/15/27148/15754.png',
    );
    expect(qiblaMapTileUrl('satellite', 15, 27_148, 15_754)).toBe(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/15754/27148',
    );
  });

  it('rejects malformed or out-of-range tile requests', () => {
    expect(() => qiblaMapTileUrl('standard', 2, 1, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl('standard', 19, 1, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl('standard', 15, -1, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl('standard', 15, 32_768, 1)).toThrow(RangeError);
    expect(() => qiblaMapTileUrl('standard', 15.5, 1, 1)).toThrow(RangeError);
  });

  it('exposes the required OpenStreetMap attribution destination', () => {
    expect(qiblaMapAttributionUrl('standard')).toBe('https://www.openstreetmap.org/copyright');
    expect(qiblaMapAttributionUrl('satellite')).toBeNull();
  });
});
