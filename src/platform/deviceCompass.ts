export type CompassPermissionState = 'granted' | 'denied' | 'not-required' | 'unsupported';

export interface CompassHeadingSample {
  readonly headingDegrees: number;
  readonly accuracyDegrees: number | null;
  readonly source: 'webkit-compass' | 'absolute-orientation';
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

type PermissionRequester = (() => Promise<'granted' | 'denied'>) | undefined;

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
  if (typeof DeviceOrientationEvent === 'undefined') {
    return 'unsupported';
  }
  if (requester === undefined) {
    return 'not-required';
  }

  try {
    return (await requester()) === 'granted' ? 'granted' : 'denied';
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

function defaultPermissionRequester(): PermissionRequester {
  if (typeof DeviceOrientationEvent === 'undefined') {
    return undefined;
  }
  const constructor = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  return constructor.requestPermission?.bind(constructor);
}
