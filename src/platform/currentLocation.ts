import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { createCoordinates } from '../domain/coordinates';
import type { Coordinates } from '../domain/coordinates';
import { requestBrowserLocation, type BrowserLocationFailureReason } from './browserGeolocation';

export type LocationFailureReason = BrowserLocationFailureReason;

export interface CurrentLocationFix {
  readonly coordinates: Coordinates;
  readonly source: 'browser' | 'native';
}

export type CurrentLocationResult =
  | { readonly ok: true; readonly location: CurrentLocationFix }
  | { readonly ok: false; readonly reason: LocationFailureReason };

interface NativePermissionStatus {
  readonly location: string;
}

interface NativePosition {
  readonly coords: {
    readonly latitude: number;
    readonly longitude: number;
  };
}

export interface CurrentLocationDependencies {
  readonly isNativePlatform: () => boolean;
  readonly checkNativePermissions: () => Promise<NativePermissionStatus>;
  readonly requestNativePermissions: () => Promise<NativePermissionStatus>;
  readonly getNativeCurrentPosition: (options: {
    readonly enableHighAccuracy: boolean;
    readonly timeout: number;
    readonly maximumAge: number;
  }) => Promise<NativePosition>;
  readonly requestBrowser: () => Promise<CurrentLocationResult>;
}

const defaultDependencies: CurrentLocationDependencies = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  checkNativePermissions: () => Geolocation.checkPermissions(),
  requestNativePermissions: () => Geolocation.requestPermissions(),
  getNativeCurrentPosition: (options) => Geolocation.getCurrentPosition(options),
  requestBrowser: () => requestBrowserLocation(),
};

function permissionGranted(status: NativePermissionStatus): boolean {
  return status.location === 'granted';
}

function nativeFailureReason(error: unknown): LocationFailureReason {
  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes('permission') || normalized.includes('denied')) {
      return 'permission-denied';
    }
    if (normalized.includes('timeout')) {
      return 'timeout';
    }
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

/**
 * Request one current location fix from the active platform. Native shells use
 * the first-party Capacitor geolocation plugin; browsers keep the existing
 * one-shot browser adapter. Only latitude/longitude cross this boundary.
 */
export async function requestCurrentLocation(
  dependencies: CurrentLocationDependencies = defaultDependencies,
): Promise<CurrentLocationResult> {
  if (!dependencies.isNativePlatform()) {
    return dependencies.requestBrowser();
  }

  try {
    let permission = await dependencies.checkNativePermissions();
    if (!permissionGranted(permission)) {
      permission = await dependencies.requestNativePermissions();
    }
    if (!permissionGranted(permission)) {
      return { ok: false, reason: 'permission-denied' };
    }

    const position = await dependencies.getNativeCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 300_000,
    });

    return {
      ok: true,
      location: {
        coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
        source: 'native',
      },
    };
  } catch (error) {
    return { ok: false, reason: nativeFailureReason(error) };
  }
}
