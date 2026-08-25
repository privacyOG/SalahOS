import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

import { createCoordinates } from '../domain/coordinates';
import type { Coordinates } from '../domain/coordinates';
import {
  requestBrowserLocation,
  type BrowserLocationFailureReason,
  type BrowserLocationOptions,
  type BrowserLocationResult,
  type BrowserLocationSource,
} from './browserGeolocation';

export type LocationFailureReason = BrowserLocationFailureReason;
export type CurrentLocationSource =
  BrowserLocationSource | 'native-gps' | 'native-network-approximate';

export interface CurrentLocationFix {
  readonly coordinates: Coordinates;
  readonly source: CurrentLocationSource;
  readonly accuracyMeters: number | null;
  readonly capturedAtIso: string;
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
    readonly accuracy?: number;
  };
  readonly timestamp?: number;
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
  readonly requestBrowser: (options: BrowserLocationOptions) => Promise<BrowserLocationResult>;
}

const defaultDependencies: CurrentLocationDependencies = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  checkNativePermissions: () => Geolocation.checkPermissions(),
  requestNativePermissions: () => Geolocation.requestPermissions(),
  getNativeCurrentPosition: (options) => Geolocation.getCurrentPosition(options),
  requestBrowser: (options) => requestBrowserLocation(undefined, options),
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

function terminalFailure(reason: LocationFailureReason): boolean {
  return reason === 'permission-denied' || reason === 'unsupported';
}

function normalizedAccuracy(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizedTimestamp(value: number | undefined): string {
  if (typeof value === 'number') {
    const instant = new Date(value);
    if (Number.isFinite(instant.getTime())) return instant.toISOString();
  }
  return new Date().toISOString();
}

async function requestNativePosition(
  dependencies: CurrentLocationDependencies,
  enableHighAccuracy: boolean,
): Promise<CurrentLocationResult> {
  try {
    const position = await dependencies.getNativeCurrentPosition({
      enableHighAccuracy,
      timeout: enableHighAccuracy ? 12_000 : 10_000,
      maximumAge: enableHighAccuracy ? 0 : 60_000,
    });
    return {
      ok: true,
      location: {
        coordinates: createCoordinates(position.coords.latitude, position.coords.longitude),
        source: enableHighAccuracy ? 'native-gps' : 'native-network-approximate',
        accuracyMeters: normalizedAccuracy(position.coords.accuracy),
        capturedAtIso: normalizedTimestamp(position.timestamp),
      },
    };
  } catch (error) {
    return { ok: false, reason: nativeFailureReason(error) };
  }
}

async function requestBrowserPosition(
  dependencies: CurrentLocationDependencies,
  enableHighAccuracy: boolean,
): Promise<CurrentLocationResult> {
  return dependencies.requestBrowser({
    enableHighAccuracy,
    timeoutMilliseconds: enableHighAccuracy ? 12_000 : 10_000,
    maximumAgeMilliseconds: enableHighAccuracy ? 0 : 60_000,
  });
}

/**
 * Request the best current foreground location from the active platform.
 * SalahOS first asks the operating system for a precise fix, then falls back to
 * an approximate/network-assisted fix when precision is unavailable. Only
 * coordinates, horizontal accuracy and fix time are retained.
 */
export async function requestCurrentLocation(
  dependencies: CurrentLocationDependencies = defaultDependencies,
): Promise<CurrentLocationResult> {
  if (!dependencies.isNativePlatform()) {
    const precise = await requestBrowserPosition(dependencies, true);
    if (precise.ok || terminalFailure(precise.reason)) return precise;
    return requestBrowserPosition(dependencies, false);
  }

  try {
    let permission = await dependencies.checkNativePermissions();
    if (!permissionGranted(permission)) {
      permission = await dependencies.requestNativePermissions();
    }
    if (!permissionGranted(permission)) {
      return { ok: false, reason: 'permission-denied' };
    }
  } catch (error) {
    return { ok: false, reason: nativeFailureReason(error) };
  }

  const precise = await requestNativePosition(dependencies, true);
  if (precise.ok || terminalFailure(precise.reason)) return precise;
  return requestNativePosition(dependencies, false);
}
