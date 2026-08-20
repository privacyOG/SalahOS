export type QiblaMapLayer = 'standard' | 'satellite';

const STANDARD_TILE_ROOT = 'https://tile.openstreetmap.org';
const SATELLITE_TILE_ROOT =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';

export function qiblaMapTileUrl(
  layer: QiblaMapLayer,
  zoom: number,
  x: number,
  y: number,
): string {
  if (![zoom, x, y].every(Number.isInteger)) {
    throw new RangeError('Map tile coordinates must be integers');
  }
  if (layer === 'standard') {
    return `${STANDARD_TILE_ROOT}/${String(zoom)}/${String(x)}/${String(y)}.png`;
  }
  return `${SATELLITE_TILE_ROOT}/${String(zoom)}/${String(y)}/${String(x)}`;
}
