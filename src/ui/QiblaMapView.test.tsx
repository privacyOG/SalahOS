import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

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

describe('QiblaMapView', () => {
  it('does not emit third-party tile requests before explicit map consent', () => {
    const markup = renderMap(false);

    expect(markup).toContain('Load map tiles');
    expect(markup).not.toContain('tile.openstreetmap.org');
  });

  it('renders reviewed tiles and linked OpenStreetMap attribution after consent', () => {
    const markup = renderMap(true);

    expect(markup).toContain('https://tile.openstreetmap.org/');
    expect(markup).toContain('https://www.openstreetmap.org/copyright');
    expect(markup).toContain('© OpenStreetMap contributors');
    expect(markup).toContain('role="group"');
    expect(markup).not.toContain('role="application"');
  });
});
