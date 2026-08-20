import type { DisplayIdentity, DisplayOrientation, DisplaySyncState } from './displayFleet';
import { createDisplayIdentity } from './displayFleet';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';
import { parseSmartDisplayTheme } from '../platform/smartDisplayTheme';

export interface ManagedDisplayRemoteConfig {
  readonly displayId: string;
  readonly contentRevision: number;
  readonly playlistId: string | null;
  readonly displayTheme: SmartDisplayThemeId;
  readonly revoked: boolean;
  readonly updatedAt: string;
}

export interface ManagedDisplayRemoteStatus {
  readonly identity: DisplayIdentity;
  readonly lastSeenAt: string | null;
  readonly appVersion: string | null;
  readonly reportedContentRevision: number;
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
  readonly seenAt: string;
}

export interface ManagedDisplayConfigUpdate {
  readonly expectedRevision: number;
  readonly contentRevision: number;
  readonly playlistId: string | null;
  readonly displayTheme: SmartDisplayThemeId;
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

function assertRevision(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function assertUtcTimestamp(value: string, label: string): string {
  const parsed = new Date(value);
  if (!value.endsWith('Z') || !Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function normalizeNullableIdentifier(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError('Playlist ID must be a stable lowercase-safe identifier');
  }
  return normalized;
}

function normalizeAppVersion(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(normalized)) {
    throw new RangeError('App version must use semantic version format');
  }
  return normalized;
}

export function createManagedDisplayRegistration(
  input: ManagedDisplayRegistration,
): ManagedDisplayRegistration {
  return createDisplayIdentity(input);
}

export function createManagedDisplayRemoteConfig(
  input: ManagedDisplayRemoteConfig,
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
  return Object.freeze({
    displayId: identity.displayId,
    contentRevision: assertRevision(input.contentRevision, 'Remote content revision'),
    playlistId: normalizeNullableIdentifier(input.playlistId),
    displayTheme: parseSmartDisplayTheme(input.displayTheme),
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
  return Object.freeze({
    displayId: identity.displayId,
    appVersion: normalizeAppVersion(input.appVersion) ?? '0.0.0',
    contentRevision: assertRevision(input.contentRevision, 'Heartbeat content revision'),
    seenAt: assertUtcTimestamp(input.seenAt, 'Heartbeat seenAt'),
  });
}
