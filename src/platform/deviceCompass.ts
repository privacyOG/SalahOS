import { Compass, type Heading } from '@capawesome/capacitor-compass';
import { Capacitor } from '@capacitor/core';
import { calculateMagVar } from 'magvar';

import type { Coordinates } from '../domain/coordinates';
import {
  applyMagneticDeclination,
  compensateHeadingForScreenOrientation,
  smoothCircularHeading,
} from '../domain/qiblaFinder';

export type CompassPermissionState = 'granted' | 'denied' | 'not-required' | 'unsupported';

export interface CompassHeadingSample {
  readonly headingDegrees: number;
  readonly accuracyDegrees: number | null;
  readonly source: 'webkit-compass' | 'absolute-orientation';
}

export interface TrueHeadingSample {
  readonly headingDegrees: number;
  readonly accuracyDegrees: number | null;
  readonly source:
    'native-true' | 'native-magnetic-wmm' | 'webkit-magnetic-wmm' | 'absolute-orientation';
  readonly reference: 'true-north';
}

export interface CompassOrientationEventLike {
  readonly alpha: number | null;
  readonly absolute?: boolean;
  readonly webkitCompassHeading?: number;
  readonly webkitCompassAccuracy?: number;
}

export interface CompassEventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface TrueHeadingSession {
  readonly state: 'active' | 'denied' | 'unsupported' | 'error';
  readonly stop: () => Promise<void>;
}

type PermissionRequester = (() => Promise<'granted' | 'denied'>) | undefined;
type HeadingCoordinatesSource = Coordinates | (() => Coordinates);
type PrimedCompassPermission = Extract<CompassPermissionState, 'granted' | 'not-required'>;

let primedBrowserCompassPermission: PrimedCompassPermission | null = null;

function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function compassHeadingFromOrientation(
  event: CompassOrientationEventLike,
): CompassHeadingSample | null {
  if (Number.isFinite(event.webkitCompassHeading)) {
    const accuracy = Number.isFinite(event.webkitCompassAccuracy)
      ? Math.abs(Number(event.webkitCompassAccuracy))
      : null;
    return Object.freeze({
      headingDegrees: normalizeHeading(Number(event.webkitCompassHeading)),
      accuracyDegrees: accuracy,
      source: 'webkit-compass',
    });
  }

  if (event.absolute === true && Number.isFinite(event.alpha)) {
    return Object.freeze({
      headingDegrees: normalizeHeading(360 - Number(event.alpha)),
      accuracyDegrees: null,
      source: 'absolute-orientation',
    });
  }

  return null;
}

export async function requestCompassPermission(
  requester: PermissionRequester = defaultPermissionRequester(),
): Promise<CompassPermissionState> {
  if (Capacitor.isNativePlatform()) {
    return 'not-required';
  }
  if (typeof DeviceOrientationEvent === 'undefined') {
    return 'unsupported';
  }
  if (requester === undefined) {
    primedBrowserCompassPermission = 'not-required';
    return 'not-required';
  }

  try {
    const permission = (await requester()) === 'granted' ? 'granted' : 'denied';
    if (permission === 'granted') {
      primedBrowserCompassPermission = permission;
    }
    return permission;
  } catch {
    return 'denied';
  }
}

export function installCompassHeadingListener(
  target: CompassEventTarget,
  onHeading: (sample: CompassHeadingSample) => void,
): () => void {
  const listener: EventListener = (rawEvent) => {
    const event = rawEvent as Event & CompassOrientationEventLike;
    const sample = compassHeadingFromOrientation(event);
    if (sample !== null) {
      onHeading(sample);
    }
  };

  target.addEventListener('deviceorientationabsolute', listener);
  target.addEventListener('deviceorientation', listener);
  return () => {
    target.removeEventListener('deviceorientationabsolute', listener);
    target.removeEventListener('deviceorientation', listener);
  };
}

export function calculateMagneticDeclination(
  coordinates: Coordinates,
  date: Date = new Date(),
): number {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError('Magnetic-declination date must be valid');
  }
  const julianDays = date.getTime() / 86_400_000 + 2_440_587.5;
  return calculateMagVar(julianDays, coordinates.latitude, coordinates.longitude, 0);
}

export function currentScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  const screenAngle = window.screen.orientation.angle;
  if (Number.isFinite(screenAngle)) return screenAngle;
  const legacyAngle = Reflect.get(window, 'orientation') as unknown;
  return typeof legacyAngle === 'number' && Number.isFinite(legacyAngle) ? legacyAngle : 0;
}

export function trueHeadingFromNative(
  reading: Heading,
  coordinates: Coordinates,
  screenOrientationDegrees: number,
  date: Date = new Date(),
): TrueHeadingSample {
  const hasTrueHeading = Number.isFinite(reading.trueHeading) && Number(reading.trueHeading) >= 0;
  const northReferencedHeading = hasTrueHeading
    ? Number(reading.trueHeading)
    : applyMagneticDeclination(
        reading.magneticHeading,
        calculateMagneticDeclination(coordinates, date),
      );
  const accuracy =
    Number.isFinite(reading.accuracy) && Number(reading.accuracy) >= 0
      ? Number(reading.accuracy)
      : null;

  return Object.freeze({
    headingDegrees: compensateHeadingForScreenOrientation(
      northReferencedHeading,
      screenOrientationDegrees,
    ),
    accuracyDegrees: accuracy,
    source: hasTrueHeading ? 'native-true' : 'native-magnetic-wmm',
    reference: 'true-north',
  });
}

export function trueHeadingFromBrowser(
  reading: CompassHeadingSample,
  coordinates: Coordinates,
  screenOrientationDegrees: number,
  date: Date = new Date(),
): TrueHeadingSample {
  const northReferencedHeading =
    reading.source === 'webkit-compass'
      ? applyMagneticDeclination(
          reading.headingDegrees,
          calculateMagneticDeclination(coordinates, date),
        )
      : reading.headingDegrees;

  return Object.freeze({
    headingDegrees: compensateHeadingForScreenOrientation(
      northReferencedHeading,
      screenOrientationDegrees,
    ),
    accuracyDegrees: reading.accuracyDegrees,
    source: reading.source === 'webkit-compass' ? 'webkit-magnetic-wmm' : 'absolute-orientation',
    reference: 'true-north',
  });
}

export async function startTrueHeadingUpdates(
  coordinates: HeadingCoordinatesSource,
  onHeading: (sample: TrueHeadingSample) => void,
): Promise<TrueHeadingSession> {
  if (Capacitor.isNativePlatform()) {
    return startNativeHeadingUpdates(coordinates, onHeading);
  }
  return startBrowserHeadingUpdates(coordinates, onHeading);
}

async function startNativeHeadingUpdates(
  coordinates: HeadingCoordinatesSource,
  onHeading: (sample: TrueHeadingSample) => void,
): Promise<TrueHeadingSession> {
  try {
    const { available } = await Compass.isAvailable();
    if (!available) {
      return stoppedSession('unsupported');
    }

    let previousHeading: number | null = null;
    const listener = await Compass.addListener('headingChange', (reading) => {
      const sample = trueHeadingFromNative(
        reading,
        resolveHeadingCoordinates(coordinates),
        currentScreenOrientationAngle(),
      );
      const smoothed = smoothCircularHeading(previousHeading, sample.headingDegrees);
      previousHeading = smoothed;
      onHeading(Object.freeze({ ...sample, headingDegrees: smoothed }));
    });
    await Compass.startHeadingUpdates();

    return Object.freeze({
      state: 'active' as const,
      stop: async () => {
        await listener.remove();
        await Compass.stopHeadingUpdates();
      },
    });
  } catch {
    return stoppedSession('error');
  }
}

async function startBrowserHeadingUpdates(
  coordinates: HeadingCoordinatesSource,
  onHeading: (sample: TrueHeadingSample) => void,
): Promise<TrueHeadingSession> {
  const permission = primedBrowserCompassPermission ?? (await requestCompassPermission());
  if (permission === 'denied') return stoppedSession('denied');
  if (permission === 'unsupported') return stoppedSession('unsupported');

  let previousHeading: number | null = null;
  const remove = installCompassHeadingListener(window, (reading) => {
    const sample = trueHeadingFromBrowser(
      reading,
      resolveHeadingCoordinates(coordinates),
      currentScreenOrientationAngle(),
    );
    const smoothed = smoothCircularHeading(previousHeading, sample.headingDegrees);
    previousHeading = smoothed;
    onHeading(Object.freeze({ ...sample, headingDegrees: smoothed }));
  });

  return Object.freeze({
    state: 'active' as const,
    stop: () => {
      remove();
      return Promise.resolve();
    },
  });
}

function resolveHeadingCoordinates(source: HeadingCoordinatesSource): Coordinates {
  return typeof source === 'function' ? source() : source;
}

function stoppedSession(state: Exclude<TrueHeadingSession['state'], 'active'>): TrueHeadingSession {
  return Object.freeze({ state, stop: () => Promise.resolve() });
}

function defaultPermissionRequester(): PermissionRequester {
  if (typeof DeviceOrientationEvent === 'undefined') {
    return undefined;
  }
  const constructor = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  return constructor.requestPermission?.bind(constructor);
}
