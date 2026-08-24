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
  it('renders the network-free fallback immediately when Google Maps is not configured', () => {
    const markup = renderMap(false);

    expect(markup).toContain('data-map-provider="local-fallback"');
    expect(markup).toContain('data-google-map-state="unconfigured"');
    expect(markup).toContain('data-qibla-map-fallback="true"');
    expect(markup).toContain('Google Maps is not configured for this build.');
    expect(markup).not.toContain('Load map tiles');
    expect(markup).not.toContain('OpenStreetMap');
    expect(markup).not.toContain('tile.openstreetmap.org');
  });

  it('keeps the fallback map accessible without an external map provider', () => {
    const markup = renderMap(true);

    expect(markup).toContain('role="group"');
    expect(markup).not.toContain('role="application"');
    expect(markup).toContain('Tap the map to drop a Qiblah-location pin.');
    expect(markup).toContain(
      'The local bearing view remains available without sending map requests.',
    );
    expect(markup).not.toContain('openstreetmap.org/copyright');
  });

  it(
    'prepares Satellite as the primary Google Maps mode without exposing the client key in markup',
    () => {
      vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-google-key');

      const markup = renderMap(false);

      expect(markup).toContain('data-google-map-state="loading"');
      expect(markup).toContain('data-google-map-type="satellite"');
      expect(markup).toContain('aria-pressed="true">Satellite</button>');
      expect(markup).toContain('>Map</button>');
      expect(markup).toContain('>Hybrid</button>');
      expect(markup).toContain('Show full Qiblah route');
      expect(markup).toContain('https://www.google.com/help/terms_maps/');
      expect(markup).toContain('Google Maps');
      expect(markup).not.toContain('maps/api/staticmap');
      expect(markup).not.toContain('tile.openstreetmap.org');
      expect(markup).not.toContain('test-google-key');
    },
  );
});
