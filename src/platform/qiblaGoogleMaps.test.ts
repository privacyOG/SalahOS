import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { qiblaGoogleMapsTermsUrl, qiblaGoogleSatelliteMapUrl } from './qiblaGoogleMaps';

describe('Qibla Google Maps provider', () => {
  it('builds a satellite Static Maps request for the selected coordinates', () => {
    const url = new URL(
      qiblaGoogleSatelliteMapUrl(createCoordinates(-33.8688, 151.2093), 16, 'test-key'),
    );

    expect(url.origin).toBe('https://maps.googleapis.com');
    expect(url.pathname).toBe('/maps/api/staticmap');
    expect(url.searchParams.get('center')).toBe('-33.868800,151.209300');
    expect(url.searchParams.get('zoom')).toBe('16');
    expect(url.searchParams.get('maptype')).toBe('satellite');
    expect(url.searchParams.get('scale')).toBe('2');
    expect(url.searchParams.get('key')).toBe('test-key');
  });

  it('rejects an empty API key and exposes the Google Maps terms link', () => {
    expect(() =>
      qiblaGoogleSatelliteMapUrl(createCoordinates(21.4225, 39.8262), 15, '   '),
    ).toThrow(/API key/u);
    expect(qiblaGoogleMapsTermsUrl()).toBe('https://www.google.com/help/terms_maps/');
  });
});
