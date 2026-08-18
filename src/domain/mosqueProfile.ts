import { createCoordinates, type Coordinates } from './coordinates';
import {
  createMosqueId,
  createMosqueOrganizationId,
  type MosqueId,
  type MosqueOrganizationId,
} from './mosqueIdentity';

export interface LocalizedMosqueText {
  readonly en?: string;
  readonly ar?: string;
}

export type MosqueFacility =
  | 'wudu'
  | 'toilets'
  | 'parking'
  | 'women-prayer-space'
  | 'wheelchair-accessible'
  | 'family-room'
  | 'hearing-loop';

export type MosquePublicLinkKind =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'registration'
  | 'other';

export interface MosquePublicLink {
  readonly kind: MosquePublicLinkKind;
  readonly url: string;
  readonly label?: LocalizedMosqueText;
}

export interface MosqueLogoAsset {
  readonly assetId: string;
  readonly mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  readonly byteSize: number;
  readonly width: number;
  readonly height: number;
}

export interface MosqueAddress {
  readonly formatted: string;
  readonly countryCode?: string;
}

export interface MosquePublicContact {
  readonly email?: string;
  readonly phone?: string;
  readonly links: readonly MosquePublicLink[];
}

export interface MosqueOrganization {
  readonly id: MosqueOrganizationId;
  readonly name: LocalizedMosqueText;
  readonly branchIds: readonly MosqueId[];
}

export interface MosqueProfile {
  readonly id: MosqueId;
  readonly organizationId: MosqueOrganizationId | null;
  readonly parentMosqueId: MosqueId | null;
  readonly name: LocalizedMosqueText;
  readonly description: LocalizedMosqueText | null;
  readonly address: MosqueAddress;
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly facilities: readonly MosqueFacility[];
  readonly accessibilityNotes: LocalizedMosqueText | null;
  readonly contact: MosquePublicContact;
  readonly logo: MosqueLogoAsset | null;
}

export interface MosqueOrganizationInput {
  readonly id: string;
  readonly name: LocalizedMosqueText;
  readonly branchIds?: readonly string[];
}

export interface MosqueProfileInput {
  readonly id: string;
  readonly organizationId?: string | null;
  readonly parentMosqueId?: string | null;
  readonly name: LocalizedMosqueText;
  readonly description?: LocalizedMosqueText | null;
  readonly address: MosqueAddress;
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly facilities?: readonly MosqueFacility[];
  readonly accessibilityNotes?: LocalizedMosqueText | null;
  readonly contact?: Readonly<{
    email?: string;
    phone?: string;
    links?: readonly MosquePublicLink[];
  }>;
  readonly logo?: MosqueLogoAsset | null;
}

const FACILITIES: readonly MosqueFacility[] = [
  'wudu',
  'toilets',
  'parking',
  'women-prayer-space',
  'wheelchair-accessible',
  'family-room',
  'hearing-loop',
];

const PUBLIC_LINK_KINDS: readonly MosquePublicLinkKind[] = [
  'website',
  'facebook',
  'instagram',
  'youtube',
  'registration',
  'other',
];

function normalizeText(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0 || normalized.length > maximumLength) {
    throw new TypeError(`${label} must be between 1 and ${String(maximumLength)} characters`);
  }
  return normalized;
}

function normalizeOptionalText(
  value: string | undefined,
  label: string,
  maximumLength: number,
): string | undefined {
  if (value === undefined) return undefined;
  return normalizeText(value, label, maximumLength);
}

function normalizeLocalizedText(
  value: LocalizedMosqueText,
  label: string,
  maximumLength: number,
): LocalizedMosqueText {
  const en = normalizeOptionalText(value.en, `${label} English`, maximumLength);
  const ar = normalizeOptionalText(value.ar, `${label} Arabic`, maximumLength);
  if (en === undefined && ar === undefined) {
    throw new TypeError(`${label} requires at least one English or Arabic value`);
  }
  return Object.freeze({ ...(en === undefined ? {} : { en }), ...(ar === undefined ? {} : { ar }) });
}

function normalizeOptionalLocalizedText(
  value: LocalizedMosqueText | null | undefined,
  label: string,
  maximumLength: number,
): LocalizedMosqueText | null {
  if (value === null || value === undefined) return null;
  return normalizeLocalizedText(value, label, maximumLength);
}

function validateTimeZone(value: string): string {
  const timeZone = normalizeText(value, 'Timezone', 100);
  try {
    new Intl.DateTimeFormat('en-AU', { timeZone }).format(new Date(0));
  } catch {
    throw new TypeError('Timezone must be a supported IANA timezone identifier');
  }
  return timeZone;
}

function validateHttpUrl(value: string): string {
  const normalized = normalizeText(value, 'Public URL', 2048);
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new TypeError('Public URL must be an absolute URL');
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username !== '' || url.password !== '') {
    throw new TypeError('Public URL must use HTTP(S) and must not contain credentials');
  }
  return url.toString();
}

function normalizeEmail(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const email = normalizeText(value, 'Public email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new TypeError('Public email is invalid');
  }
  return email;
}

function normalizePhone(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const phone = normalizeText(value, 'Public phone', 40);
  if (!/^[+()\-\s0-9.]+$/u.test(phone)) {
    throw new TypeError('Public phone contains unsupported characters');
  }
  return phone;
}

function normalizeAddress(value: MosqueAddress): MosqueAddress {
  const formatted = normalizeText(value.formatted, 'Mosque address', 500);
  const countryCode = value.countryCode?.trim().toUpperCase();
  if (countryCode !== undefined && !/^[A-Z]{2}$/u.test(countryCode)) {
    throw new TypeError('Country code must be a two-letter ISO country code');
  }
  return Object.freeze({ formatted, ...(countryCode === undefined ? {} : { countryCode }) });
}

function normalizeFacilities(values: readonly MosqueFacility[] | undefined): readonly MosqueFacility[] {
  if (values === undefined) return Object.freeze([]);
  const unique = new Set<MosqueFacility>();
  for (const value of values) {
    if (!FACILITIES.includes(value)) {
      throw new TypeError(`Unsupported mosque facility: ${String(value)}`);
    }
    unique.add(value);
  }
  return Object.freeze([...unique]);
}

function normalizePublicLink(value: MosquePublicLink): MosquePublicLink {
  if (!PUBLIC_LINK_KINDS.includes(value.kind)) {
    throw new TypeError(`Unsupported public link kind: ${String(value.kind)}`);
  }
  return Object.freeze({
    kind: value.kind,
    url: validateHttpUrl(value.url),
    ...(value.label === undefined
      ? {}
      : { label: normalizeLocalizedText(value.label, 'Public link label', 120) }),
  });
}

function normalizePublicLinks(values: readonly MosquePublicLink[] | undefined): readonly MosquePublicLink[] {
  if (values === undefined) return Object.freeze([]);
  if (values.length > 10) {
    throw new RangeError('A mosque profile may publish at most 10 public links');
  }
  const normalized = values.map(normalizePublicLink);
  const urls = new Set(normalized.map((link) => link.url));
  if (urls.size !== normalized.length) {
    throw new TypeError('Mosque public links must not contain duplicate URLs');
  }
  return Object.freeze(normalized);
}

function normalizeLogo(value: MosqueLogoAsset | null | undefined): MosqueLogoAsset | null {
  if (value === null || value === undefined) return null;
  const assetId = normalizeText(value.assetId, 'Logo asset ID', 160);
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(value.mimeType)) {
    throw new TypeError('Mosque logo must use PNG, JPEG, or WebP');
  }
  if (!Number.isInteger(value.byteSize) || value.byteSize < 1 || value.byteSize > 5_000_000) {
    throw new RangeError('Mosque logo must be between 1 byte and 5 MB');
  }
  if (
    !Number.isInteger(value.width) ||
    !Number.isInteger(value.height) ||
    value.width < 1 ||
    value.height < 1 ||
    value.width > 4096 ||
    value.height > 4096
  ) {
    throw new RangeError('Mosque logo dimensions must be between 1 and 4096 pixels');
  }
  return Object.freeze({
    assetId,
    mimeType: value.mimeType,
    byteSize: value.byteSize,
    width: value.width,
    height: value.height,
  });
}

export function createMosqueOrganization(input: MosqueOrganizationInput): MosqueOrganization {
  const id = createMosqueOrganizationId(input.id);
  const name = normalizeLocalizedText(input.name, 'Mosque organization name', 160);
  const branchIds = (input.branchIds ?? []).map(createMosqueId);
  if (branchIds.length > 100) {
    throw new RangeError('A mosque organization may contain at most 100 branches');
  }
  if (new Set(branchIds).size !== branchIds.length) {
    throw new TypeError('Mosque organization branch IDs must be unique');
  }
  return Object.freeze({ id, name, branchIds: Object.freeze(branchIds) });
}

export function createMosqueProfile(input: MosqueProfileInput): MosqueProfile {
  const id = createMosqueId(input.id);
  const organizationId =
    input.organizationId === null || input.organizationId === undefined
      ? null
      : createMosqueOrganizationId(input.organizationId);
  const parentMosqueId =
    input.parentMosqueId === null || input.parentMosqueId === undefined
      ? null
      : createMosqueId(input.parentMosqueId);
  if (parentMosqueId === id) {
    throw new TypeError('A mosque profile cannot be its own parent');
  }
  const coordinates = createCoordinates(input.coordinates.latitude, input.coordinates.longitude);
  const contact = Object.freeze({
    ...(normalizeEmail(input.contact?.email) === undefined
      ? {}
      : { email: normalizeEmail(input.contact?.email) }),
    ...(normalizePhone(input.contact?.phone) === undefined
      ? {}
      : { phone: normalizePhone(input.contact?.phone) }),
    links: normalizePublicLinks(input.contact?.links),
  });

  return Object.freeze({
    id,
    organizationId,
    parentMosqueId,
    name: normalizeLocalizedText(input.name, 'Mosque name', 160),
    description: normalizeOptionalLocalizedText(input.description, 'Mosque description', 2_000),
    address: normalizeAddress(input.address),
    coordinates,
    timeZone: validateTimeZone(input.timeZone),
    facilities: normalizeFacilities(input.facilities),
    accessibilityNotes: normalizeOptionalLocalizedText(
      input.accessibilityNotes,
      'Accessibility notes',
      1_000,
    ),
    contact,
    logo: normalizeLogo(input.logo),
  });
}
