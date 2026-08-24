import { describe, expect, it } from 'vitest';

import {
  qiblaGoogleLineStyle,
  qiblaGoogleMapsJavaScriptUrl,
  qiblaGoogleMapsTermsUrl,
} from './qiblaGoogleMaps';

describe('Qibla Google Maps provider', () => {
  it('builds a Maps JavaScript API request from the restricted client key', () => {
    const url = new URL(qiblaGoogleMapsJavaScriptUrl('test-key'));

    expect(url.origin).toBe('https://maps.googleapis.com');
    expect(url.pathname).toBe('/maps/api/js');
    expect(url.searchParams.get('key')).toBe('test-key');
    expect(url.searchParams.get('v')).toBe('weekly');
    expect(url.searchParams.get('loading')).toBe('async');
  });

  it('uses a high-contrast blue route on roadmap and red route on imagery', () => {
    expect(qiblaGoogleLineStyle('roadmap', false)).toEqual({
      color: '#1267d6',
      weight: 6,
      haloColor: '#ffffff',
      haloWeight: 10,
    });
    expect(qiblaGoogleLineStyle('satellite', false).color).toBe('#e53e30');
    expect(qiblaGoogleLineStyle('hybrid', false).color).toBe('#e53e30');
  });

  it('uses a thicker green route when the live compass is aligned', () => {
    expect(qiblaGoogleLineStyle('satellite', true)).toEqual({
      color: '#15803d',
      weight: 7,
      haloColor: '#ffffff',
      haloWeight: 11,
    });
  });

  it('rejects an empty API key and exposes the Google Maps terms link', () => {
    expect(() => qiblaGoogleMapsJavaScriptUrl('   ')).toThrow(/API key/u);
    expect(qiblaGoogleMapsTermsUrl()).toBe('https://www.google.com/help/terms_maps/');
  });
});
