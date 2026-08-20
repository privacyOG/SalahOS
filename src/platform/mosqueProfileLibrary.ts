import {
  createMosqueProfile,
  type LocalizedMosqueText,
  type MosqueFacility,
  type MosqueLogoAsset,
  type MosqueProfile,
  type MosqueProfileInput,
  type MosquePublicLink,
  type MosquePublicLinkKind,
} from '../domain/mosqueProfile';
import type { MosqueId } from '../domain/mosqueIdentity';
import type { KeyValueStorage } from './settingsStorage';

export const MOSQUE_PROFILE_LIBRARY_STORAGE_KEY = 'salahos.mosqueProfileLibrary';
export const MOSQUE_PROFILE_LIBRARY_SCHEMA_VERSION = 1;

export interface MosqueProfileLibraryState {
  readonly profiles: readonly MosqueProfile[];
  readonly selectedProfileId: MosqueId | null;
}

type JsonRecord = Record<string, unknown>;

const FACILITIES: readonly MosqueFacility[] = [
  'wudu',
  'toilets',
  'parking',
  'women-prayer-space',
  'wheelchair-accessible',
  'family-room',
  'hearing-loop',
];

const LINK_KINDS: readonly MosquePublicLinkKind[] = [
  'website',
  'facebook',
  'instagram',
  'youtube',
  'registration',
  'other',
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: JsonRecord, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  return value;
}

function optionalString(record: JsonRecord, key: string, label: string): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  return value;
}

function nullableString(record: JsonRecord, key: string, label: string): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string or null`);
  return value;
}

function requiredNumber(record: JsonRecord, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return value;
}

function parseLocalized(value: unknown, label: string): LocalizedMosqueText {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object`);
  const en = optionalString(value, 'en', `${label} English`);
  const ar = optionalString(value, 'ar', `${label} Arabic`);
  return {
    ...(en === undefined ? {} : { en }),
    ...(ar === undefined ? {} : { ar }),
  };
}

function parseNullableLocalized(value: unknown, label: string): LocalizedMosqueText | null {
  return value === null ? null : parseLocalized(value, label);
}

function parseFacilities(value: unknown): readonly MosqueFacility[] {
  if (!Array.isArray(value)) throw new TypeError('Mosque facilities must be an array');
  return value.map((entry) => {
    if (typeof entry !== 'string' || !FACILITIES.includes(entry as MosqueFacility)) {
      throw new TypeError('Mosque facilities contain an unsupported value');
    }
    return entry as MosqueFacility;
  });
}

function parsePublicLink(value: unknown): MosquePublicLink {
  if (!isRecord(value)) throw new TypeError('Mosque public link must be an object');
  const kind = requiredString(value, 'kind', 'Mosque public link kind');
  if (!LINK_KINDS.includes(kind as MosquePublicLinkKind)) {
    throw new TypeError('Mosque public link kind is unsupported');
  }
  const label = value.label === undefined ? undefined : parseLocalized(value.label, 'Link label');
  return {
    kind: kind as MosquePublicLinkKind,
    url: requiredString(value, 'url', 'Mosque public link URL'),
    ...(label === undefined ? {} : { label }),
  };
}

function parseLogo(value: unknown): MosqueLogoAsset | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new TypeError('Mosque logo must be an object or null');
  const mimeType = requiredString(value, 'mimeType', 'Mosque logo MIME type');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    throw new TypeError('Mosque logo MIME type is unsupported');
  }
  return {
    assetId: requiredString(value, 'assetId', 'Mosque logo asset ID'),
    mimeType: mimeType as MosqueLogoAsset['mimeType'],
    byteSize: requiredNumber(value, 'byteSize', 'Mosque logo byte size'),
    width: requiredNumber(value, 'width', 'Mosque logo width'),
    height: requiredNumber(value, 'height', 'Mosque logo height'),
  };
}

function parseProfile(value: unknown): MosqueProfile {
  if (!isRecord(value)) throw new TypeError('Mosque profile must be an object');
  if (!isRecord(value.address)) throw new TypeError('Mosque profile address must be an object');
  if (!isRecord(value.coordinates)) {
    throw new TypeError('Mosque profile coordinates must be an object');
  }
  if (!isRecord(value.contact)) throw new TypeError('Mosque profile contact must be an object');
  if (!Array.isArray(value.contact.links)) {
    throw new TypeError('Mosque profile contact links must be an array');
  }

  const organizationId = nullableString(value, 'organizationId', 'Mosque organization ID');
  const parentMosqueId = nullableString(value, 'parentMosqueId', 'Parent mosque ID');
  const countryCode = optionalString(value.address, 'countryCode', 'Mosque country code');
  const email = optionalString(value.contact, 'email', 'Mosque public email');
  const phone = optionalString(value.contact, 'phone', 'Mosque public phone');

  const input: MosqueProfileInput = {
    id: requiredString(value, 'id', 'Mosque profile ID'),
    organizationId,
    parentMosqueId,
    name: parseLocalized(value.name, 'Mosque name'),
    description: parseNullableLocalized(value.description, 'Mosque description'),
    address: {
      formatted: requiredString(value.address, 'formatted', 'Mosque address'),
      ...(countryCode === undefined ? {} : { countryCode }),
    },
    coordinates: {
      latitude: requiredNumber(value.coordinates, 'latitude', 'Mosque latitude'),
      longitude: requiredNumber(value.coordinates, 'longitude', 'Mosque longitude'),
    },
    timeZone: requiredString(value, 'timeZone', 'Mosque timezone'),
    facilities: parseFacilities(value.facilities),
    accessibilityNotes: parseNullableLocalized(value.accessibilityNotes, 'Accessibility notes'),
    contact: {
      ...(email === undefined ? {} : { email }),
      ...(phone === undefined ? {} : { phone }),
      links: value.contact.links.map(parsePublicLink),
    },
    logo: parseLogo(value.logo),
  };
  return createMosqueProfile(input);
}

function normalizeState(state: MosqueProfileLibraryState): MosqueProfileLibraryState {
  const profiles = state.profiles.map((profile) =>
    parseProfile(JSON.parse(JSON.stringify(profile))),
  );
  const ids = new Set(profiles.map((profile) => profile.id));
  if (ids.size !== profiles.length) throw new RangeError('Mosque profile IDs must be unique');
  if (state.selectedProfileId !== null && !ids.has(state.selectedProfileId)) {
    throw new RangeError('Selected mosque profile must exist in the profile library');
  }
  return Object.freeze({
    profiles: Object.freeze(profiles),
    selectedProfileId: state.selectedProfileId,
  });
}

export function parseMosqueProfileLibrary(raw: string): MosqueProfileLibraryState {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== MOSQUE_PROFILE_LIBRARY_SCHEMA_VERSION) {
    throw new RangeError('Unsupported mosque-profile-library schema version');
  }
  if (!Array.isArray(parsed.profiles)) throw new TypeError('Mosque profiles must be an array');
  const selectedRaw = parsed.selectedProfileId;
  if (selectedRaw !== null && typeof selectedRaw !== 'string') {
    throw new TypeError('Selected mosque profile ID must be a string or null');
  }
  return normalizeState({
    profiles: parsed.profiles.map(parseProfile),
    selectedProfileId: selectedRaw as MosqueId | null,
  });
}

export function serializeMosqueProfileLibrary(state: MosqueProfileLibraryState): string {
  const normalized = normalizeState(state);
  return JSON.stringify({
    version: MOSQUE_PROFILE_LIBRARY_SCHEMA_VERSION,
    profiles: normalized.profiles,
    selectedProfileId: normalized.selectedProfileId,
  });
}

export function loadMosqueProfileLibrary(storage: KeyValueStorage): MosqueProfileLibraryState {
  const raw = storage.getItem(MOSQUE_PROFILE_LIBRARY_STORAGE_KEY);
  if (raw === null) return Object.freeze({ profiles: Object.freeze([]), selectedProfileId: null });
  try {
    return parseMosqueProfileLibrary(raw);
  } catch {
    return Object.freeze({ profiles: Object.freeze([]), selectedProfileId: null });
  }
}

export function saveMosqueProfileLibrary(
  storage: KeyValueStorage,
  state: MosqueProfileLibraryState,
): void {
  storage.setItem(MOSQUE_PROFILE_LIBRARY_STORAGE_KEY, serializeMosqueProfileLibrary(state));
}

export function upsertMosqueProfile(
  state: MosqueProfileLibraryState,
  profile: MosqueProfile,
): MosqueProfileLibraryState {
  const normalized = parseProfile(JSON.parse(JSON.stringify(profile)));
  const existingIndex = state.profiles.findIndex((entry) => entry.id === normalized.id);
  const profiles =
    existingIndex === -1
      ? [...state.profiles, normalized]
      : state.profiles.map((entry, index) => (index === existingIndex ? normalized : entry));
  return normalizeState({ profiles, selectedProfileId: state.selectedProfileId });
}

export function selectMosqueProfile(
  state: MosqueProfileLibraryState,
  profileId: MosqueId | null,
): MosqueProfileLibraryState {
  return normalizeState({ profiles: state.profiles, selectedProfileId: profileId });
}

export function removeMosqueProfile(
  state: MosqueProfileLibraryState,
  profileId: MosqueId,
): MosqueProfileLibraryState {
  return normalizeState({
    profiles: state.profiles.filter((profile) => profile.id !== profileId),
    selectedProfileId: state.selectedProfileId === profileId ? null : state.selectedProfileId,
  });
}
