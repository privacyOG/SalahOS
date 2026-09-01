import type { Coordinates } from './coordinates';

export const MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS = 150;

export function greatCircleDistanceKilometers(
  origin: Coordinates,
  destination: Coordinates,
): number {
  const radians = Math.PI / 180;
  const originLatitude = origin.latitude * radians;
  const destinationLatitude = destination.latitude * radians;
  const cosine =
    Math.sin(originLatitude) * Math.sin(destinationLatitude) +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.cos((destination.longitude - origin.longitude) * radians);
  return 6_371.0088 * Math.acos(Math.max(-1, Math.min(1, cosine)));
}
