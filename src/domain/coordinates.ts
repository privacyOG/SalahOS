export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export function createCoordinates(latitude: number, longitude: number): Coordinates {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError('Latitude must be between -90 and 90 degrees');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError('Longitude must be between -180 and 180 degrees');
  }

  return Object.freeze({ latitude, longitude });
}
