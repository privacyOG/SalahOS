import { createCoordinates, type Coordinates } from './coordinates';
import { normalizeBearing } from './qiblaGuidance';

export const QIBLA_MAP_TILE_SIZE = 256;
export const QIBLA_MAP_MIN_ZOOM = 3;
export const QIBLA_MAP_MAX_ZOOM = 18;

export interface QiblaMapTile {
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly key: string;
}

export interface QiblaMapPoint {
  readonly x: number;
  readonly y: number;
}

interface WorldPixel {
  readonly x: number;
  readonly y: number;
}

export function clampQiblaMapZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    throw new RangeError('Map zoom must be finite');
  }
  return Math.max(QIBLA_MAP_MIN_ZOOM, Math.min(QIBLA_MAP_MAX_ZOOM, Math.round(zoom)));
}

export function qiblaMapTiles(
  coordinates: Coordinates,
  zoom: number,
  radius = 2,
): readonly QiblaMapTile[] {
  const center = worldPixelForCoordinates(coordinates, zoom);
  const normalizedZoom = clampQiblaMapZoom(zoom);
  if (!Number.isInteger(radius) || radius < 1 || radius > 3) {
    throw new RangeError('Map tile radius must be an integer from 1 through 3');
  }

  const worldTiles = 2 ** normalizedZoom;
  const centerTileX = Math.floor(center.x / QIBLA_MAP_TILE_SIZE);
  const centerTileY = Math.floor(center.y / QIBLA_MAP_TILE_SIZE);
  const tiles: QiblaMapTile[] = [];

  for (let yOffset = -radius; yOffset <= radius; yOffset += 1) {
    const rawY = centerTileY + yOffset;
    if (rawY < 0 || rawY >= worldTiles) continue;

    for (let xOffset = -radius; xOffset <= radius; xOffset += 1) {
      const rawX = centerTileX + xOffset;
      const wrappedX = ((rawX % worldTiles) + worldTiles) % worldTiles;
      tiles.push(
        Object.freeze({
          zoom: normalizedZoom,
          x: wrappedX,
          y: rawY,
          offsetX: rawX * QIBLA_MAP_TILE_SIZE - center.x,
          offsetY: rawY * QIBLA_MAP_TILE_SIZE - center.y,
          key: [normalizedZoom, wrappedX, rawY, xOffset].join('/'),
        }),
      );
    }
  }

  return Object.freeze(tiles);
}

export function coordinatesForMapPoint(
  centerCoordinates: Coordinates,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
  point: QiblaMapPoint,
): Coordinates {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y)
  ) {
    throw new RangeError('Map viewport and point values must be finite and positive');
  }

  const center = worldPixelForCoordinates(centerCoordinates, zoom);
  return coordinatesForWorldPixel(
    {
      x: center.x + point.x - viewportWidth / 2,
      y: center.y + point.y - viewportHeight / 2,
    },
    zoom,
  );
}

export function qiblaBearingRayEndpoint(
  bearingDegrees: number,
  viewportWidth: number,
  viewportHeight: number,
): QiblaMapPoint {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    throw new RangeError('Map viewport dimensions must be finite and positive');
  }

  const bearing = (normalizeBearing(bearingDegrees) * Math.PI) / 180;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const length = Math.hypot(viewportWidth, viewportHeight);
  return Object.freeze({
    x: centerX + Math.sin(bearing) * length,
    y: centerY - Math.cos(bearing) * length,
  });
}

function worldPixelForCoordinates(coordinates: Coordinates, zoom: number): WorldPixel {
  const position = createCoordinates(coordinates.latitude, coordinates.longitude);
  const normalizedZoom = clampQiblaMapZoom(zoom);
  const worldSize = QIBLA_MAP_TILE_SIZE * 2 ** normalizedZoom;
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, position.latitude));
  const sine = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((position.longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * worldSize,
  };
}

function coordinatesForWorldPixel(pixel: WorldPixel, zoom: number): Coordinates {
  const normalizedZoom = clampQiblaMapZoom(zoom);
  const worldSize = QIBLA_MAP_TILE_SIZE * 2 ** normalizedZoom;
  const wrappedX = ((pixel.x % worldSize) + worldSize) % worldSize;
  const clampedY = Math.max(0, Math.min(worldSize, pixel.y));
  const longitude = (wrappedX / worldSize) * 360 - 180;
  const mercatorY = Math.PI * (1 - (2 * clampedY) / worldSize);
  const latitude = (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI;
  return createCoordinates(latitude, longitude);
}
