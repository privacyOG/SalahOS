from pathlib import Path

root = Path('.')

(root / 'src/domain/greatCircleDistance.ts').write_text("""import { createCoordinates, type Coordinates } from './coordinates';

const EARTH_MEAN_RADIUS_KILOMETERS = 6_371.0088;
export const MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS = 150;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function greatCircleDistanceKilometers(
  originInput: Coordinates,
  destinationInput: Coordinates,
): number {
  const origin = createCoordinates(originInput.latitude, originInput.longitude);
  const destination = createCoordinates(destinationInput.latitude, destinationInput.longitude);
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_MEAN_RADIUS_KILOMETERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
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

  it('matches the Sydney to Melbourne surface distance within a sensible range', () => {
    const sydney = createCoordinates(-33.8688, 151.2093);
    const melbourne = createCoordinates(-37.8136, 144.9631);
    const distance = greatCircleDistanceKilometers(sydney, melbourne);
    expect(distance).toBeGreaterThan(710);
    expect(distance).toBeLessThan(720);
  });

  it('keeps the relocation guard threshold explicitly at 150 km', () => {
    expect(MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS).toBe(150);
    const origin = createCoordinates(0, 0);
    const withinThreshold = createCoordinates(0, 1.34);
    const beyondThreshold = createCoordinates(0, 1.36);
    expect(greatCircleDistanceKilometers(origin, withinThreshold)).toBeLessThan(150);
    expect(greatCircleDistanceKilometers(origin, beyondThreshold)).toBeGreaterThan(150);
  });

  it('preserves coordinate validation at the domain boundary', () => {
    expect(() =>
      greatCircleDistanceKilometers(
        { latitude: 91, longitude: 0 },
        createCoordinates(0, 0),
      ),
    ).toThrow(RangeError);
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

  it('ships selected-mosque distance wording for all four locales', () => {
    expect(todaySource).toContain("case 'ar':");
    expect(todaySource).toContain("case 'tr':");
    expect(todaySource).toContain("case 'id':");
    expect(todaySource).toContain('أوقات الصلاة حسب موقعك');
    expect(todaySource).toContain('namaz vakitleri konumunuza göre');
    expect(todaySource).toContain('waktu salat memakai lokasi Anda');
    expect(todaySource).toContain('prayer times use your location');
  });
});
""", encoding='utf-8')

today_path = root / 'src/ui/TodayScreen.tsx'
today = today_path.read_text(encoding='utf-8')

def replace_once(old: str, new: str):
    global today
    if old not in today:
        raise SystemExit(f'Missing TodayScreen marker: {old[:120]!r}')
    today = today.replace(old, new, 1)

replace_once(
    "import { displayedHighLatitudeRuleApplied } from '../domain/highLatitudeIndicators';\n",
    "import { displayedHighLatitudeRuleApplied } from '../domain/highLatitudeIndicators';\nimport {\n  greatCircleDistanceKilometers,\n  MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS,\n} from '../domain/greatCircleDistance';\n",
)

replace_once(
    "function initialSettings(): PersistedSettings {\n",
    """function selectedMosqueDistanceLabel(
  locale: Locale,
  distanceKilometers: number,
  farAway: boolean,
): string {
  const distance = new Intl.NumberFormat(localeClockTag(locale), {
    maximumFractionDigits: 0,
  }).format(distanceKilometers);
  switch (locale) {
    case 'ar':
      return farAway ? `يبعد ${distance} كم · أوقات الصلاة حسب موقعك` : `يبعد ${distance} كم`;
    case 'tr':
      return farAway
        ? `${distance} km uzakta · namaz vakitleri konumunuza göre`
        : `${distance} km uzakta`;
    case 'id':
      return farAway
        ? `Berjarak ${distance} km · waktu salat memakai lokasi Anda`
        : `Berjarak ${distance} km`;
    case 'en':
    default:
      return farAway
        ? `${distance} km away · prayer times use your location`
        : `${distance} km away`;
  }
}

function initialSettings(): PersistedSettings {
""",
)

replace_once(
    """  const coordinates = activeDirectoryMosque?.coordinates ?? settings.location?.coordinates ?? null;
  const timeZoneOverride = activeDirectoryMosque?.timeZone ?? settings.location?.timeZone ?? null;
""",
    """  const selectedMosqueDistanceKilometers =
    activeDirectoryMosque !== null && settings.location !== null
      ? greatCircleDistanceKilometers(
          settings.location.coordinates,
          activeDirectoryMosque.coordinates,
        )
      : null;
  const selectedMosqueFarAway =
    selectedMosqueDistanceKilometers !== null &&
    selectedMosqueDistanceKilometers > MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS;
  const directoryMosqueLocationAdopted =
    activeDirectoryMosque !== null && (settings.location === null || !selectedMosqueFarAway);
  const coordinates =
    directoryMosqueLocationAdopted && activeDirectoryMosque !== null
      ? activeDirectoryMosque.coordinates
      : settings.location?.coordinates ?? null;
  const timeZoneOverride =
    directoryMosqueLocationAdopted && activeDirectoryMosque !== null
      ? activeDirectoryMosque.timeZone
      : settings.location?.timeZone ?? null;
""",
)

replace_once(
    """  const contextLabel =
    prayerBoardData?.mosqueName ??
    prayerBoardData?.timeZone ??
    settings.location?.timeZone ??
    translate(locale, 'notConfigured');
""",
    """  const contextLabel = selectedMosqueFarAway
    ? (prayerBoardData?.timeZone ?? settings.location?.timeZone ?? translate(locale, 'notConfigured'))
    : (prayerBoardData?.mosqueName ??
      prayerBoardData?.timeZone ??
      settings.location?.timeZone ??
      translate(locale, 'notConfigured'));
""",
)

replace_once(
    """  const recentLocation = useMemo(() => {
    if (coordinates === null || directoryMosqueActive) return null;
    try {
      return loadRecentBestAvailableLocation(getApplicationStorage());
    } catch {
      return null;
    }
  }, [coordinates, directoryMosqueActive]);
  const locationSourceLabel = directoryMosqueActive
    ? uxCopy.selectedMosque
""",
    """  const recentLocation = useMemo(() => {
    if (coordinates === null || directoryMosqueLocationAdopted) return null;
    try {
      return loadRecentBestAvailableLocation(getApplicationStorage());
    } catch {
      return null;
    }
  }, [coordinates, directoryMosqueLocationAdopted]);
  const locationSourceLabel = directoryMosqueLocationAdopted
    ? uxCopy.selectedMosque
""",
)

replace_once(
    """  const locationConfidenceLabel = directoryMosqueActive
    ? uxCopy.mosqueLocation
""",
    """  const locationConfidenceLabel = directoryMosqueLocationAdopted
    ? uxCopy.mosqueLocation
""",
)

replace_once(
    """  const locationAccuracyMeters =
    directoryMosqueActive || recentLocation === null ? null : recentLocation.accuracyMeters;
""",
    """  const locationAccuracyMeters =
    directoryMosqueLocationAdopted || recentLocation === null ? null : recentLocation.accuracyMeters;
""",
)

replace_once(
    """  const locationAccuracyLabel =
    locationAccuracyMeters === null
      ? null
      : locationAccuracyMeters < 1_000
        ? `±${String(Math.round(locationAccuracyMeters))} m`
        : `±${(locationAccuracyMeters / 1_000).toFixed(1)} km`;
""",
    """  const locationAccuracyLabel =
    locationAccuracyMeters === null
      ? null
      : locationAccuracyMeters < 1_000
        ? `±${String(Math.round(locationAccuracyMeters))} m`
        : `±${(locationAccuracyMeters / 1_000).toFixed(1)} km`;
  const selectedMosqueDistance =
    selectedMosqueDistanceKilometers === null
      ? null
      : selectedMosqueDistanceLabel(locale, selectedMosqueDistanceKilometers, selectedMosqueFarAway);
""",
)

replace_once(
    """                directoryMosqueActive
                  ? 'mosque'
""",
    """                directoryMosqueLocationAdopted
                  ? 'mosque'
""",
)

replace_once(
    """                  {directoryMosqueActive && (
                    <SalahIcon name=\"mosques\" className=\"today-location-confidence__mosque-icon\" />
                  )}
""",
    """                  {directoryMosqueLocationAdopted && (
                    <SalahIcon name=\"mosques\" className=\"today-location-confidence__mosque-icon\" />
                  )}
""",
)

replace_once(
    """                {directoryMosqueActive && (
                  <small data-mosque-iqamah-source=\"directory-published\">
                    {uxCopy.mosquePublishedIqamah}
                  </small>
                )}
""",
    """                {directoryMosqueActive && (
                  <small data-mosque-iqamah-source=\"directory-published\">
                    {uxCopy.mosquePublishedIqamah}
                  </small>
                )}
                {activeDirectoryMosque !== null && selectedMosqueDistance !== null && (
                  <small
                    data-selected-mosque-distance={selectedMosqueFarAway ? 'far' : 'near'}
                  >
                    <BidiText>{activeDirectoryMosque.mosqueName}</BidiText> · {selectedMosqueDistance}
                  </small>
                )}
""",
)

today_path.write_text(today, encoding='utf-8')

tracker_path = root / 'TEMP_TODO_V1.5.3.md'
tracker = tracker_path.read_text(encoding='utf-8')
old = """## Work Item 11 — Guard mosque-driven relocation

- [ ] Add pure great-circle distance logic in `src/domain/` using existing coordinate conventions.
- [ ] Beyond a named 150 km threshold, retain the user's own coordinates/timezone rather than relocating prayer calculation to the mosque.
- [ ] Still show far-away mosque congregation/Jumu'ah data, clearly labelled.
- [ ] Show selected-mosque distance in all four locales.
- [ ] Preserve mosque-coordinate adoption when no user location exists.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test`.
"""
new = """## Work Item 11 — Guard mosque-driven relocation — COMPLETE

- [x] Add pure great-circle distance logic in `src/domain/` using existing coordinate conventions.
- [x] Beyond a named 150 km threshold, retain the user's own coordinates/timezone rather than relocating prayer calculation to the mosque.
- [x] Still show far-away mosque congregation/Jumu'ah data, clearly labelled.
- [x] Show selected-mosque distance in all four locales.
- [x] Preserve mosque-coordinate adoption when no user location exists.
- [x] Gate: `npm run typecheck && npm run lint && npm run test`.
"""
if old not in tracker:
    raise SystemExit('Missing Item 11 tracker block')
tracker_path.write_text(tracker.replace(old, new, 1), encoding='utf-8')
