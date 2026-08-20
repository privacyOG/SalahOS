import { createCoordinates, type Coordinates } from './coordinates';
import { normalizeBearing, signedTurnToQibla } from './qiblaGuidance';

export const QIBLA_ALIGNMENT_TOLERANCE_DEGREES = 2;
export const QIBLA_LOCATION_RECALCULATION_METERS = 100;

const EARTH_RADIUS_METERS = 6_371_008.8;

export function applyMagneticDeclination(
  magneticHeadingDegrees: number,
  declinationDegrees: number,
): number {
  if (!Number.isFinite(declinationDegrees)) {
    throw new RangeError('Magnetic declination must be finite');
  }
  return normalizeBearing(magneticHeadingDegrees + declinationDegrees);
}

export function compensateHeadingForScreenOrientation(
  headingDegrees: number,
  screenOrientationDegrees: number,
): number {
  if (!Number.isFinite(screenOrientationDegrees)) {
    throw new RangeError('Screen orientation angle must be finite');
  }
  return normalizeBearing(headingDegrees + screenOrientationDegrees);
}

export function smoothCircularHeading(
  previousHeadingDegrees: number | null,
  nextHeadingDegrees: number,
  smoothingFactor = 0.22,
): number {
  const next = normalizeBearing(nextHeadingDegrees);
  if (previousHeadingDegrees === null) {
    return next;
  }
  if (!Number.isFinite(smoothingFactor) || smoothingFactor <= 0 || smoothingFactor > 1) {
    throw new RangeError('Heading smoothing factor must be greater than 0 and at most 1');
  }

  const previous = normalizeBearing(previousHeadingDegrees);
  const clockwiseDelta = normalizeBearing(next - previous);
  const shortestDelta = clockwiseDelta > 180 ? clockwiseDelta - 360 : clockwiseDelta;
  return normalizeBearing(previous + shortestDelta * smoothingFactor);
}

export function isQiblaAligned(
  qiblaBearingDegrees: number,
  trueHeadingDegrees: number,
  toleranceDegrees = QIBLA_ALIGNMENT_TOLERANCE_DEGREES,
): boolean {
  if (!Number.isFinite(toleranceDegrees) || toleranceDegrees < 0 || toleranceDegrees > 180) {
    throw new RangeError('Qiblah alignment tolerance must be from 0 through 180 degrees');
  }
  return Math.abs(signedTurnToQibla(qiblaBearingDegrees, trueHeadingDegrees)) <= toleranceDegrees;
}

export function haversineDistanceMeters(left: Coordinates, right: Coordinates): number {
  const from = createCoordinates(left.latitude, left.longitude);
  const to = createCoordinates(right.latitude, right.longitude);
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const leftLatitude = toRadians(from.latitude);
  const rightLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_METERS * centralAngle;
}

export function shouldRecalculateQibla(
  previous: Coordinates,
  next: Coordinates,
  thresholdMeters = QIBLA_LOCATION_RECALCULATION_METERS,
): boolean {
  if (!Number.isFinite(thresholdMeters) || thresholdMeters <= 0) {
    throw new RangeError('Qiblah location threshold must be positive');
  }
  return haversineDistanceMeters(previous, next) >= thresholdMeters;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
