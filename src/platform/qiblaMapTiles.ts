import { QIBLA_MAP_MAX_ZOOM, QIBLA_MAP_MIN_ZOOM } from '../domain/qiblaMap';

export type QiblaMapLayer = 'standard' | 'satellite';

const STANDARD_TILE_ROOT = 'https://tile.openstreetmap.org';
const SATELLITE_TILE_ROOT =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const STANDARD_ATTRIBUTION_URL = 'https://www.openstreetmap.org/copyright';

export function qiblaMapTileUrl(
  layer: QiblaMapLayer,
  zoom: number,
  x: number,
  y: number,
): string {
  assertMapTileCoordinate(zoom, x, y);
  if (layer === 'standard') {
    return `${STANDARD_TILE_ROOT}/${String(zoom)}/${String(x)}/${String(y)}.png`;
  }
  return `${SATELLITE_TILE_ROOT}/${String(zoom)}/${String(y)}/${String(x)}`;
}

export function qiblaMapAttributionUrl(layer: QiblaMapLayer): string | null {
  return layer === 'standard' ? STANDARD_ATTRIBUTION_URL : null;
}

function assertMapTileCoordinate(zoom: number, x: number, y: number): void {
  if (![zoom, x, y].every(Number.isInteger)) {
    throw new RangeError('Map tile coordinates must be integers');
  }
  if (zoom < QIBLA_MAP_MIN_ZOOM || zoom > QIBLA_MAP_MAX_ZOOM) {
    throw new RangeError(
      `Map tile zoom must be from ${String(QIBLA_MAP_MIN_ZOOM)} through ${String(QIBLA_MAP_MAX_ZOOM)}`,
    );
  }
  const tilesPerAxis = 2 ** zoom;
  if (x < 0 || y < 0 || x >= tilesPerAxis || y >= tilesPerAxis) {
    throw new RangeError('Map tile x/y coordinates are outside the selected zoom level');
  }
}
