import { useEffect, useMemo, useRef, useState } from 'react';

import type { Coordinates } from '../domain/coordinates';
import { searchLocations, type LocationSearchResult } from '../domain/locationSearch';
import { calculateQiblaBearing } from '../domain/qibla';
import { isQiblaAligned, shouldRecalculateQibla } from '../domain/qiblaFinder';
import { clampQiblaMapZoom } from '../domain/qiblaMap';
import { signedTurnToQibla } from '../domain/qiblaGuidance';
import { localeDirection, localeTag } from '../i18n/i18n';
import { qiblaFinderCopy } from '../i18n/qiblaFinderTranslations';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  startTrueHeadingUpdates,
  type TrueHeadingSample,
  type TrueHeadingSession,
} from '../platform/deviceCompass';
import {
  requestQiblaLocation,
  startQiblaLocationWatch,
  type QiblaLocationFailureReason,
  type QiblaLocationWatch,
} from '../platform/qiblaLocation';
import { triggerQiblaAlignmentHaptic } from '../platform/qiblaHaptics';
import { loadSavedLocations, type SavedLocation } from '../platform/savedLocations';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { QiblaCompassDial } from './QiblaCompassDial';
import { QiblaMapView } from './QiblaMapView';
import { smartDisplayModeRequested } from './SmartDisplay';

type FinderView = 'compass' | 'map';
type FinderLocationSource = 'saved' | 'live' | 'city' | 'pin';
type CompassState = 'idle' | 'starting' | 'active' | 'denied' | 'unsupported' | 'error';
type LocationState = 'idle' | 'locating' | 'live' | 'error';

interface FinderLocation {
  readonly coordinates: Coordinates;
  readonly source: FinderLocationSource;
  readonly label: string | null;
}

function readInitialState(): {
  readonly locale: Locale;
  readonly location: FinderLocation | null;
  readonly savedLocations: readonly SavedLocation[];
} {
  const storage = getApplicationStorage();
  const settings = loadPersistedSettings(storage);
  return {
    locale: settings.locale,
    location:
      settings.location === null
        ? null
        : {
            coordinates: settings.location.coordinates,
            source: 'saved',
            label: null,
          },
    savedLocations: loadSavedLocations(storage),
  };
}

export function QiblaFinder() {
  const initial = useMemo(readInitialState, []);
  const [locale, setLocale] = useState(initial.locale);
  const [location, setLocation] = useState<FinderLocation | null>(initial.location);
  const [savedLocations, setSavedLocations] = useState(initial.savedLocations);
  const [view, setView] = useState<FinderView>('compass');
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [locationError, setLocationError] = useState<QiblaLocationFailureReason | null>(null);
  const [compassState, setCompassState] = useState<CompassState>('idle');
  const [heading, setHeading] = useState<TrueHeadingSample | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapZoom, setMapZoom] = useState(15);
  const [mapTilesEnabled, setMapTilesEnabled] = useState(false);
  const compassSessionRef = useRef<TrueHeadingSession | null>(null);
  const locationWatchRef = useRef<QiblaLocationWatch | null>(null);
  const headingTimerRef = useRef<number | null>(null);
  const receivedHeadingRef = useRef(false);
  const alignedRef = useRef(false);
  const locationRef = useRef<FinderLocation | null>(location);
  locationRef.current = location;
  const text = qiblaFinderCopy[locale];
  const qiblaCoordinates = location?.coordinates ?? null;
  const qibla = qiblaCoordinates === null ? null : calculateQiblaBearing(qiblaCoordinates);
  const turn =
    qibla === null || heading === null
      ? null
      : signedTurnToQibla(qibla.degreesFromTrueNorth, heading.headingDegrees);
  const aligned =
    qibla !== null &&
    heading !== null &&
    isQiblaAligned(qibla.degreesFromTrueNorth, heading.headingDegrees);
  const searchResults = useMemo(
    () => searchLocations(searchQuery, { locale: localeTag(locale), limit: 6 }),
    [locale, searchQuery],
  );

  useEffect(() => {
    if (aligned && !alignedRef.current) {
      void triggerQiblaAlignmentHaptic();
    }
    alignedRef.current = aligned;
  }, [aligned]);

  useEffect(() => {
    const refreshSettings = () => {
      const storage = getApplicationStorage();
      const settings = loadPersistedSettings(storage);
      setLocale(settings.locale);
      setSavedLocations(loadSavedLocations(storage));
      if (
        settings.location !== null &&
        location?.source === 'saved' &&
        location.label === null
      ) {
        setLocation({
          coordinates: settings.location.coordinates,
          source: 'saved',
          label: null,
        });
      }
    };
    window.addEventListener('focus', refreshSettings);
    return () => {
      window.removeEventListener('focus', refreshSettings);
    };
  }, [location?.label, location?.source]);

  useEffect(
    () => () => {
      clearHeadingTimer(headingTimerRef);
      void compassSessionRef.current?.stop();
      void locationWatchRef.current?.stop();
    },
    [],
  );

  if (smartDisplayModeRequested(window.location.search)) {
    return null;
  }

  const stopCompass = async () => {
    clearHeadingTimer(headingTimerRef);
    await compassSessionRef.current?.stop();
    compassSessionRef.current = null;
    receivedHeadingRef.current = false;
    setHeading(null);
    setCompassState('idle');
    alignedRef.current = false;
  };

  const startCompass = async () => {
    if (location === null) return;
    clearHeadingTimer(headingTimerRef);
    await compassSessionRef.current?.stop();
    compassSessionRef.current = null;
    receivedHeadingRef.current = false;
    setHeading(null);
    setCompassState('starting');
    alignedRef.current = false;

    const startingCoordinates = location.coordinates;
    const session = await startTrueHeadingUpdates(
      () => locationRef.current?.coordinates ?? startingCoordinates,
      (sample) => {
        receivedHeadingRef.current = true;
        clearHeadingTimer(headingTimerRef);
        setHeading(sample);
        setCompassState('active');
      },
    );
    compassSessionRef.current = session;
    if (session.state !== 'active') {
      setCompassState(session.state);
      return;
    }

    setCompassState('active');
    headingTimerRef.current = window.setTimeout(() => {
      if (!receivedHeadingRef.current) {
        setCompassState('unsupported');
        void session.stop();
        compassSessionRef.current = null;
      }
    }, 4_000);
  };

  const stopLiveLocation = async () => {
    await locationWatchRef.current?.stop();
    locationWatchRef.current = null;
    setLocationState('idle');
  };

  const useCurrentPosition = async () => {
    await stopLiveLocation();
    setLocationState('locating');
    setLocationError(null);
    const result = await requestQiblaLocation();
    if (!result.ok) {
      setLocationError(result.reason);
      setLocationState('error');
      return;
    }

    setLocation({
      coordinates: result.location.coordinates,
      source: 'live',
      label: null,
    });
    setLocationState('live');
    locationWatchRef.current = await startQiblaLocationWatch(
      (fix) => {
        setLocation((previous) => {
          if (previous !== null && !shouldRecalculateQibla(previous.coordinates, fix.coordinates)) {
            return previous;
          }
          return {
            coordinates: fix.coordinates,
            source: 'live',
            label: null,
          };
        });
      },
      (reason) => {
        setLocationError(reason);
      },
    );
  };

  const useCity = async (result: LocationSearchResult) => {
    await stopLiveLocation();
    setLocation({
      coordinates: result.coordinates,
      source: 'city',
      label: [result.city, ...result.countryNames].join(', '),
    });
    setLocationError(null);
    setSearchQuery(result.city);
  };

  const useSavedLocation = async (savedLocation: SavedLocation) => {
    await stopLiveLocation();
    setLocation({
      coordinates: savedLocation.coordinates,
      source: 'saved',
      label: savedLocation.label,
    });
    setLocationError(null);
  };

  const useMapPin = async (coordinates: Coordinates) => {
    await stopLiveLocation();
    setLocation({ coordinates, source: 'pin', label: null });
    setLocationError(null);
  };

  const locationSource = location === null ? null : locationSourceLabel(location.source, text);
  const locationLabel = location?.label ?? null;
  const staticCompass =
    compassState === 'unsupported' || compassState === 'denied' || compassState === 'error';
  const calibrationNeeded =
    heading?.accuracyDegrees !== null &&
    heading?.accuracyDegrees !== undefined &&
    heading.accuracyDegrees > 20;

  return (
    <section
      className="qibla-finder qibla-finder--v2"
      aria-labelledby="qibla-finder-title"
      dir={localeDirection(locale)}
    >
      <header className="qibla-finder-header">
        <div>
          <p className="qibla-finder-kicker">{text.eyebrow}</p>
          <h2 id="qibla-finder-title">{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <div className="qibla-view-switch" role="group" aria-label={text.title}>
          <button
            type="button"
            aria-pressed={view === 'compass'}
            onClick={() => {
              setView('compass');
            }}
          >
            {text.compassView}
          </button>
          <button
            type="button"
            aria-pressed={view === 'map'}
            onClick={() => {
              setView('map');
            }}
          >
            {text.mapView}
          </button>
        </div>
      </header>

      <div className="qibla-context-strip">
        <p className="qibla-finder-privacy">{text.privacy}</p>
        <div className="qibla-location-bar">
          <div>
            <strong>{locationSource ?? text.noLocation}</strong>
            {location !== null && (
              <span dir="ltr">
                {location.coordinates.latitude.toFixed(5)},{' '}
                {location.coordinates.longitude.toFixed(5)}
              </span>
            )}
            {locationLabel !== null && <bdi>{locationLabel}</bdi>}
          </div>
          <div className="qibla-location-actions">
            <button
              type="button"
              onClick={() => {
                void useCurrentPosition();
              }}
              disabled={locationState === 'locating'}
            >
              {locationState === 'locating' ? text.locating : text.currentPosition}
            </button>
            {locationState === 'live' && (
              <button
                type="button"
                onClick={() => {
                  void stopLiveLocation();
                }}
              >
                {text.stopLiveLocation}
              </button>
            )}
          </div>
        </div>
      </div>

      {locationError !== null && (
        <div className="qibla-warning" role="alert">
          <p>
            {locationError === 'permission-denied' ? text.locationDenied : text.locationUnavailable}
          </p>
          <div className="qibla-warning-actions">
            <button
              type="button"
              onClick={() => {
                void useCurrentPosition();
              }}
            >
              {text.retryLocation}
            </button>
            <a href="#qibla-manual-location">{text.manualFallback}</a>
          </div>
        </div>
      )}

      {qibla === null || qiblaCoordinates === null ? (
        <p className="inline-message qibla-empty-state">{text.noLocation}</p>
      ) : (
        <section className="qibla-primary-workspace" aria-label={text.bearing}>
          <div className="qibla-bearing-summary" dir="ltr">
            <span>{text.bearing}</span>
            <strong>{formatDegrees(qibla.degreesFromTrueNorth)}</strong>
            <small>{text.trueNorth}</small>
          </div>

          {view === 'compass' ? (
            <div className="qibla-compass-layout">
              <QiblaCompassDial
                bearingDegrees={qibla.degreesFromTrueNorth}
                headingDegrees={heading?.headingDegrees ?? null}
                aligned={aligned}
                label={text.title}
              />
              <div className="qibla-guidance-column">
                <div
                  className={`qibla-turn-guidance${aligned ? ' is-aligned' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {turn === null ? (
                    <>
                      <strong>{text.staticBearing}</strong>
                      <span>{formatDegrees(qibla.degreesFromTrueNorth)}</span>
                    </>
                  ) : aligned ? (
                    <>
                      <strong>{text.facingQiblah}</strong>
                      <span>0.0°</span>
                    </>
                  ) : (
                    <>
                      <strong>{turn < 0 ? text.turnLeft : text.turnRight}</strong>
                      <span>{formatDegrees(Math.abs(turn))}</span>
                    </>
                  )}
                </div>

                {heading !== null && (
                  <p className="qibla-heading-readout" dir="ltr">
                    {text.deviceHeading}: {formatDegrees(heading.headingDegrees)}
                  </p>
                )}

                <div className="qibla-compass-actions">
                  {compassState === 'active' ? (
                    <button
                      type="button"
                      onClick={() => {
                        void stopCompass();
                      }}
                    >
                      {text.stopCompass}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        void startCompass();
                      }}
                      disabled={compassState === 'starting'}
                    >
                      {compassState === 'starting' ? text.compassStarting : text.startCompass}
                    </button>
                  )}
                </div>

                {compassState === 'active' && heading === null && (
                  <p className="inline-message">{text.compassWaiting}</p>
                )}
                {staticCompass && (
                  <p className="inline-message">
                    {compassState === 'denied' ? text.compassDenied : text.compassUnavailable}
                  </p>
                )}
                {calibrationNeeded && (
                  <div className="qibla-calibration" role="status">
                    <strong>{text.calibrationTitle}</strong>
                    <p>{text.calibrationBody}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <QiblaMapView
              coordinates={qiblaCoordinates}
              bearingDegrees={qibla.degreesFromTrueNorth}
              aligned={aligned}
              zoom={mapZoom}
              tilesEnabled={mapTilesEnabled}
              text={text}
              onZoomChange={(zoom) => {
                setMapZoom(clampQiblaMapZoom(zoom));
              }}
              onEnableTiles={() => {
                setMapTilesEnabled(true);
              }}
              onDropPin={(coordinates) => {
                void useMapPin(coordinates);
              }}
            />
          )}
        </section>
      )}

      <details id="qibla-manual-location" className="qibla-location-tools">
        <summary>
          <strong>{text.manualFallback}</strong>
          <span>{text.searchHelp}</span>
        </summary>
        <div className="qibla-location-tools__body">
          {savedLocations.length > 0 && (
            <section className="qibla-saved-locations" aria-labelledby="qibla-saved-title">
              <h3 id="qibla-saved-title">{text.savedLocation}</h3>
              <div className="qibla-saved-locations__list">
                {savedLocations.map((savedLocation) => (
                  <button
                    type="button"
                    key={savedLocation.id}
                    onClick={() => {
                      void useSavedLocation(savedLocation);
                    }}
                  >
                    <strong>
                      <bdi>{savedLocation.label}</bdi>
                    </strong>
                    <span dir="ltr">
                      {savedLocation.coordinates.latitude.toFixed(4)},{' '}
                      {savedLocation.coordinates.longitude.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="qibla-manual-location">
            <h3>{text.manualSearch}</h3>
            <label>
              <span>{text.searchHelp}</span>
              <input
                type="search"
                value={searchQuery}
                placeholder={text.searchPlaceholder}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                autoComplete="off"
                dir="auto"
              />
            </label>
            {searchResults.length > 0 && (
              <ul className="qibla-city-results">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <div>
                      <strong>
                        <bdi>{result.city}</bdi>
                      </strong>
                      <span>
                        <bdi>{result.countryNames.join(', ')}</bdi>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void useCity(result);
                      }}
                    >
                      {text.useCity}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </details>
    </section>
  );
}

function locationSourceLabel(
  source: FinderLocationSource,
  text: (typeof qiblaFinderCopy)[Locale],
): string {
  if (source === 'live') return text.liveLocation;
  if (source === 'city') return text.cityLocation;
  if (source === 'pin') return text.pinLocation;
  return text.savedLocation;
}

function formatDegrees(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

function clearHeadingTimer(timer: { current: number | null }): void {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
    timer.current = null;
  }
}
