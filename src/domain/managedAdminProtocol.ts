import type { DisplayIdentity, DisplayOrientation, DisplaySyncState } from './displayFleet';
import { createDisplayIdentity } from './displayFleet';
import {
  getPrayerBoardTemplate,
  parsePrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
  type PrayerBoardTemplateId,
} from './prayerBoardTemplate';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';
import { parseSmartDisplayTheme } from '../platform/smartDisplayTheme';

export type ManagedPrayerBoardAssignmentSource =
  'service-default' | 'mosque-default' | 'display-override';

export interface ManagedDisplayRemoteConfig {
  readonly displayId: string;
  readonly contentRevision: number;
  readonly playlistId: string | null;
  readonly displayTheme: SmartDisplayThemeId;
  readonly prayerBoardConfig: PrayerBoardTemplateConfig;
  readonly prayerBoardAssignment: ManagedPrayerBoardAssignmentSource;
  readonly revoked: boolean;
  readonly updatedAt: string;
}

type ManagedDisplayRemoteConfigInput = Omit<
  ManagedDisplayRemoteConfig,
  'prayerBoardConfig'
> & {
  readonly prayerBoardConfig?: PrayerBoardTemplateConfig | undefined;
};

export interface ManagedDisplayRemoteStatus {
  readonly identity: DisplayIdentity;
  readonly lastSeenAt: string | null;
  readonly appVersion: string | null;
  readonly reportedContentRevision: number;
  readonly reportedPrayerBoardTemplateId: PrayerBoardTemplateId | null;
  readonly syncState: DisplaySyncState;
  readonly remoteConfig: ManagedDisplayRemoteConfig;
}

export interface ManagedDisplayEnrollment {
  readonly display: ManagedDisplayRemoteStatus;
  readonly deviceToken: string;
}

export interface ManagedDisplayHeartbeat {
  readonly displayId: string;
  readonly appVersion: string;
  readonly contentRevision: number;
  readonly prayerBoardTemplateId?: PrayerBoardTemplateId;
  readonly seenAt: string;
}

export interface ManagedDisplayConfigUpdate {
  readonly expectedRevision: number;
  readonly contentRevision: number;
  readonly playlistId: string | null;
  readonly displayTheme: SmartDisplayThemeId;
  readonly prayerBoardConfig?: PrayerBoardTemplateConfig | null;
}

export interface ManagedMosquePrayerBoardDefault {
  readonly mosqueId: string;
  readonly revision: number;
  readonly prayerBoardConfig: PrayerBoardTemplateConfig;
  readonly updatedAt: string;
}

export interface ManagedMosquePrayerBoardDefaultUpdate {
  readonly expectedRevision: number;
  readonly revision: number;
  readonly prayerBoardConfig: PrayerBoardTemplateConfig;
}

export interface ManagedDisplayRegistration {
  readonly displayId: string;
  readonly organizationId: string;
  readonly mosqueId: string;
  readonly locationId: string;
  readonly orientation: DisplayOrientation;
  readonly resolutionProfile: string;
  readonly playlistId: string | null;
}

const TEMPLATE_IDS = new Set<PrayerBoardTemplateId>([
  'heritage-classic',
  'minimal-modern',
  'bold-countdown-focus',
  'structured-split-board',
  'scenic-spiritual',
  'family-classroom',
]);

function assertRevision(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function assertUtcTimestamp(value: string, label: string): string {
  const parsed = new Date(value);
  if (
    !value.endsWith('Z') ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString() !== value
  ) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function normalizeIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function normalizeNullableIdentifier(value: string | null): string | null {
  return value === null ? null : normalizeIdentifier(value, 'Playlist ID');
}

function normalizeAppVersion(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(normalized)) {
    throw new RangeError('App version must use semantic version format');
  }
  return normalized;
}

function parseTemplateId(value: unknown): PrayerBoardTemplateId | null {
  return typeof value === 'string' && TEMPLATE_IDS.has(value as PrayerBoardTemplateId)
    ? (value as PrayerBoardTemplateId)
    : null;
}

function parseAssignmentSource(value: unknown): ManagedPrayerBoardAssignmentSource {
  return value === 'mosque-default' || value === 'display-override'
    ? value
    : 'service-default';
}

function accentForLegacyTheme(theme: SmartDisplayThemeId): PrayerBoardTemplateConfig['accentPreset'] {
  switch (theme) {
    case 'midnight':
      return 'midnight';
    case 'sandstone':
      return 'sandstone';
    case 'emerald':
      return 'emerald';
    case 'classic':
    default:
      return 'neutral';
  }
}

function legacyPrayerBoardConfig(theme: SmartDisplayThemeId): PrayerBoardTemplateConfig {
  return parsePrayerBoardTemplateConfig({
    version: 1,
    templateId: 'heritage-classic',
    primaryLocale: 'en',
    timeFormat: 'h23',
    accentPreset: accentForLegacyTheme(theme),
  });
}

export function createManagedPrayerBoardAssignmentConfig(
  input: PrayerBoardTemplateConfig,
): PrayerBoardTemplateConfig {
  const normalized = parsePrayerBoardTemplateConfig(input);
  const fallbackArtworkId = getPrayerBoardTemplate(normalized.templateId).fallbackArtworkId;
  return parsePrayerBoardTemplateConfig({
    ...normalized,
    branding: {
      mosqueName: normalized.branding.mosqueName,
      logo: null,
    },
    background: {
      kind: 'builtin',
      artworkId: fallbackArtworkId,
    },
  });
}

export function createManagedDisplayRegistration(
  input: ManagedDisplayRegistration,
): ManagedDisplayRegistration {
  return createDisplayIdentity(input);
}

export function createManagedDisplayRemoteConfig(
  input: ManagedDisplayRemoteConfigInput,
): ManagedDisplayRemoteConfig {
  const identity = createDisplayIdentity({
    displayId: input.displayId,
    organizationId: 'validation:organization',
    mosqueId: 'validation:mosque',
    locationId: 'validation:location',
    orientation: 'landscape',
    resolutionProfile: 'validation:profile',
    playlistId: input.playlistId,
  });
  const displayTheme = parseSmartDisplayTheme(input.displayTheme);
  const prayerBoardConfig =
    input.prayerBoardConfig === undefined
      ? legacyPrayerBoardConfig(displayTheme)
      : createManagedPrayerBoardAssignmentConfig(input.prayerBoardConfig);
  return Object.freeze({
    displayId: identity.displayId,
    contentRevision: assertRevision(input.contentRevision, 'Remote content revision'),
    playlistId: normalizeNullableIdentifier(input.playlistId),
    displayTheme,
    prayerBoardConfig,
    prayerBoardAssignment: parseAssignmentSource(input.prayerBoardAssignment),
    revoked: input.revoked,
    updatedAt: assertUtcTimestamp(input.updatedAt, 'Remote configuration updatedAt'),
  });
}

export function createManagedDisplayRemoteStatus(
  input: ManagedDisplayRemoteStatus,
): ManagedDisplayRemoteStatus {
  const identity = createDisplayIdentity(input.identity);
  const remoteConfig = createManagedDisplayRemoteConfig(input.remoteConfig);
  if (identity.displayId !== remoteConfig.displayId) {
    throw new RangeError('Remote status identity and configuration display IDs must match');
  }
  return Object.freeze({
    identity,
    lastSeenAt:
      input.lastSeenAt === null ? null : assertUtcTimestamp(input.lastSeenAt, 'Display lastSeenAt'),
    appVersion: normalizeAppVersion(input.appVersion),
    reportedContentRevision: assertRevision(
      input.reportedContentRevision,
      'Reported content revision',
    ),
    reportedPrayerBoardTemplateId: parseTemplateId(input.reportedPrayerBoardTemplateId),
    syncState: input.syncState,
    remoteConfig,
  });
}

export function createManagedDisplayConfigUpdate(
  input: ManagedDisplayConfigUpdate,
): ManagedDisplayConfigUpdate {
  const expectedRevision = assertRevision(input.expectedRevision, 'Expected revision');
  const contentRevision = assertRevision(input.contentRevision, 'Content revision');
  if (contentRevision <= expectedRevision) {
    throw new RangeError('Content revision must advance beyond the expected revision');
  }
  return Object.freeze({
    expectedRevision,
    contentRevision,
    playlistId: normalizeNullableIdentifier(input.playlistId),
    displayTheme: parseSmartDisplayTheme(input.displayTheme),
    ...(input.prayerBoardConfig === undefined
      ? {}
      : {
          prayerBoardConfig:
            input.prayerBoardConfig === null
              ? null
              : createManagedPrayerBoardAssignmentConfig(input.prayerBoardConfig),
        }),
  });
}

export function createManagedMosquePrayerBoardDefault(
  input: ManagedMosquePrayerBoardDefault,
): ManagedMosquePrayerBoardDefault {
  return Object.freeze({
    mosqueId: normalizeIdentifier(input.mosqueId, 'Mosque ID'),
    revision: assertRevision(input.revision, 'Mosque prayer-board revision'),
    prayerBoardConfig: createManagedPrayerBoardAssignmentConfig(input.prayerBoardConfig),
    updatedAt: assertUtcTimestamp(input.updatedAt, 'Mosque prayer-board updatedAt'),
  });
}

export function createManagedMosquePrayerBoardDefaultUpdate(
  input: ManagedMosquePrayerBoardDefaultUpdate,
): ManagedMosquePrayerBoardDefaultUpdate {
  const expectedRevision = assertRevision(input.expectedRevision, 'Expected mosque revision');
  const revision = assertRevision(input.revision, 'Mosque prayer-board revision');
  if (revision <= expectedRevision) {
    throw new RangeError('Mosque prayer-board revision must advance beyond the expected revision');
  }
  return Object.freeze({
    expectedRevision,
    revision,
    prayerBoardConfig: createManagedPrayerBoardAssignmentConfig(input.prayerBoardConfig),
  });
}

export function createManagedDisplayHeartbeat(
  input: ManagedDisplayHeartbeat,
): ManagedDisplayHeartbeat {
  const identity = createDisplayIdentity({
    displayId: input.displayId,
    organizationId: 'validation:organization',
    mosqueId: 'validation:mosque',
    locationId: 'validation:location',
    orientation: 'landscape',
    resolutionProfile: 'validation:profile',
    playlistId: null,
  });
  const prayerBoardTemplateId = parseTemplateId(input.prayerBoardTemplateId);
  return Object.freeze({
    displayId: identity.displayId,
    appVersion: normalizeAppVersion(input.appVersion) ?? '0.0.0',
    contentRevision: assertRevision(input.contentRevision, 'Heartbeat content revision'),
    ...(prayerBoardTemplateId === null ? {} : { prayerBoardTemplateId }),
    seenAt: assertUtcTimestamp(input.seenAt, 'Heartbeat seenAt'),
  });
}
