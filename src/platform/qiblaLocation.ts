import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import { createCoordinates, type Coordinates } from '../domain/coordinates';

export type QiblaLocationFailureReason =
  'permission-denied' | 'unavailable' | 'timeout' | 'unsupported' | 'unknown';

export type QiblaLocationSource =
  | 'native-high-accuracy'
  | 'native-network-fallback'
  | 'browser-high-accuracy'
  | 'browser-network-fallback'
  | 'native-live'
  | 'browser-live';

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
  if (Capacitor.isNativePlatform()) {
    return requestNativeLocation();
  }
  return requestBrowserLocation();
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

async function requestNativeLocation(): Promise<QiblaLocationResult> {
  try {
    let permission = await Geolocation.checkPermissions();
    if (permission.location !== 'granted') {
      permission = await Geolocation.requestPermissions();
    }
    if (permission.location !== 'granted') {
      return { ok: false, reason: 'permission-denied' };
    }
  } catch (error) {
    return { ok: false, reason: nativeFailureReason(error) };
  }

  const highAccuracy = await nativePosition(true, 'native-high-accuracy');
  if (highAccuracy.ok || isPermissionDeniedResult(highAccuracy)) {
    return highAccuracy;
  }
  return nativePosition(false, 'native-network-fallback');
}

async function nativePosition(
  enableHighAccuracy: boolean,
  source: Extract<QiblaLocationSource, 'native-high-accuracy' | 'native-network-fallback'>,
): Promise<QiblaLocationResult> {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy,
      timeout: enableHighAccuracy ? 12_000 : 10_000,
      maximumAge: enableHighAccuracy ? 0 : 60_000,
    });
    return {
      ok: true,
      location: {
        coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
        source,
      },
    };
  } catch (error) {
    return { ok: false, reason: nativeFailureReason(error) };
  }
}

async function requestBrowserLocation(): Promise<QiblaLocationResult> {
  const browserGeolocation = getBrowserGeolocation();
  if (browserGeolocation === null) {
    return { ok: false, reason: 'unsupported' };
  }

  const highAccuracy = await browserPosition(
    browserGeolocation,
    true,
    'browser-high-accuracy',
  );
  if (highAccuracy.ok || isPermissionDeniedResult(highAccuracy)) {
    return highAccuracy;
  }
  return browserPosition(browserGeolocation, false, 'browser-network-fallback');
}

function browserPosition(
  geolocation: Geolocation,
  enableHighAccuracy: boolean,
  source: Extract<QiblaLocationSource, 'browser-high-accuracy' | 'browser-network-fallback'>,
): Promise<QiblaLocationResult> {
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          location: {
            coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
            source,
          },
        });
      },
      (error) => {
        resolve({ ok: false, reason: browserFailureReason(error) });
      },
      {
        enableHighAccuracy,
        timeout: enableHighAccuracy ? 12_000 : 10_000,
        maximumAge: enableHighAccuracy ? 0 : 60_000,
      },
    );
  });
}

function getBrowserGeolocation(): Geolocation | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Partial<Navigator>).geolocation ?? null;
}

function isPermissionDeniedResult(result: QiblaLocationResult): boolean {
  return result.ok ? false : result.reason === 'permission-denied';
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
