import { createCoordinates } from '../domain/coordinates';
import type { Coordinates } from '../domain/coordinates';

export type BrowserLocationFailureReason =
  'unsupported' | 'permission-denied' | 'unavailable' | 'timeout' | 'unknown';

export interface BrowserLocationFix {
  readonly coordinates: Coordinates;
  readonly accuracyMetres: number;
  readonly capturedAt: Date;
  readonly source: 'browser';
}

export type BrowserLocationResult =
  | { readonly ok: true; readonly location: BrowserLocationFix }
  | { readonly ok: false; readonly reason: BrowserLocationFailureReason };

export interface BrowserLocationOptions {
  readonly enableHighAccuracy?: boolean;
  readonly timeoutMilliseconds?: number;
  readonly maximumAgeMilliseconds?: number;
}

const defaultOptions: Required<BrowserLocationOptions> = Object.freeze({
  enableHighAccuracy: false,
  timeoutMilliseconds: 10_000,
  maximumAgeMilliseconds: 300_000,
});

function failureReason(error: GeolocationPositionError): BrowserLocationFailureReason {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'permission-denied';
    case error.POSITION_UNAVAILABLE:
      return 'unavailable';
    case error.TIMEOUT:
      return 'timeout';
    default:
      return 'unknown';
  }
}

/**
 * Request one current browser location fix. SalahOS never starts a continuous
 * location watch here; callers explicitly invoke this function when a refresh
 * is required.
 */
export function requestBrowserLocation(
  geolocation: Geolocation | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.geolocation,
  options: BrowserLocationOptions = {},
): Promise<BrowserLocationResult> {
  if (geolocation === undefined) {
    return Promise.resolve({ ok: false, reason: 'unsupported' });
  }

  const resolvedOptions = { ...defaultOptions, ...options };

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          location: {
            coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
            accuracyMetres: position.coords.accuracy,
            capturedAt: new Date(position.timestamp),
            source: 'browser',
          },
        });
      },
      (error) => {
        resolve({ ok: false, reason: failureReason(error) });
      },
      {
        enableHighAccuracy: resolvedOptions.enableHighAccuracy,
        timeout: resolvedOptions.timeoutMilliseconds,
        maximumAge: resolvedOptions.maximumAgeMilliseconds,
      },
    );
  });
}
