import { createCoordinates, type Coordinates } from './coordinates';
import { createMosqueProfile, type MosqueProfile } from './mosqueProfile';

export type SharedMosqueVerificationState = 'unverified' | 'verified' | 'claimed';
export type SharedMosqueModerationState = 'pending' | 'approved' | 'rejected';
export type SharedMosqueContributionKind = 'submission' | 'edit-suggestion' | 'claim';

export interface SharedMosqueVerification {
  readonly state: SharedMosqueVerificationState;
  readonly verifiedAt: string | null;
  readonly claimedAt: string | null;
}

export interface SharedMosqueRecord {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string | null;
  readonly address: string;
  readonly countryCode: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
  readonly website: string | null;
  readonly phone: string | null;
  readonly source: 'community' | 'openstreetmap';
  readonly verification: SharedMosqueVerification;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface SharedMosqueSearchInput {
  readonly query?: string;
  readonly coordinates?: Coordinates | null;
  readonly radiusKm?: number | null;
  readonly limit?: number;
}

export interface SharedMosqueSearchResult {
  readonly mosque: SharedMosqueRecord;
  readonly distanceKm: number | null;
}

export interface SharedMosqueSubmissionInput {
  readonly name: string;
  readonly address: string;
  readonly countryCode: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
  readonly website?: string | null;
  readonly phone?: string | null;
}

export interface SharedMosqueContribution {
  readonly id: string;
  readonly kind: SharedMosqueContributionKind;
  readonly mosqueId: string | null;
  readonly state: SharedMosqueModerationState;
  readonly submittedAt: string;
  readonly payload: Readonly<Record<string, string | number | null>>;
}

const normalize = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('en-AU');

function requireText(value: string, label: string, maximum: number): string {
  const trimmed = value.trim().replace(/\s+/gu, ' ');
  if (trimmed.length < 1 || trimmed.length > maximum) {
    throw new TypeError(`${label} must be between 1 and ${String(maximum)} characters`);
  }
  return trimmed;
}

function optionalText(
  value: string | null | undefined,
  label: string,
  maximum: number,
): string | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  return requireText(value, label, maximum);
}

function optionalHttpUrl(value: string | null | undefined): string | null {
  const normalized = optionalText(value, 'Website', 2048);
  if (normalized === null) return null;
  const parsed = new URL(normalized);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username !== '' ||
    parsed.password !== ''
  ) {
    throw new TypeError('Website must be a public HTTP(S) URL');
  }
  return parsed.toString();
}

export function validateSharedMosqueRecord(record: SharedMosqueRecord): SharedMosqueRecord {
  const id = requireText(record.id, 'Shared mosque ID', 160);
  const countryCode = requireText(record.countryCode, 'Country code', 2).toUpperCase();
  if (!/^[A-Z]{2}$/u.test(countryCode)) throw new TypeError('Country code must use ISO alpha-2');
  const coordinates = createCoordinates(record.latitude, record.longitude);
  try {
    new Intl.DateTimeFormat('en-AU', { timeZone: record.timeZone }).format(new Date(0));
  } catch {
    throw new TypeError('Shared mosque timezone must be a supported IANA timezone');
  }
  if (!Number.isInteger(record.revision) || record.revision < 1) {
    throw new RangeError('Shared mosque revision must be a positive integer');
  }
  if (!['community', 'openstreetmap'].includes(record.source)) {
    throw new TypeError('Shared mosque source is unsupported');
  }
  if (!['unverified', 'verified', 'claimed'].includes(record.verification.state)) {
    throw new TypeError('Shared mosque verification state is unsupported');
  }
  if (!Number.isFinite(Date.parse(record.updatedAt))) {
    throw new TypeError('Shared mosque updatedAt must be an ISO timestamp');
  }
  return Object.freeze({
    ...record,
    id,
    name: requireText(record.name, 'Mosque name', 160),
    nameAr: optionalText(record.nameAr, 'Arabic mosque name', 160),
    address: requireText(record.address, 'Mosque address', 500),
    countryCode,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    timeZone: requireText(record.timeZone, 'Timezone', 100),
    website: optionalHttpUrl(record.website),
    phone: optionalText(record.phone, 'Phone', 40),
    verification: Object.freeze({ ...record.verification }),
  });
}

export function distanceBetweenKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function searchSharedMosques(
  records: readonly SharedMosqueRecord[],
  input: SharedMosqueSearchInput,
): readonly SharedMosqueSearchResult[] {
  const needle = normalize(input.query ?? '');
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const radiusKm = input.radiusKm ?? null;
  if (radiusKm !== null && (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 500)) {
    throw new RangeError('Search radius must be between 0 and 500 km');
  }
  const coordinates = input.coordinates ?? null;
  return records
    .map((candidate) => validateSharedMosqueRecord(candidate))
    .filter((candidate) => {
      if (needle === '') return true;
      return normalize(
        [candidate.name, candidate.nameAr ?? '', candidate.address].join(' '),
      ).includes(needle);
    })
    .map((mosque) => ({
      mosque,
      distanceKm:
        coordinates === null
          ? null
          : distanceBetweenKm(coordinates, createCoordinates(mosque.latitude, mosque.longitude)),
    }))
    .filter(
      (result) => radiusKm === null || result.distanceKm === null || result.distanceKm <= radiusKm,
    )
    .sort((left, right) => {
      if (coordinates !== null && left.distanceKm !== null && right.distanceKm !== null) {
        const difference = left.distanceKm - right.distanceKm;
        if (Math.abs(difference) > 0.001) return difference;
      }
      return left.mosque.name.localeCompare(right.mosque.name, 'en-AU');
    })
    .slice(0, limit);
}

export function findPotentialSharedMosqueDuplicate(
  records: readonly SharedMosqueRecord[],
  submission: SharedMosqueSubmissionInput,
): SharedMosqueRecord | null {
  const candidateCoordinates = createCoordinates(submission.latitude, submission.longitude);
  const candidateName = normalize(submission.name);
  const candidateAddress = normalize(submission.address);
  return (
    records.find((record) => {
      const mosque = validateSharedMosqueRecord(record);
      const distance = distanceBetweenKm(
        candidateCoordinates,
        createCoordinates(mosque.latitude, mosque.longitude),
      );
      const nameMatches = normalize(mosque.name) === candidateName;
      const addressMatches = normalize(mosque.address) === candidateAddress;
      return (
        (nameMatches && distance <= 1) || (addressMatches && distance <= 0.25) || distance <= 0.08
      );
    }) ?? null
  );
}

export function sharedMosqueToProfile(record: SharedMosqueRecord): MosqueProfile {
  const mosque = validateSharedMosqueRecord(record);
  return createMosqueProfile({
    id: `shared-${mosque.id}`,
    name: {
      en: mosque.name,
      ...(mosque.nameAr === null ? {} : { ar: mosque.nameAr }),
    },
    description: {
      en:
        mosque.verification.state === 'claimed'
          ? 'Community directory · claimed mosque profile'
          : mosque.verification.state === 'verified'
            ? 'Community directory · verified listing'
            : 'Community directory · unverified listing',
    },
    address: { formatted: mosque.address, countryCode: mosque.countryCode },
    coordinates: createCoordinates(mosque.latitude, mosque.longitude),
    timeZone: mosque.timeZone,
    facilities: [],
    accessibilityNotes: null,
    contact: {
      ...(mosque.phone === null ? {} : { phone: mosque.phone }),
      links:
        mosque.website === null
          ? []
          : [{ kind: 'website', url: mosque.website, label: { en: 'Website' } }],
    },
    logo: null,
  });
}
