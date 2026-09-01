from pathlib import Path
import re
import runpy

root = Path('.')
runpy.run_path(str(root / 'scripts/temp-compact-v153-item11-v2.py'), run_name='__main__')

combined_path = root / 'src/domain/australianMosqueDirectoryCombined.ts'
combined = combined_path.read_text(encoding='utf-8')
coordinates_import = "import { createCoordinates, type Coordinates } from './coordinates';\n"
if coordinates_import not in combined:
    raise SystemExit('Missing combined directory coordinates import')
combined = combined.replace(
    coordinates_import,
    coordinates_import + "import { greatCircleDistanceKilometers } from './greatCircleDistance';\n",
    1,
)
combined, replacements = re.subn(
    r"export function australianMosqueDistanceKm\(\n  from: Coordinates,\n  mosque: Pick<AustralianMosqueRecord, 'latitude' \| 'longitude'>,\n\): number \{[\s\S]*?\n\}\n\nexport function searchAustralianMosques",
    """export function australianMosqueDistanceKm(
  from: Coordinates,
  mosque: Pick<AustralianMosqueRecord, 'latitude' | 'longitude'>,
): number {
  return greatCircleDistanceKilometers(from, mosque);
}

export function searchAustralianMosques""",
    combined,
    count=1,
)
if replacements != 1:
    raise SystemExit('Missing combined Australian mosque distance function')
combined_path.write_text(combined, encoding='utf-8')

mosques_path = root / 'src/ui/MosquesScreen.tsx'
mosques = mosques_path.read_text(encoding='utf-8')
anchor = "import { calculationMethods } from '../domain/methods';\n"
if anchor not in mosques:
    raise SystemExit('Missing MosquesScreen method import')
mosques = mosques.replace(
    anchor,
    anchor + "import { greatCircleDistanceKilometers } from '../domain/greatCircleDistance';\n",
    1,
)
mosques, replacements = re.subn(
    r"function distanceKm\(\n  from: Readonly<\{ latitude: number; longitude: number \}>,\n  to: Readonly<\{ latitude: number; longitude: number \}>,\n\): number \{[\s\S]*?\n\}\n\nfunction formatDistance",
    """function distanceKm(
  from: Readonly<{ latitude: number; longitude: number }>,
  to: Readonly<{ latitude: number; longitude: number }>,
): number {
  return greatCircleDistanceKilometers(from, to);
}

function formatDistance""",
    mosques,
    count=1,
)
if replacements != 1:
    raise SystemExit('Missing MosquesScreen distance function')
mosques_path.write_text(mosques, encoding='utf-8')
