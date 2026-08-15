const DAY_MS = 86_400_000;
const JULIAN_UNIX_EPOCH = 2_440_587.5;
const J2000 = 2_451_545;
const SUNRISE_ZENITH_DEGREES = 90.833;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const normalizeDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;

export interface SolarCoordinates {
  readonly declinationDegrees: number;
  readonly equationOfTimeMinutes: number;
}

export interface SolarDayEvents {
  readonly solarNoonUtcMinutes: number;
  readonly sunriseUtcMinutes: number | null;
  readonly sunsetUtcMinutes: number | null;
}

/** Convert a JavaScript instant to astronomical Julian Day. */
export function julianDay(date: Date): number {
  return date.getTime() / DAY_MS + JULIAN_UNIX_EPOCH;
}

function julianCentury(jd: number): number {
  return (jd - J2000) / 36_525;
}

/**
 * Solar declination and equation of time using the NOAA/Meeus-style approximation.
 * The function is pure and independent from civil timezone rules.
 */
export function solarCoordinates(date: Date): SolarCoordinates {
  const t = julianCentury(julianDay(date));
  const geometricMeanLongitude = normalizeDegrees(280.46646 + t * (36_000.76983 + 0.0003032 * t));
  const geometricMeanAnomaly = normalizeDegrees(357.52911 + t * (35_999.05029 - 0.0001537 * t));
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const anomalyRadians = toRadians(geometricMeanAnomaly);
  const equationOfCenter =
    Math.sin(anomalyRadians) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * anomalyRadians) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * anomalyRadians) * 0.000289;

  const trueLongitude = geometricMeanLongitude + equationOfCenter;
  const omega = 125.04 - 1934.136 * t;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(toRadians(omega));

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const correctedObliquity = meanObliquity + 0.00256 * Math.cos(toRadians(omega));

  const declinationDegrees = toDegrees(
    Math.asin(Math.sin(toRadians(correctedObliquity)) * Math.sin(toRadians(apparentLongitude))),
  );

  const y = Math.tan(toRadians(correctedObliquity) / 2) ** 2;
  const longitudeRadians = toRadians(geometricMeanLongitude);

  const equationOfTimeRadians =
    y * Math.sin(2 * longitudeRadians) -
    2 * eccentricity * Math.sin(anomalyRadians) +
    4 * eccentricity * y * Math.sin(anomalyRadians) * Math.cos(2 * longitudeRadians) -
    0.5 * y ** 2 * Math.sin(4 * longitudeRadians) -
    1.25 * eccentricity ** 2 * Math.sin(2 * anomalyRadians);

  return {
    declinationDegrees,
    equationOfTimeMinutes: 4 * toDegrees(equationOfTimeRadians),
  };
}

function hourAngleDegrees(latitudeDegrees: number, declinationDegrees: number): number | null {
  const latitude = toRadians(latitudeDegrees);
  const declination = toRadians(declinationDegrees);
  const zenith = toRadians(SUNRISE_ZENITH_DEGREES);

  const cosine =
    (Math.cos(zenith) - Math.sin(latitude) * Math.sin(declination)) /
    (Math.cos(latitude) * Math.cos(declination));

  if (cosine < -1 || cosine > 1) {
    return null;
  }

  return toDegrees(Math.acos(cosine));
}

/**
 * Compute UTC minutes from 00:00 UTC for solar noon, sunrise and sunset.
 * Longitude is east-positive and latitude is north-positive.
 */
export function solarDayEvents(
  date: Date,
  latitudeDegrees: number,
  longitudeDegrees: number,
): SolarDayEvents {
  if (!Number.isFinite(latitudeDegrees) || latitudeDegrees < -90 || latitudeDegrees > 90) {
    throw new RangeError('Latitude must be between -90 and 90 degrees');
  }

  if (!Number.isFinite(longitudeDegrees) || longitudeDegrees < -180 || longitudeDegrees > 180) {
    throw new RangeError('Longitude must be between -180 and 180 degrees');
  }

  const midnightUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
  const coordinates = solarCoordinates(new Date(midnightUtc.getTime() + 12 * 60 * 60 * 1000));
  const solarNoonUtcMinutes = 720 - 4 * longitudeDegrees - coordinates.equationOfTimeMinutes;
  const hourAngle = hourAngleDegrees(latitudeDegrees, coordinates.declinationDegrees);

  if (hourAngle === null) {
    return {
      solarNoonUtcMinutes,
      sunriseUtcMinutes: null,
      sunsetUtcMinutes: null,
    };
  }

  const deltaMinutes = 4 * hourAngle;

  return {
    solarNoonUtcMinutes,
    sunriseUtcMinutes: solarNoonUtcMinutes - deltaMinutes,
    sunsetUtcMinutes: solarNoonUtcMinutes + deltaMinutes,
  };
}

export const astronomyAssumptions = Object.freeze({
  sunriseSunsetZenithDegrees: SUNRISE_ZENITH_DEGREES,
  observerElevationMetres: 0,
  atmosphericRefractionModel: 'standard apparent sunrise/sunset zenith',
});
