import { createCoordinates, type Coordinates } from './coordinates';

export const KAABA_COORDINATES: Coordinates = createCoordinates(21.4225, 39.8262);

export interface QiblaBearing {
  readonly degreesFromTrueNorth: number;
  readonly destination: Coordinates;
}

export function calculateQiblaBearing(coordinates: Coordinates): QiblaBearing {
  const origin = createCoordinates(coordinates.latitude, coordinates.longitude);

  if (
    origin.latitude === KAABA_COORDINATES.latitude &&
    origin.longitude === KAABA_COORDINATES.longitude
  ) {
    return Object.freeze({
      degreesFromTrueNorth: 0,
      destination: KAABA_COORDINATES,
    });
  }

  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(KAABA_COORDINATES.latitude);
  const longitudeDelta = toRadians(KAABA_COORDINATES.longitude - origin.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(destinationLatitude);
  const x =
    Math.cos(originLatitude) * Math.sin(destinationLatitude) -
    Math.sin(originLatitude) * Math.cos(destinationLatitude) * Math.cos(longitudeDelta);

  const degreesFromTrueNorth = normalizeDegrees(toDegrees(Math.atan2(y, x)));

  return Object.freeze({
    degreesFromTrueNorth,
    destination: KAABA_COORDINATES,
  });
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
