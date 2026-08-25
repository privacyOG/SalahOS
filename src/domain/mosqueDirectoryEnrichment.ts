import type {
  AustralianMosqueDirectory,
  AustralianMosqueRecord,
} from './australianMosqueDirectory';
import type { MosqueFacility } from './mosqueProfile';
import type { SharedMosqueRecord } from './sharedMosqueDirectory';

export type MosqueDirectorySourceKind =
  | 'openstreetmap'
  | 'official-website'
  | 'official-feed'
  | 'organization-directory'
  | 'community'
  | 'licensed-provider';

export type MosqueDirectoryField =
  | 'name'
  | 'aliases'
  | 'address'
  | 'coordinates'
  | 'phone'
  | 'email'
  | 'website'
  | 'social'
  | 'prayer-times'
  | 'jumuah-times'
  | 'facilities'
  | 'services';

export type MosqueDirectoryVerificationState = 'unverified' | 'verified' | 'claimed';
export type MosqueDirectoryFreshness = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface MosqueDirectoryProvenance {
  readonly sourceId: string;
  readonly sourceKind: MosqueDirectorySourceKind;
  readonly sourceLabel: string;
  readonly sourceUrl?: string;
  readonly observedAt: string;
  readonly confidence: number;
  readonly fields: readonly MosqueDirectoryField[];
}

export interface MosqueDirectorySocialLink {
  readonly platform: 'facebook' | 'instagram' | 'youtube' | 'x' | 'other';
  readonly url: string;
}

export interface MosqueDirectoryContact {
  readonly phone?: string;
  readonly email?: string;
  readonly website?: string | undefined;
  readonly social: readonly MosqueDirectorySocialLink[];
}

export interface MosqueDirectoryAddress {
  readonly formatted: string;
  readonly locality?: string;
  readonly region?: string;
  readonly regionCode?: string;
  readonly postcode?: string;
  readonly countryCode: string;
}

export interface MosqueDirectoryPrayerSummary {
  readonly fajr?: string;
  readonly dhuhr?: string;
  readonly asr?: string;
  readonly maghrib?: string;
  readonly isha?: string;
  readonly timetableUrl?: string;
  readonly sourceLabel?: string;
  readonly updatedAt?: string;
}

export interface MosqueDirectoryJumuahTime {
  readonly time: string;
  readonly label?: string;
}

export type MosqueDirectoryService =
  | 'classes'
  | 'counselling'
  | 'food-support'
  | 'funeral-services'
  | 'nikah-services'
  | 'youth'
  | 'zakat'
  | 'other';

export interface MosqueDirectoryVerificationMetadata {
  readonly state: MosqueDirectoryVerificationState;
  readonly verifiedAt: string | null;
  readonly verifiedBy?: string;
  readonly lastReviewedAt: string | null;
}

export interface MosqueDirectoryQuality {
  readonly score: number;
  readonly completenessPercent: number;
  readonly provenanceCoveragePercent: number;
  readonly freshness: MosqueDirectoryFreshness;
  readonly conflictCount: number;
}

export interface EnrichedMosqueDirectoryRecord {
  readonly id: string;
  readonly sourceRecordIds: readonly string[];
  readonly name: string;
  readonly nameAr?: string;
  readonly aliases: readonly string[];
  readonly address: MosqueDirectoryAddress;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone?: string;
  readonly contact: MosqueDirectoryContact;
  readonly prayerTimes: MosqueDirectoryPrayerSummary | null;
  readonly jumuahTimes: readonly MosqueDirectoryJumuahTime[];
  readonly facilities: readonly MosqueFacility[];
  readonly services: readonly MosqueDirectoryService[];
  readonly verification: MosqueDirectoryVerificationMetadata;
  readonly provenance: readonly MosqueDirectoryProvenance[];
  readonly quality: MosqueDirectoryQuality;
  readonly conflictCount: number;
}

type EnrichedMosqueDirectoryInput = Omit<EnrichedMosqueDirectoryRecord, 'quality'>;

const DIRECTORY_FIELDS: readonly MosqueDirectoryField[] = [
  'name',
  'aliases',
  'address',
  'coordinates',
  'phone',
  'email',
  'website',
  'social',
  'prayer-times',
  'jumuah-times',
  'facilities',
  'services',
];

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => value.trim()).filter(Boolean))]);
}

function validTimestamp(value: string | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function normalizeUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en-AU')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
}

function normalizedPhone(value: string | undefined): string {
  return (value ?? '').replace(/\D/gu, '');
}

function normalizedDomain(value: string | undefined): string {
  if (value === undefined) return '';
  try {
    return new URL(value).hostname.replace(/^www\./u, '').toLocaleLowerCase('en-AU');
  } catch {
    return '';
  }
}

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(
  left: EnrichedMosqueDirectoryRecord,
  right: EnrichedMosqueDirectoryRecord,
): number {
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function fieldIsPresent(
  record: EnrichedMosqueDirectoryInput,
  field: MosqueDirectoryField,
): boolean {
  switch (field) {
    case 'name':
      return record.name.trim().length > 0;
    case 'aliases':
      return record.aliases.length > 0;
    case 'address':
      return record.address.formatted.trim().length > 0;
    case 'coordinates':
      return Number.isFinite(record.latitude) && Number.isFinite(record.longitude);
    case 'phone':
      return record.contact.phone !== undefined;
    case 'email':
      return record.contact.email !== undefined;
    case 'website':
      return record.contact.website !== undefined;
    case 'social':
      return record.contact.social.length > 0;
    case 'prayer-times':
      return record.prayerTimes !== null;
    case 'jumuah-times':
      return record.jumuahTimes.length > 0;
    case 'facilities':
      return record.facilities.length > 0;
    case 'services':
      return record.services.length > 0;
  }
}

export function calculateMosqueDirectoryQuality(
  record: EnrichedMosqueDirectoryInput,
  now: Date = new Date(),
): MosqueDirectoryQuality {
  const presentFields = DIRECTORY_FIELDS.filter((field) => fieldIsPresent(record, field));
  const completenessPercent = Math.round((presentFields.length / DIRECTORY_FIELDS.length) * 100);
  const provenanceFields = new Set(record.provenance.flatMap((entry) => entry.fields));
  const provenanceCoveragePercent = Math.round(
    (presentFields.filter((field) => provenanceFields.has(field)).length /
      Math.max(presentFields.length, 1)) *
      100,
  );

  const latestObserved = record.provenance
    .map((entry) => validTimestamp(entry.observedAt))
    .filter((value): value is string => value !== null)
    .map((value) => Date.parse(value))
    .sort((left, right) => right - left)[0];
  let freshness: MosqueDirectoryFreshness = 'unknown';
  if (latestObserved !== undefined) {
    const ageDays = Math.max(0, (now.getTime() - latestObserved) / 86_400_000);
    freshness = ageDays <= 90 ? 'fresh' : ageDays <= 365 ? 'aging' : 'stale';
  }

  const verificationWeight =
    record.verification.state === 'claimed'
      ? 20
      : record.verification.state === 'verified'
        ? 15
        : 0;
  const freshnessWeight = freshness === 'fresh' ? 10 : freshness === 'aging' ? 5 : 0;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completenessPercent * 0.45 +
          provenanceCoveragePercent * 0.25 +
          verificationWeight +
          freshnessWeight -
          record.conflictCount * 8,
      ),
    ),
  );

  return Object.freeze({
    score,
    completenessPercent,
    provenanceCoveragePercent,
    freshness,
    conflictCount: record.conflictCount,
  });
}

export function createEnrichedMosqueDirectoryRecord(
  input: EnrichedMosqueDirectoryInput,
  now: Date = new Date(),
): EnrichedMosqueDirectoryRecord {
  const normalized: EnrichedMosqueDirectoryInput = Object.freeze({
    ...input,
    sourceRecordIds: uniqueStrings(input.sourceRecordIds),
    aliases: uniqueStrings(input.aliases),
    address: Object.freeze({ ...input.address }),
    contact: Object.freeze({
      ...(input.contact.phone === undefined ? {} : { phone: input.contact.phone.trim() }),
      ...(input.contact.email === undefined
        ? {}
        : { email: input.contact.email.trim().toLocaleLowerCase('en-AU') }),
      ...(normalizeUrl(input.contact.website) === undefined
        ? {}
        : { website: normalizeUrl(input.contact.website) }),
      social: Object.freeze(
        input.contact.social
          .map((entry) => ({ ...entry, url: normalizeUrl(entry.url) }))
          .filter(
            (entry): entry is MosqueDirectorySocialLink =>
              typeof entry.url === 'string' && entry.url.length > 0,
          ),
      ),
    }),
    prayerTimes: input.prayerTimes === null ? null : Object.freeze({ ...input.prayerTimes }),
    jumuahTimes: Object.freeze(input.jumuahTimes.map((entry) => Object.freeze({ ...entry }))),
    facilities: Object.freeze([...new Set(input.facilities)]),
    services: Object.freeze([...new Set(input.services)]),
    verification: Object.freeze({ ...input.verification }),
    provenance: Object.freeze(
      input.provenance.map((entry) =>
        Object.freeze({
          ...entry,
          confidence: Math.max(0, Math.min(1, entry.confidence)),
          fields: Object.freeze([...new Set(entry.fields)]),
        }),
      ),
    ),
  });
  return Object.freeze({
    ...normalized,
    quality: calculateMosqueDirectoryQuality(normalized, now),
  });
}

function australianSourceFields(record: AustralianMosqueRecord): readonly MosqueDirectoryField[] {
  const fields: MosqueDirectoryField[] = ['name', 'address', 'coordinates'];
  if (record.nameAr !== undefined) fields.push('aliases');
  if (record.phone !== undefined) fields.push('phone');
  if (record.email !== undefined) fields.push('email');
  if (record.website !== undefined) fields.push('website');
  return Object.freeze(fields);
}

export function enrichAustralianMosqueRecord(
  record: AustralianMosqueRecord,
  directory: AustralianMosqueDirectory,
  now: Date = new Date(),
): EnrichedMosqueDirectoryRecord {
  const postcode = record.address.match(/\b\d{4}\b/u)?.[0];
  const osmUrl = `https://www.openstreetmap.org/${record.osmType}/${String(record.osmId)}`;
  return createEnrichedMosqueDirectoryRecord(
    {
      id: record.id,
      sourceRecordIds: [record.id],
      name: record.name,
      ...(record.nameAr === undefined ? {} : { nameAr: record.nameAr }),
      aliases: record.nameAr === undefined ? [] : [record.nameAr],
      address: {
        formatted: record.address,
        ...(record.state === undefined ? {} : { region: record.state }),
        regionCode: record.regionCode,
        ...(postcode === undefined ? {} : { postcode }),
        countryCode: 'AU',
      },
      latitude: record.latitude,
      longitude: record.longitude,
      contact: {
        ...(record.phone === undefined ? {} : { phone: record.phone }),
        ...(record.email === undefined ? {} : { email: record.email }),
        ...(record.website === undefined ? {} : { website: record.website }),
        social: [],
      },
      prayerTimes: null,
      jumuahTimes: [],
      facilities: [],
      services: [],
      verification: {
        state: 'unverified',
        verifiedAt: null,
        lastReviewedAt: directory.source.osmBaseTimestamp,
      },
      provenance: [
        {
          sourceId: `osm:${record.osmType}:${String(record.osmId)}`,
          sourceKind: 'openstreetmap',
          sourceLabel: directory.source.name,
          sourceUrl: osmUrl,
          observedAt: directory.source.osmBaseTimestamp,
          confidence: 0.82,
          fields: australianSourceFields(record),
        },
      ],
      conflictCount: 0,
    },
    now,
  );
}

export function enrichSharedMosqueRecord(
  record: SharedMosqueRecord,
  now: Date = new Date(),
): EnrichedMosqueDirectoryRecord {
  const fields: MosqueDirectoryField[] = ['name', 'address', 'coordinates'];
  if (record.nameAr !== null) fields.push('aliases');
  if (record.phone !== null) fields.push('phone');
  if (record.website !== null) fields.push('website');
  return createEnrichedMosqueDirectoryRecord(
    {
      id: `shared-${record.id}`,
      sourceRecordIds: [record.id],
      name: record.name,
      ...(record.nameAr === null ? {} : { nameAr: record.nameAr }),
      aliases: record.nameAr === null ? [] : [record.nameAr],
      address: { formatted: record.address, countryCode: record.countryCode },
      latitude: record.latitude,
      longitude: record.longitude,
      timeZone: record.timeZone,
      contact: {
        ...(record.phone === null ? {} : { phone: record.phone }),
        ...(record.website === null ? {} : { website: record.website }),
        social: [],
      },
      prayerTimes: null,
      jumuahTimes: [],
      facilities: [],
      services: [],
      verification: {
        state: record.verification.state,
        verifiedAt: validTimestamp(record.verification.verifiedAt),
        lastReviewedAt: validTimestamp(record.updatedAt),
      },
      provenance: [
        {
          sourceId: `${record.source}:${record.id}`,
          sourceKind: record.source === 'openstreetmap' ? 'openstreetmap' : 'community',
          sourceLabel:
            record.source === 'openstreetmap' ? 'OpenStreetMap contributors' : 'SalahOS community',
          observedAt: record.updatedAt,
          confidence: record.verification.state === 'unverified' ? 0.65 : 0.9,
          fields,
        },
      ],
      conflictCount: 0,
    },
    now,
  );
}

export function mosqueDirectoryEntityMatchScore(
  left: EnrichedMosqueDirectoryRecord,
  right: EnrichedMosqueDirectoryRecord,
): number {
  if (
    left.id === right.id ||
    left.sourceRecordIds.some((id) => right.sourceRecordIds.includes(id))
  ) {
    return 1;
  }

  let score = 0;
  const distance = distanceKm(left, right);
  if (distance <= 0.08) score += 0.45;
  else if (distance <= 0.25) score += 0.34;
  else if (distance <= 1) score += 0.18;

  const leftName = normalizeName(left.name);
  const rightName = normalizeName(right.name);
  if (leftName === rightName) score += 0.35;
  else if (leftName.includes(rightName) || rightName.includes(leftName)) score += 0.2;

  if (normalizeName(left.address.formatted) === normalizeName(right.address.formatted))
    score += 0.25;

  const leftPhone = normalizedPhone(left.contact.phone);
  const rightPhone = normalizedPhone(right.contact.phone);
  if (leftPhone.length >= 8 && leftPhone === rightPhone) score += 0.3;

  const leftDomain = normalizedDomain(left.contact.website);
  const rightDomain = normalizedDomain(right.contact.website);
  if (leftDomain !== '' && leftDomain === rightDomain) score += 0.3;

  return Math.min(1, Number(score.toFixed(3)));
}

export function likelySameMosque(
  left: EnrichedMosqueDirectoryRecord,
  right: EnrichedMosqueDirectoryRecord,
): boolean {
  return mosqueDirectoryEntityMatchScore(left, right) >= 0.65;
}

function verificationRank(state: MosqueDirectoryVerificationState): number {
  return state === 'claimed' ? 3 : state === 'verified' ? 2 : 1;
}

function meaningfulConflict(left: string | undefined, right: string | undefined): number {
  return left !== undefined && right !== undefined && normalizeName(left) !== normalizeName(right)
    ? 1
    : 0;
}

export function mergeEnrichedMosqueDirectoryRecords(
  left: EnrichedMosqueDirectoryRecord,
  right: EnrichedMosqueDirectoryRecord,
  now: Date = new Date(),
): EnrichedMosqueDirectoryRecord {
  const primary = left.quality.score >= right.quality.score ? left : right;
  const secondary = primary === left ? right : left;
  const verification =
    verificationRank(left.verification.state) >= verificationRank(right.verification.state)
      ? left.verification
      : right.verification;
  const conflictCount =
    left.conflictCount +
    right.conflictCount +
    meaningfulConflict(left.address.formatted, right.address.formatted) +
    meaningfulConflict(left.contact.phone, right.contact.phone) +
    meaningfulConflict(left.contact.website, right.contact.website);

  return createEnrichedMosqueDirectoryRecord(
    {
      id: primary.id,
      sourceRecordIds: [...left.sourceRecordIds, ...right.sourceRecordIds],
      name: primary.name,
      ...((primary.nameAr ?? secondary.nameAr)
        ? { nameAr: primary.nameAr ?? secondary.nameAr }
        : {}),
      aliases: [...left.aliases, ...right.aliases, secondary.name],
      address: {
        ...secondary.address,
        ...primary.address,
      },
      latitude: primary.latitude,
      longitude: primary.longitude,
      ...((primary.timeZone ?? secondary.timeZone)
        ? { timeZone: primary.timeZone ?? secondary.timeZone }
        : {}),
      contact: {
        ...((primary.contact.phone ?? secondary.contact.phone)
          ? { phone: primary.contact.phone ?? secondary.contact.phone }
          : {}),
        ...((primary.contact.email ?? secondary.contact.email)
          ? { email: primary.contact.email ?? secondary.contact.email }
          : {}),
        ...((primary.contact.website ?? secondary.contact.website)
          ? { website: primary.contact.website ?? secondary.contact.website }
          : {}),
        social: [...left.contact.social, ...right.contact.social].filter(
          (entry, index, all) =>
            all.findIndex((candidate) => candidate.url === entry.url) === index,
        ),
      },
      prayerTimes: primary.prayerTimes ?? secondary.prayerTimes,
      jumuahTimes: [...left.jumuahTimes, ...right.jumuahTimes].filter(
        (entry, index, all) =>
          all.findIndex(
            (candidate) => candidate.time === entry.time && candidate.label === entry.label,
          ) === index,
      ),
      facilities: [...left.facilities, ...right.facilities],
      services: [...left.services, ...right.services],
      verification,
      provenance: [...left.provenance, ...right.provenance].filter(
        (entry, index, all) =>
          all.findIndex(
            (candidate) =>
              candidate.sourceId === entry.sourceId && candidate.observedAt === entry.observedAt,
          ) === index,
      ),
      conflictCount,
    },
    now,
  );
}

export function resolveMosqueDirectoryEntities(
  records: readonly EnrichedMosqueDirectoryRecord[],
  now: Date = new Date(),
): readonly EnrichedMosqueDirectoryRecord[] {
  const resolved: EnrichedMosqueDirectoryRecord[] = [];
  for (const record of records) {
    const duplicateIndex = resolved.findIndex((candidate) => likelySameMosque(candidate, record));
    if (duplicateIndex === -1) resolved.push(record);
    else
      resolved[duplicateIndex] = mergeEnrichedMosqueDirectoryRecords(
        resolved[duplicateIndex]!,
        record,
        now,
      );
  }
  return Object.freeze(resolved);
}

export function mosqueDirectoryFreshnessLabel(
  record: EnrichedMosqueDirectoryRecord,
): MosqueDirectoryFreshness {
  return record.quality.freshness;
}
