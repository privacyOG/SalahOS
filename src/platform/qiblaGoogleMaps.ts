import type { Coordinates } from '../domain/coordinates';
import { clampQiblaMapZoom, type QiblaMapPoint } from '../domain/qiblaMap';

const GOOGLE_STATIC_MAP_ROOT = 'https://maps.googleapis.com/maps/api/staticmap';
const GOOGLE_MAPS_TERMS_URL = 'https://www.google.com/help/terms_maps/';
export const QIBLA_GOOGLE_STATIC_MAP_WIDTH = 640;
export const QIBLA_GOOGLE_STATIC_MAP_HEIGHT = 480;

export interface QiblaGoogleStaticMapPoint {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly point: QiblaMapPoint;
}

export function qiblaGoogleSatelliteMapUrl(
  coordinates: Coordinates,
  zoom: number,
  apiKey: string,
): string {
  const key = apiKey.trim();
  if (key.length < 1) throw new TypeError('Google Maps API key is required');

  const url = new URL(GOOGLE_STATIC_MAP_ROOT);
  url.searchParams.set(
    'center',
    `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`,
  );
  url.searchParams.set('zoom', String(clampQiblaMapZoom(zoom)));
  url.searchParams.set(
    'size',
    `${String(QIBLA_GOOGLE_STATIC_MAP_WIDTH)}x${String(QIBLA_GOOGLE_STATIC_MAP_HEIGHT)}`,
  );
  url.searchParams.set('scale', '2');
  url.searchParams.set('maptype', 'satellite');
  url.searchParams.set('format', 'png');
  url.searchParams.set('key', key);
  return url.toString();
}

export function qiblaGoogleStaticMapPointForViewport(
  viewportWidth: number,
  viewportHeight: number,
  point: QiblaMapPoint,
): QiblaGoogleStaticMapPoint {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y)
  ) {
    throw new RangeError('Google map viewport and point values must be finite and positive');
  }

  return Object.freeze({
    viewportWidth: QIBLA_GOOGLE_STATIC_MAP_WIDTH,
    viewportHeight: QIBLA_GOOGLE_STATIC_MAP_HEIGHT,
    point: Object.freeze({
      x: (point.x / viewportWidth) * QIBLA_GOOGLE_STATIC_MAP_WIDTH,
      y: (point.y / viewportHeight) * QIBLA_GOOGLE_STATIC_MAP_HEIGHT,
    }),
  });
}

export function qiblaGoogleMapsTermsUrl(): string {
  return GOOGLE_MAPS_TERMS_URL;
}
