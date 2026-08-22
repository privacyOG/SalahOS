import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import {
  qiblaGoogleMapsTermsUrl,
  qiblaGoogleSatelliteMapUrl,
  qiblaGoogleStaticMapPointForViewport,
  QIBLA_GOOGLE_STATIC_MAP_HEIGHT,
  QIBLA_GOOGLE_STATIC_MAP_WIDTH,
} from './qiblaGoogleMaps';

describe('Qibla Google Maps provider', () => {
  it('builds a satellite Static Maps request for the selected coordinates', () => {
    const url = new URL(
      qiblaGoogleSatelliteMapUrl(createCoordinates(-33.8688, 151.2093), 16, 'test-key'),
    );

    expect(url.origin).toBe('https://maps.googleapis.com');
    expect(url.pathname).toBe('/maps/api/staticmap');
    expect(url.searchParams.get('center')).toBe('-33.868800,151.209300');
    expect(url.searchParams.get('zoom')).toBe('16');
    expect(url.searchParams.get('size')).toBe('640x480');
    expect(url.searchParams.get('maptype')).toBe('satellite');
    expect(url.searchParams.get('scale')).toBe('2');
    expect(url.searchParams.get('key')).toBe('test-key');
  });

  it('maps responsive viewport clicks onto the Static Maps logical pixel extent', () => {
    const center = qiblaGoogleStaticMapPointForViewport(430, 300, { x: 215, y: 150 });
    expect(center.viewportWidth).toBe(QIBLA_GOOGLE_STATIC_MAP_WIDTH);
    expect(center.viewportHeight).toBe(QIBLA_GOOGLE_STATIC_MAP_HEIGHT);
    expect(center.point).toEqual({ x: 320, y: 240 });

    const lowerRight = qiblaGoogleStaticMapPointForViewport(320, 720, { x: 320, y: 720 });
    expect(lowerRight.point).toEqual({ x: 640, y: 480 });
  });

  it('rejects invalid viewport geometry', () => {
    expect(() => qiblaGoogleStaticMapPointForViewport(0, 480, { x: 0, y: 0 })).toThrow(
      /viewport/u,
    );
  });

  it('rejects an empty API key and exposes the Google Maps terms link', () => {
    expect(() =>
      qiblaGoogleSatelliteMapUrl(createCoordinates(21.4225, 39.8262), 15, '   '),
    ).toThrow(/API key/u);
    expect(qiblaGoogleMapsTermsUrl()).toBe('https://www.google.com/help/terms_maps/');
  });
});
