import { useMemo, useState, type MouseEvent } from 'react';

import type { Coordinates } from '../domain/coordinates';
import { coordinatesForMapPoint, qiblaBearingRayEndpoint, qiblaMapTiles } from '../domain/qiblaMap';
import type { QiblaFinderCopy } from '../i18n/qiblaFinderTranslations';
import { qiblaMapAttributionUrl, qiblaMapTileUrl } from '../platform/qiblaMapTiles';

interface QiblaMapViewProps {
  readonly coordinates: Coordinates;
  readonly bearingDegrees: number;
  readonly aligned: boolean;
  readonly zoom: number;
  readonly tilesEnabled: boolean;
  readonly text: QiblaFinderCopy;
  readonly onZoomChange: (zoom: number) => void;
  readonly onEnableTiles: () => void;
  readonly onDropPin: (coordinates: Coordinates) => void;
}

export function QiblaMapView({
  coordinates,
  bearingDegrees,
  aligned,
  zoom,
  tilesEnabled,
  text,
  onZoomChange,
  onEnableTiles,
  onDropPin,
}: QiblaMapViewProps) {
  const [tileError, setTileError] = useState(false);
  const tiles = useMemo(() => qiblaMapTiles(coordinates, zoom), [coordinates, zoom]);
  const endpoint = qiblaBearingRayEndpoint(bearingDegrees, 100, 100);

  const dropPin = (event: MouseEvent<HTMLDivElement>) => {
    if (!tilesEnabled) return;
    const rectangle = event.currentTarget.getBoundingClientRect();
    onDropPin(
      coordinatesForMapPoint(coordinates, zoom, rectangle.width, rectangle.height, {
        x: event.clientX - rectangle.left,
        y: event.clientY - rectangle.top,
      }),
    );
  };

  return (
    <div className="qibla-map-shell">
      <div className="qibla-map-toolbar" aria-label={text.mapView}>
        <div className="qibla-map-zoom">
          <button
            type="button"
            aria-label={text.zoomOut}
            onClick={() => {
              setTileError(false);
              onZoomChange(zoom - 1);
            }}
          >
            −
          </button>
          <span aria-hidden="true">{zoom}</span>
          <button
            type="button"
            aria-label={text.zoomIn}
            onClick={() => {
              setTileError(false);
              onZoomChange(zoom + 1);
            }}
          >
            +
          </button>
        </div>
      </div>

      <div
        className={`qibla-map-viewport${aligned ? ' is-aligned' : ''}`}
        onClick={dropPin}
        role="group"
        aria-label={text.dropPin}
      >
        {tilesEnabled ? (
          <>
            <div className="qibla-map-tiles" aria-hidden="true">
              {tiles.map((tile) => (
                <img
                  key={tile.key}
                  className="qibla-map-tile"
                  src={qiblaMapTileUrl(tile.zoom, tile.x, tile.y)}
                  alt=""
                  draggable={false}
                  style={{
                    left: `calc(50% + ${String(tile.offsetX)}px)`,
                    top: `calc(50% + ${String(tile.offsetY)}px)`,
                  }}
                  onError={() => {
                    setTileError(true);
                  }}
                />
              ))}
            </div>
            <svg
              className="qibla-map-bearing-overlay"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line x1="50" y1="50" x2={endpoint.x} y2={endpoint.y} />
            </svg>
            <div className="qibla-map-user-marker" aria-hidden="true">
              <span className="qibla-map-marker-dot" />
            </div>
            <div className="qibla-map-kaaba-chip" aria-hidden="true">
              ◼
            </div>
          </>
        ) : (
          <div className="qibla-map-consent">
            <strong>{text.mapPrivacyTitle}</strong>
            <p>{text.mapPrivacyBody}</p>
            <button type="button" onClick={onEnableTiles}>
              {text.loadMap}
            </button>
          </div>
        )}
      </div>

      {tilesEnabled && (
        <>
          <p className="qibla-map-drop-help">{text.dropPin}</p>
          {tileError && (
            <p className="inline-message" role="status">
              {text.mapUnavailable}
            </p>
          )}
          <p className="qibla-map-attribution">
            <a href={qiblaMapAttributionUrl()} target="_blank" rel="noopener noreferrer">
              {text.mapAttributionStandard}
            </a>
          </p>
        </>
      )}
    </div>
  );
}
