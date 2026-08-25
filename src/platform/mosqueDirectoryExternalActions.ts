import type { Coordinates } from '../domain/coordinates';

const GOOGLE_MAPS_DIRECTIONS_URL = 'https://www.google.com/maps/dir/';

export function mosqueDirectionsUrl(coordinates: Coordinates): string {
  const url = new URL(GOOGLE_MAPS_DIRECTIONS_URL);
  url.searchParams.set('api', '1');
  url.searchParams.set(
    'destination',
    `${String(coordinates.latitude)},${String(coordinates.longitude)}`,
  );
  return url.toString();
}
