import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import { createCoordinates, type Coordinates } from '../domain/coordinates';
import {
  requestCurrentLocation,
  type CurrentLocationSource,
  type LocationFailureReason,
} from './currentLocation';

export type QiblaLocationFailureReason = LocationFailureReason;

export type QiblaLocationSource = CurrentLocationSource | 'native-live' | 'browser-live';

export interface QiblaLocationFix {
  readonly coordinates: Coordinates;
  readonly source: QiblaLocationSource;
}

export type QiblaLocationResult =
  | { readonly ok: true; readonly location: QiblaLocationFix }
  | { readonly ok: false; readonly reason: QiblaLocationFailureReason };

export interface QiblaLocationWatch {
  readonly stop: () => Promise<void>;
}

export async function requestQiblaLocation(): Promise<QiblaLocationResult> {
  const result = await requestCurrentLocation();
  if (!result.ok) return result;
  return {
    ok: true,
    location: {
      coordinates: result.location.coordinates,
      source: result.location.source,
    },
  };
}

export async function startQiblaLocationWatch(
  onLocation: (fix: QiblaLocationFix) => void,
  onFailure: (reason: QiblaLocationFailureReason) => void,
): Promise<QiblaLocationWatch> {
  if (Capacitor.isNativePlatform()) {
    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 5_000,
        },
        (position, error) => {
          if (position !== null) {
            onLocation({
              coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
              source: 'native-live',
            });
            return;
          }
          onFailure(nativeFailureReason(error));
        },
      );
      return Object.freeze({
        stop: async () => {
          await Geolocation.clearWatch({ id });
        },
      });
    } catch (error) {
      onFailure(nativeFailureReason(error));
      return stoppedWatch();
    }
  }

  const browserGeolocation = getBrowserGeolocation();
  if (browserGeolocation === null) {
    onFailure('unsupported');
    return stoppedWatch();
  }

  try {
    const id = browserGeolocation.watchPosition(
      (position) => {
        onLocation({
          coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
          source: 'browser-live',
        });
      },
      (error) => {
        onFailure(browserFailureReason(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 5_000,
      },
    );

    return Object.freeze({
      stop: () => {
        browserGeolocation.clearWatch(id);
        return Promise.resolve();
      },
    });
  } catch {
    onFailure('unknown');
    return stoppedWatch();
  }
}

function getBrowserGeolocation(): Geolocation | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Partial<Navigator>).geolocation ?? null;
}

function browserFailureReason(error: GeolocationPositionError): QiblaLocationFailureReason {
  if (error.code === error.PERMISSION_DENIED) return 'permission-denied';
  if (error.code === error.POSITION_UNAVAILABLE) return 'unavailable';
  if (error.code === error.TIMEOUT) return 'timeout';
  return 'unknown';
}

function nativeFailureReason(error: unknown): QiblaLocationFailureReason {
  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes('permission') || normalized.includes('denied')) {
      return 'permission-denied';
    }
    if (normalized.includes('timeout')) return 'timeout';
    if (
      normalized.includes('unavailable') ||
      normalized.includes('location services') ||
      normalized.includes('position')
    ) {
      return 'unavailable';
    }
  }
  return 'unknown';
}

function stoppedWatch(): QiblaLocationWatch {
  return Object.freeze({ stop: () => Promise.resolve() });
}
