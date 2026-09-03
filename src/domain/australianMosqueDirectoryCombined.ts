import { createCoordinates, type Coordinates } from './coordinates';
import { greatCircleDistanceKilometers } from './greatCircleDistance';
import {
  createEnrichedMosqueDirectoryRecord,
  type EnrichedMosqueDirectoryRecord,
  type MosqueDirectoryJumuahTime,
  type MosqueDirectoryPrayerSummary,
  type MosqueDirectoryProvenance,
  type MosqueDirectoryService,
} from './mosqueDirectoryEnrichment';
import { createMosqueProfile, type MosqueFacility, type MosqueProfile } from './mosqueProfile';
import { resolveIanaTimeZone } from './timezone';

export type AustralianMosqueRegionCode =
  'AU-ACT' | 'AU-NSW' | 'AU-NT' | 'AU-QLD' | 'AU-SA' | 'AU-TAS' | 'AU-VIC' | 'AU-WA';

export interface AustralianMosqueRecord {
  readonly id: string;
  readonly name: string;
  readonly nameAr?: string;
  readonly aliases: readonly string[];
  readonly address: string;
  readonly regionCode: AustralianMosqueRegionCode;
  readonly state?: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly website?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly locationType?: string;
  readonly features: readonly string[];
  readonly enriched: EnrichedMosqueDirectoryRecord;
}

export interface AustralianMosqueDirectorySource {
  readonly name: string;
  readonly generatedAt: string;
  readonly recordCount: number;
  readonly osmRecordCount: number;
  readonly mosqueFinderRecordCount: number;
  readonly mergedPairCount: number;
  readonly osmOnlyCount: number;
  readonly finderOnlyCount: number;
  readonly osmAttributionUrl: string;
  readonly osmLicenceUrl: string;
  readonly mosqueFinderUrl: string;
}

export interface AustralianMosqueDirectory {
  readonly schemaVersion: 2;
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
const FACILITIES: readonly MosqueFacility[] = [
  'wudu',
  'toilets',
  'parking',
  'women-prayer-space',
  'wheelchair-accessible',
  'family-room',
  'hearing-loop',
];
const SERVICES: readonly MosqueDirectoryService[] = [
  'classes',
  'counselling',
  'food-support',
  'funeral-services',
  'nikah-services',
  'youth',
  'zakat',
  'other',
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

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function requiredNumber(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(`${label} is invalid`);
  return value;
}

function requiredInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze(
    value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
  );
}

function regionCode(value: unknown): AustralianMosqueRegionCode {
  if (typeof value !== 'string' || !REGION_CODES.includes(value as AustralianMosqueRegionCode)) {
    throw new TypeError('Australian mosque region code is unsupported');
  }
  return value as AustralianMosqueRegionCode;
}

function facilities(value: unknown): readonly MosqueFacility[] {
  return Object.freeze(
    stringArray(value).filter((item): item is MosqueFacility =>
      FACILITIES.includes(item as MosqueFacility),
    ),
  );
}

function services(value: unknown): readonly MosqueDirectoryService[] {
  return Object.freeze(
    stringArray(value).filter((item): item is MosqueDirectoryService =>
      SERVICES.includes(item as MosqueDirectoryService),
    ),
  );
}

function parsePrayerTimes(value: unknown): MosqueDirectoryPrayerSummary | null {
  if (!isRecord(value)) return null;
  return Object.freeze({
    ...(
      [
        'fajr',
        'dhuhr',
        'asr',
        'maghrib',
        'isha',
        'timetableUrl',
        'sourceLabel',
        'updatedAt',
      ] as const
    ).reduce<Record<string, string>>((result, key) => {
      const item = optionalString(value, key);
      if (item !== undefined) result[key] = item;
      return result;
    }, {}),
  });
}

function parseJumuah(value: unknown): readonly MosqueDirectoryJumuahTime[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze(
    value.flatMap((item) => {
      if (!isRecord(item)) return [];
      const time = optionalString(item, 'time');
      if (time === undefined) return [];
      const label = optionalString(item, 'label');
      return [Object.freeze({ time, ...(label === undefined ? {} : { label }) })];
    }),
  );
}

function parseProvenance(value: unknown): readonly MosqueDirectoryProvenance[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze(
    value.flatMap((item) => {
      if (!isRecord(item)) return [];
      const sourceKind = optionalString(item, 'sourceKind');
      if (
        sourceKind !== 'openstreetmap' &&
        sourceKind !== 'official-website' &&
        sourceKind !== 'official-feed' &&
        sourceKind !== 'organization-directory' &&
        sourceKind !== 'community' &&
        sourceKind !== 'licensed-provider'
      ) {
        return [];
      }
      const sourceUrl = optionalString(item, 'sourceUrl');
      return [
        Object.freeze({
          sourceId: requiredString(item, 'sourceId', 'Directory provenance source ID'),
          sourceKind,
          sourceLabel: requiredString(item, 'sourceLabel', 'Directory provenance source label'),
          ...(sourceUrl === undefined ? {} : { sourceUrl }),
          observedAt: requiredString(item, 'observedAt', 'Directory provenance observed timestamp'),
          confidence: requiredNumber(item, 'confidence', 'Directory provenance confidence'),
          fields: stringArray(item.fields) as MosqueDirectoryProvenance['fields'],
        }),
      ];
    }),
  );
}

function parseCombinedRecord(value: unknown): AustralianMosqueRecord {
  if (!isRecord(value) || !isRecord(value.address) || !isRecord(value.contact)) {
    throw new TypeError('Combined Australian mosque record is invalid');
  }
  const coordinates = createCoordinates(
    requiredNumber(value, 'latitude', 'Mosque latitude'),
    requiredNumber(value, 'longitude', 'Mosque longitude'),
  );
  const recordRegionCode = regionCode(value.address.regionCode);
  const locality = optionalString(value.address, 'locality');
  const state = optionalString(value.address, 'region');
  const postcode = optionalString(value.address, 'postcode');
  const nameAr = optionalString(value, 'nameAr');
  const website = optionalString(value.contact, 'website');
  const phone = optionalString(value.contact, 'phone');
  const email = optionalString(value.contact, 'email');
  const locationType = optionalString(value, 'locationType');
  const mosqueFacilities = facilities(value.facilities);
  const mosqueServices = services(value.services);
  const sourceRecordIds = stringArray(value.sourceRecordIds);
  const aliases = stringArray(value.aliases);
  const enriched = createEnrichedMosqueDirectoryRecord(
    {
      id: requiredString(value, 'id', 'Combined mosque ID'),
      sourceRecordIds,
      name: requiredString(value, 'name', 'Combined mosque name'),
      ...(nameAr === undefined ? {} : { nameAr }),
      aliases,
      address: {
        formatted: requiredString(value.address, 'formatted', 'Combined mosque address'),
        ...(locality === undefined ? {} : { locality }),
        ...(state === undefined ? {} : { region: state }),
        regionCode: recordRegionCode,
        ...(postcode === undefined ? {} : { postcode }),
        countryCode: 'AU',
      },
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      contact: {
        ...(phone === undefined ? {} : { phone }),
        ...(email === undefined ? {} : { email }),
        ...(website === undefined ? {} : { website }),
        social: [],
      },
      prayerTimes: parsePrayerTimes(value.prayerTimes),
      jumuahTimes: parseJumuah(value.jumuahTimes),
      facilities: mosqueFacilities,
      services: mosqueServices,
      verification: {
        state: 'unverified',
        verifiedAt: null,
        lastReviewedAt: isRecord(value.verification)
          ? (optionalString(value.verification, 'lastReviewedAt') ?? null)
          : null,
      },
      provenance: parseProvenance(value.provenance),
      conflictCount: isRecord(value.quality)
        ? requiredInteger(value.quality, 'conflictCount', 'Directory conflict count')
        : 0,
    },
    new Date(),
  );
  return Object.freeze({
    id: enriched.id,
    name: enriched.name,
    ...(enriched.nameAr === undefined ? {} : { nameAr: enriched.nameAr }),
    aliases: enriched.aliases,
    address: enriched.address.formatted,
    regionCode: recordRegionCode,
    ...(state === undefined ? {} : { state }),
    latitude: enriched.latitude,
    longitude: enriched.longitude,
    ...(website === undefined ? {} : { website }),
    ...(phone === undefined ? {} : { phone }),
    ...(email === undefined ? {} : { email }),
    ...(locationType === undefined ? {} : { locationType }),
    features: stringArray(value.featureLabels),
    enriched,
  });
}

export function parseAustralianMosqueDirectory(value: unknown): AustralianMosqueDirectory {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 2 ||
    !isRecord(value.source) ||
    !Array.isArray(value.records)
  ) {
    throw new TypeError('Combined Australian mosque directory must use schema version 2');
  }
  const records = Object.freeze(value.records.map(parseCombinedRecord));
  const ids = new Set(records.map((record) => record.id));
  if (ids.size !== records.length)
    throw new RangeError('Combined Australian mosque IDs must be unique');
  const sources = Array.isArray(value.source.sources)
    ? value.source.sources.map((entry: unknown) => entry)
    : [];
  const osmSource = sources.find(
    (entry) => isRecord(entry) && entry.sourceKind === 'openstreetmap',
  );
  const finderSource = sources.find(
    (entry) => isRecord(entry) && entry.sourceKind === 'organization-directory',
  );
  if (!isRecord(osmSource) || !isRecord(finderSource))
    throw new TypeError('Combined directory sources are incomplete');
  const source: AustralianMosqueDirectorySource = Object.freeze({
    name: requiredString(value.source, 'name', 'Combined directory source name'),
    generatedAt: requiredString(
      value.source,
      'generatedAt',
      'Combined directory generation timestamp',
    ),
    recordCount: requiredInteger(value.source, 'recordCount', 'Combined directory record count'),
    osmRecordCount: requiredInteger(value.source, 'osmRecordCount', 'OSM source record count'),
    mosqueFinderRecordCount: requiredInteger(
      value.source,
      'mosqueFinderRecordCount',
      'Mosque Finder source record count',
    ),
    mergedPairCount: requiredInteger(value.source, 'mergedPairCount', 'Merged mosque pair count'),
    osmOnlyCount: requiredInteger(value.source, 'osmOnlyCount', 'OSM-only record count'),
    finderOnlyCount: requiredInteger(
      value.source,
      'finderOnlyCount',
      'Mosque Finder-only record count',
    ),
    osmAttributionUrl: requiredString(osmSource, 'attributionUrl', 'OSM attribution URL'),
    osmLicenceUrl: requiredString(osmSource, 'licenceUrl', 'OSM licence URL'),
    mosqueFinderUrl: requiredString(
      finderSource,
      'attributionUrl',
      'Mosque Finder attribution URL',
    ),
  });
  if (source.recordCount !== records.length)
    throw new RangeError('Combined directory record count is inconsistent');
  return Object.freeze({ schemaVersion: 2, source, records });
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
  return greatCircleDistanceKilometers(from, mosque);
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
      [
        record.name,
        record.nameAr,
        ...record.aliases,
        record.address,
        record.state,
        record.regionCode,
        record.locationType,
        ...record.features,
      ]
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
    name: { en: record.name, ...(record.nameAr === undefined ? {} : { ar: record.nameAr }) },
    description: null,
    address: { formatted: record.address, countryCode: 'AU' },
    coordinates,
    timeZone,
    facilities: record.enriched.facilities,
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

