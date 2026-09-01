from pathlib import Path
import re

root = Path('.')

(root / 'src/domain/greatCircleDistance.ts').write_text("""import type { Coordinates } from './coordinates';

export const MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS = 150;

export function greatCircleDistanceKilometers(origin: Coordinates, destination: Coordinates): number {
  const radians = Math.PI / 180;
  const originLatitude = origin.latitude * radians;
  const destinationLatitude = destination.latitude * radians;
  const latitudeDelta = (destination.latitude - origin.latitude) * radians;
  const longitudeDelta = (destination.longitude - origin.longitude) * radians;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 12_742.0176 * Math.asin(Math.min(1, Math.sqrt(haversine)));
}
""", encoding='utf-8')

(root / 'src/domain/greatCircleDistance.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  greatCircleDistanceKilometers,
  MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS,
} from './greatCircleDistance';

describe('great-circle distance', () => {
  it('returns zero for the same coordinates', () => {
    const sydney = createCoordinates(-33.8688, 151.2093);
    expect(greatCircleDistanceKilometers(sydney, sydney)).toBe(0);
  });

  it('matches the Sydney to Melbourne surface distance', () => {
    const distance = greatCircleDistanceKilometers(
      createCoordinates(-33.8688, 151.2093),
      createCoordinates(-37.8136, 144.9631),
    );
    expect(distance).toBeGreaterThan(710);
    expect(distance).toBeLessThan(720);
  });

  it('keeps the 150 km relocation threshold explicit', () => {
    expect(MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS).toBe(150);
    const origin = createCoordinates(0, 0);
    expect(greatCircleDistanceKilometers(origin, createCoordinates(0, 1.34))).toBeLessThan(150);
    expect(greatCircleDistanceKilometers(origin, createCoordinates(0, 1.36))).toBeGreaterThan(150);
  });
});
""", encoding='utf-8')

(root / 'src/ui/MosqueRelocationGuardV153.test.ts').write_text("""import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const todaySource = fs.readFileSync(path.resolve('src/ui/TodayScreen.tsx'), 'utf8');

describe('v1.5.3 selected-mosque relocation guard', () => {
  it('separates mosque context from calculation-location adoption', () => {
    expect(todaySource).toContain('MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS');
    expect(todaySource).toContain('selectedMosqueDistanceKilometers');
    expect(todaySource).toContain('directoryMosqueLocationAdopted');
    expect(todaySource).toContain('selectedMosqueFarAway');
    expect(todaySource).toContain('applyAustralianMosqueCongregationTimes(sourced, activeDirectoryMosque)');
    expect(todaySource).toContain("data-selected-mosque-distance={selectedMosqueFarAway ? 'far' : 'near'}");
  });

  it('renders selected-mosque distance in the locale-aware Today surface', () => {
    expect(todaySource).toContain('.toLocaleString(localeClockTag(locale))');
    for (const locale of ['en', 'ar', 'tr', 'id']) expect(todaySource).toContain(`${locale}: {`);
  });
});
""", encoding='utf-8')

path = root / 'src/ui/TodayScreen.tsx'
text = path.read_text(encoding='utf-8')
text = re.sub(
    r"function selectedMosqueDistanceLabel\([\s\S]*?\n}\n\nfunction initialSettings",
    'function initialSettings',
    text,
    count=1,
)
text = text.replace(
    'directoryMosqueLocationAdopted && activeDirectoryMosque !== null\n      ? activeDirectoryMosque.coordinates',
    'directoryMosqueLocationAdopted\n      ? activeDirectoryMosque.coordinates',
    1,
)
text = text.replace(
    'directoryMosqueLocationAdopted && activeDirectoryMosque !== null\n      ? activeDirectoryMosque.timeZone',
    'directoryMosqueLocationAdopted\n      ? activeDirectoryMosque.timeZone',
    1,
)
old_distance = """  const selectedMosqueDistance =
    selectedMosqueDistanceKilometers === null
      ? null
      : selectedMosqueDistanceLabel(locale, selectedMosqueDistanceKilometers, selectedMosqueFarAway);
"""
new_distance = """  const selectedMosqueDistance =
    selectedMosqueDistanceKilometers === null
      ? null
      : `${Math.round(selectedMosqueDistanceKilometers).toLocaleString(localeClockTag(locale))} km`;
"""
if old_distance not in text:
    raise SystemExit('Missing selected mosque distance block')
text = text.replace(old_distance, new_distance, 1)
path.write_text(text, encoding='utf-8')
