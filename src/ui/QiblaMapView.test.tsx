import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { qiblaFinderCopy } from '../i18n/qiblaFinderTranslations';
import { QiblaMapView } from './QiblaMapView';

const coordinates = createCoordinates(-33.8688, 151.2093);

function renderMap(tilesEnabled: boolean): string {
  return renderToStaticMarkup(
    <QiblaMapView
      coordinates={coordinates}
      bearingDegrees={277.5}
      aligned={false}
      zoom={15}
      tilesEnabled={tilesEnabled}
      text={qiblaFinderCopy.en}
      onZoomChange={vi.fn()}
      onEnableTiles={vi.fn()}
      onDropPin={vi.fn()}
    />,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('QiblaMapView', () => {
  it('renders the fallback map immediately without a privacy-consent gate', () => {
    const markup = renderMap(false);

    expect(markup).not.toContain('Load map tiles');
    expect(markup).toContain('data-map-provider="openstreetmap"');
    expect(markup).toContain('https://tile.openstreetmap.org/');
  });

  it('renders OpenStreetMap attribution when Google Maps is not configured', () => {
    const markup = renderMap(true);

    expect(markup).toContain('https://www.openstreetmap.org/copyright');
    expect(markup).toContain('© OpenStreetMap contributors');
    expect(markup).toContain('role="group"');
    expect(markup).not.toContain('role="application"');
  });

  it('prefers Google satellite imagery when the Maps API key is configured', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-google-key');

    const markup = renderMap(false);

    expect(markup).toContain('data-map-provider="google-satellite"');
    expect(markup).toContain('https://maps.googleapis.com/maps/api/staticmap');
    expect(markup).toContain('maptype=satellite');
    expect(markup).toContain('key=test-google-key');
    expect(markup).toContain('Google Maps');
    expect(markup).not.toContain('tile.openstreetmap.org');
  });
});
