from pathlib import Path
import re

root = Path('.')

(root / 'src/domain/greatCircleDistance.ts').write_text("""import type { Coordinates } from './coordinates';

export const MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS = 150;

export function greatCircleDistanceKilometers(origin: Coordinates, destination: Coordinates): number {
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
    expect(greatCircleDistanceKilometers(sydney, sydney)).toBeCloseTo(0, 4);
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
const directorySource = fs.readFileSync(path.resolve('src/domain/australianMosqueDirectory.ts'), 'utf8');

describe('v1.5.3 selected-mosque relocation guard', () => {
  it('separates mosque context from calculation-location adoption', () => {
    expect(todaySource).toContain('MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS');
    expect(todaySource).toContain('selectedMosqueDistanceKilometers');
    expect(todaySource).toContain('directoryMosqueLocationAdopted');
    expect(todaySource).toContain('selectedMosqueFarAway');
    expect(todaySource).toContain('applyAustralianMosqueCongregationTimes(sourced, activeDirectoryMosque)');
    expect(todaySource).toContain("data-selected-mosque-distance={selectedMosqueFarAway ? 'far' : 'near'}");
  });

  it('labels far-away selected-mosque distance in every supported UI locale', () => {
    expect(todaySource).toContain("far: 'Far'");
    expect(todaySource).toContain("far: 'بعيد'");
    expect(todaySource).toContain("far: 'Uzak'");
    expect(todaySource).toContain("far: 'Jauh'");
    expect(todaySource).toContain('destinationLabels[locale].far');
  });

  it('reuses the shared domain distance primitive for Australian directory ordering', () => {
    expect(directorySource).toContain("import { greatCircleDistanceKilometers } from './greatCircleDistance';");
    expect(directorySource).toContain('return greatCircleDistanceKilometers(from, mosque);');
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
    "Record<Locale, Readonly<Record<'mosques' | 'qiblah' | 'settings', string>>>",
    "Record<Locale, Readonly<Record<'mosques' | 'qiblah' | 'settings' | 'far', string>>>",
    1,
)
for old, new in [
    ("en: { mosques: 'Mosques', qiblah: 'Qiblah', settings: 'Settings' },", "en: { mosques: 'Mosques', qiblah: 'Qiblah', settings: 'Settings', far: 'Far' },"),
    ("ar: { mosques: 'المساجد', qiblah: 'القبلة', settings: 'الإعدادات' },", "ar: { mosques: 'المساجد', qiblah: 'القبلة', settings: 'الإعدادات', far: 'بعيد' },"),
    ("tr: { mosques: 'Camiler', qiblah: 'Kıble', settings: 'Ayarlar' },", "tr: { mosques: 'Camiler', qiblah: 'Kıble', settings: 'Ayarlar', far: 'Uzak' },"),
    ("id: { mosques: 'Masjid', qiblah: 'Kiblat', settings: 'Pengaturan' },", "id: { mosques: 'Masjid', qiblah: 'Kiblat', settings: 'Pengaturan', far: 'Jauh' },"),
]:
    if old not in text:
        raise SystemExit(f'Missing destination label row: {old}')
    text = text.replace(old, new, 1)
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
      : `${String(Math.round(selectedMosqueDistanceKilometers))} km${selectedMosqueFarAway ? ` · ${destinationLabels[locale].far}` : ''}`;
"""
if old_distance not in text:
    raise SystemExit('Missing selected mosque distance block')
text = text.replace(old_distance, new_distance, 1)
path.write_text(text, encoding='utf-8')

directory_path = root / 'src/domain/australianMosqueDirectory.ts'
directory = directory_path.read_text(encoding='utf-8')
coordinates_import = "import { createCoordinates, type Coordinates } from './coordinates';\n"
if coordinates_import not in directory:
    raise SystemExit('Missing Australian directory coordinates import')
directory = directory.replace(
    coordinates_import,
    coordinates_import + "import { greatCircleDistanceKilometers } from './greatCircleDistance';\n",
    1,
)
directory, replacements = re.subn(
    r"export function australianMosqueDistanceKm\(\n  from: Coordinates,\n  mosque: Pick<AustralianMosqueRecord, 'latitude' \| 'longitude'>,\n\): number \{[\s\S]*?\n\}\n\nexport function searchAustralianMosques",
    """export function australianMosqueDistanceKm(
  from: Coordinates,
  mosque: Pick<AustralianMosqueRecord, 'latitude' | 'longitude'>,
): number {
  return greatCircleDistanceKilometers(from, mosque);
}

export function searchAustralianMosques""",
    directory,
    count=1,
)
if replacements != 1:
    raise SystemExit('Missing Australian mosque distance function')
directory_path.write_text(directory, encoding='utf-8')
