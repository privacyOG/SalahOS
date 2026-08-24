import rawDirectory from '../data/australian-mosques.json';
import { createCoordinates, type Coordinates } from './coordinates';
import { createMosqueProfile, type MosqueProfile } from './mosqueProfile';
import { resolveIanaTimeZone } from './timezone';

export type AustralianMosqueRegionCode =
  'AU-ACT' | 'AU-NSW' | 'AU-NT' | 'AU-QLD' | 'AU-SA' | 'AU-TAS' | 'AU-VIC' | 'AU-WA';

export interface AustralianMosqueRecord {
  readonly id: string;
  readonly osmType: 'node' | 'way' | 'relation';
  readonly osmId: number;
  readonly name: string;
  readonly nameAr?: string;
  readonly address: string;
  readonly regionCode: AustralianMosqueRegionCode;
  readonly state?: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly website?: string;
  readonly phone?: string;
  readonly email?: string;
}

export interface AustralianMosqueDirectorySource {
  readonly name: 'OpenStreetMap contributors';
  readonly licence: 'ODbL-1.0';
  readonly attributionUrl: string;
  readonly licenceUrl: string;
  readonly overpassQueryTemplate: string;
  readonly regionCodes: readonly AustralianMosqueRegionCode[];
  readonly osmBaseTimestamp: string;
  readonly rawElementCount: number;
  readonly recordCount: number;
  readonly skippedOrDeduplicatedCount: number;
}

export interface AustralianMosqueDirectory {
  readonly schemaVersion: 1;
  readonly source: AustralianMosqueDirectorySource;
  readonly records: readonly AustralianMosqueRecord[];
}

export interface AustralianMosqueDistance {
  readonly mosque: AustralianMosqueRecord;
  readonly distanceKm: number;
}

const REGION_CODES: readonly AustralianMosqueRegionCode[] = [
  'AU-ACT',
  'AU-NSW',
  'AU-NT',
  'AU-QLD',
  'AU-SA',
  'AU-TAS',
  'AU-VIC',
  'AU-WA',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string when present`);
  }
  return value;
}

function requiredInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function parseRegionCode(value: unknown): AustralianMosqueRegionCode {
  if (typeof value !== 'string' || !REGION_CODES.includes(value as AustralianMosqueRegionCode)) {
    throw new TypeError('Australian mosque region code is unsupported');
  }
  return value as AustralianMosqueRegionCode;
}

function parseHttpUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${label} must be an absolute URL`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username !== '' || url.password !== '') {
    throw new TypeError(`${label} must use HTTP(S) without credentials`);
  }
  return url.toString();
}

function parseAustralianMosqueRecord(value: unknown): AustralianMosqueRecord {
  if (!isRecord(value)) throw new TypeError('Australian mosque record must be an object');
  const osmType = requiredString(value, 'osmType', 'OSM element type');
  if (osmType !== 'node' && osmType !== 'way' && osmType !== 'relation') {
    throw new TypeError('OSM element type is unsupported');
  }
  const coordinates = createCoordinates(Number(value.latitude), Number(value.longitude));
  const website = optionalString(value, 'website', 'Mosque website');
  const nameAr = optionalString(value, 'nameAr', 'Arabic mosque name');
  const state = optionalString(value, 'state', 'Mosque state');
  const phone = optionalString(value, 'phone', 'Mosque phone');
  const email = optionalString(value, 'email', 'Mosque email');

  return Object.freeze({
    id: requiredString(value, 'id', 'Australian mosque ID'),
    osmType,
    osmId: requiredInteger(value, 'osmId', 'OSM element ID'),
    name: requiredString(value, 'name', 'Mosque name'),
    ...(nameAr === undefined ? {} : { nameAr }),
    address: requiredString(value, 'address', 'Mosque address'),
    regionCode: parseRegionCode(value.regionCode),
    ...(state === undefined ? {} : { state }),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    ...(website === undefined ? {} : { website: parseHttpUrl(website, 'Mosque website') }),
    ...(phone === undefined ? {} : { phone }),
    ...(email === undefined ? {} : { email }),
  });
}

function parseDirectory(value: unknown): AustralianMosqueDirectory {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.source)) {
    throw new TypeError('Australian mosque directory must use schema version 1');
  }
  if (!Array.isArray(value.records)) {
    throw new TypeError('Australian mosque directory records must be an array');
  }
  const records = Object.freeze(value.records.map(parseAustralianMosqueRecord));
  const ids = new Set(records.map((record) => record.id));
  if (ids.size !== records.length)
    throw new RangeError('Australian mosque directory IDs must be unique');

  const source = value.source;
  if (
    source.name !== 'OpenStreetMap contributors' ||
    source.licence !== 'ODbL-1.0' ||
    !Array.isArray(source.regionCodes)
  ) {
    throw new TypeError('Australian mosque directory source metadata is invalid');
  }
  const regionCodes = Object.freeze(source.regionCodes.map(parseRegionCode));
  const recordCount = requiredInteger(source, 'recordCount', 'Directory record count');
  const rawElementCount = requiredInteger(source, 'rawElementCount', 'Directory raw element count');
  const skippedOrDeduplicatedCount = requiredInteger(
    source,
    'skippedOrDeduplicatedCount',
    'Directory skipped/deduplicated count',
  );
  if (
    recordCount !== records.length ||
    rawElementCount < recordCount ||
    rawElementCount - recordCount !== skippedOrDeduplicatedCount
  ) {
    throw new RangeError('Australian mosque directory source counts are inconsistent');
  }

  const parsedSource: AustralianMosqueDirectorySource = Object.freeze({
    name: 'OpenStreetMap contributors',
    licence: 'ODbL-1.0',
    attributionUrl: parseHttpUrl(
      requiredString(source, 'attributionUrl', 'OSM attribution URL'),
      'OSM attribution URL',
    ),
    licenceUrl: parseHttpUrl(
      requiredString(source, 'licenceUrl', 'ODbL licence URL'),
      'ODbL licence URL',
    ),
    overpassQueryTemplate: requiredString(
      source,
      'overpassQueryTemplate',
      'Overpass query template',
    ),
    regionCodes,
    osmBaseTimestamp: requiredString(source, 'osmBaseTimestamp', 'OSM base timestamp'),
    rawElementCount,
    recordCount,
    skippedOrDeduplicatedCount,
  });

  return Object.freeze({ schemaVersion: 1, source: parsedSource, records });
}

function normalizedSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLocaleLowerCase('en-AU')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
}

export function australianMosqueDistanceKm(
  from: Coordinates,
  mosque: Pick<AustralianMosqueRecord, 'latitude' | 'longitude'>,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(mosque.latitude - from.latitude);
  const longitudeDelta = radians(mosque.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(mosque.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function searchAustralianMosques(
  records: readonly AustralianMosqueRecord[],
  query: string,
): readonly AustralianMosqueRecord[] {
  const needle = normalizedSearch(query);
  if (needle.length === 0) return records;
  const terms = needle.split(' ');
  return records.filter((record) => {
    const haystack = normalizedSearch(
      [record.name, record.nameAr, record.address, record.state, record.regionCode]
        .filter((part): part is string => part !== undefined)
        .join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

export function sortAustralianMosquesByDistance(
  records: readonly AustralianMosqueRecord[],
  from: Coordinates,
): readonly AustralianMosqueDistance[] {
  return Object.freeze(
    records
      .map((mosque) =>
        Object.freeze({ mosque, distanceKm: australianMosqueDistanceKm(from, mosque) }),
      )
      .sort((left, right) => {
        const distanceDifference = left.distanceKm - right.distanceKm;
        return distanceDifference !== 0
          ? distanceDifference
          : left.mosque.name.localeCompare(right.mosque.name, 'en-AU');
      }),
  );
}

export function australianMosqueToProfile(record: AustralianMosqueRecord): MosqueProfile {
  const coordinates = createCoordinates(record.latitude, record.longitude);
  const timeZone = resolveIanaTimeZone(coordinates).timeZone;
  return createMosqueProfile({
    id: record.id,
    name: {
      en: record.name,
      ...(record.nameAr === undefined ? {} : { ar: record.nameAr }),
    },
    description: null,
    address: { formatted: record.address, countryCode: 'AU' },
    coordinates,
    timeZone,
    facilities: [],
    accessibilityNotes: null,
    contact: {
      ...(record.email === undefined ? {} : { email: record.email }),
      ...(record.phone === undefined ? {} : { phone: record.phone }),
      links:
        record.website === undefined
          ? []
          : [{ kind: 'website', url: record.website, label: { en: 'Website' } }],
    },
    logo: null,
  });
}

export const australianMosqueDirectory = parseDirectory(rawDirectory);
export const australianMosques = australianMosqueDirectory.records;
