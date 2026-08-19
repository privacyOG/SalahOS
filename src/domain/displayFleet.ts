export type DisplayOrientation = 'landscape' | 'portrait';
export type DisplaySyncState = 'current' | 'syncing' | 'offline' | 'stale' | 'revoked';
export type DisplayReconciliationAction =
  'keep-local' | 'apply-remote' | 'report-conflict' | 'revoke';

export interface DisplayIdentity {
  readonly displayId: string;
  readonly organizationId: string;
  readonly mosqueId: string;
  readonly locationId: string;
  readonly orientation: DisplayOrientation;
  readonly resolutionProfile: string;
  readonly playlistId: string | null;
}

export interface DisplayPairingCode {
  readonly code: string;
  readonly displayId: string;
  readonly expiresAt: string;
  readonly usedAt: string | null;
  readonly revokedAt: string | null;
}

export interface DisplayFleetStatus {
  readonly displayId: string;
  readonly lastSeenAt: string | null;
  readonly appVersion: string;
  readonly contentRevision: number;
  readonly syncState: DisplaySyncState;
}

export interface DisplayCachedConfiguration {
  readonly displayId: string;
  readonly contentRevision: number;
  readonly playlistId: string | null;
  readonly cachedAt: string;
  readonly localPrayerAvailable: boolean;
}

export interface DisplayRemoteConfiguration {
  readonly displayId: string;
  readonly contentRevision: number;
  readonly playlistId: string | null;
  readonly revoked: boolean;
}

export interface DisplayReconciliationResult {
  readonly action: DisplayReconciliationAction;
  readonly effectiveRevision: number;
  readonly effectivePlaylistId: string | null;
  readonly localPrayerAvailable: boolean;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;
const PAIRING_CODE_PATTERN = /^[A-Z0-9]{6}$/u;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;

function normalizeIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 160 || !ID_PATTERN.test(normalized)) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
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

function assertRevision(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function normalizeNullableIdentifier(value: string | null, label: string): string | null {
  return value === null ? null : normalizeIdentifier(value, label);
}

export function createDisplayIdentity(input: DisplayIdentity): DisplayIdentity {
  return Object.freeze({
    displayId: normalizeIdentifier(input.displayId, 'Display ID'),
    organizationId: normalizeIdentifier(input.organizationId, 'Organization ID'),
    mosqueId: normalizeIdentifier(input.mosqueId, 'Mosque ID'),
    locationId: normalizeIdentifier(input.locationId, 'Location ID'),
    orientation: input.orientation,
    resolutionProfile: normalizeIdentifier(input.resolutionProfile, 'Resolution profile'),
    playlistId: normalizeNullableIdentifier(input.playlistId, 'Playlist ID'),
  });
}

export function createDisplayPairingCode(input: DisplayPairingCode): DisplayPairingCode {
  const code = input.code.trim().toUpperCase();
  if (!PAIRING_CODE_PATTERN.test(code)) {
    throw new RangeError('Pairing code must contain exactly 6 uppercase letters or digits');
  }
  const expiresAt = assertUtcTimestamp(input.expiresAt, 'Pairing expiry');
  const usedAt =
    input.usedAt === null ? null : assertUtcTimestamp(input.usedAt, 'Pairing use time');
  const revokedAt =
    input.revokedAt === null ? null : assertUtcTimestamp(input.revokedAt, 'Pairing revoke time');
  if (usedAt !== null && usedAt > expiresAt) {
    throw new RangeError('Pairing code cannot be used after expiry');
  }
  return Object.freeze({
    code,
    displayId: normalizeIdentifier(input.displayId, 'Display ID'),
    expiresAt,
    usedAt,
    revokedAt,
  });
}

export function pairingCodeIsUsable(pairing: DisplayPairingCode, now: string): boolean {
  const normalized = createDisplayPairingCode(pairing);
  const current = assertUtcTimestamp(now, 'Current time');
  return (
    normalized.usedAt === null && normalized.revokedAt === null && current < normalized.expiresAt
  );
}

export function createDisplayFleetStatus(input: DisplayFleetStatus): DisplayFleetStatus {
  const lastSeenAt =
    input.lastSeenAt === null ? null : assertUtcTimestamp(input.lastSeenAt, 'Last-seen time');
  const appVersion = input.appVersion.trim();
  if (!VERSION_PATTERN.test(appVersion)) {
    throw new RangeError('App version must use semantic version format');
  }
  return Object.freeze({
    displayId: normalizeIdentifier(input.displayId, 'Display ID'),
    lastSeenAt,
    appVersion,
    contentRevision: assertRevision(input.contentRevision, 'Content revision'),
    syncState: input.syncState,
  });
}

export function createDisplayCachedConfiguration(
  input: DisplayCachedConfiguration,
): DisplayCachedConfiguration {
  return Object.freeze({
    displayId: normalizeIdentifier(input.displayId, 'Display ID'),
    contentRevision: assertRevision(input.contentRevision, 'Cached content revision'),
    playlistId: normalizeNullableIdentifier(input.playlistId, 'Cached playlist ID'),
    cachedAt: assertUtcTimestamp(input.cachedAt, 'Cache time'),
    localPrayerAvailable: input.localPrayerAvailable,
  });
}

export function reconcileDisplayConfiguration(
  local: DisplayCachedConfiguration,
  remote: DisplayRemoteConfiguration,
): DisplayReconciliationResult {
  const cached = createDisplayCachedConfiguration(local);
  const remoteDisplayId = normalizeIdentifier(remote.displayId, 'Remote display ID');
  if (cached.displayId !== remoteDisplayId) {
    throw new RangeError('Local and remote display IDs must match');
  }
  const remoteRevision = assertRevision(remote.contentRevision, 'Remote content revision');
  const remotePlaylistId = normalizeNullableIdentifier(remote.playlistId, 'Remote playlist ID');

  if (remote.revoked) {
    return Object.freeze({
      action: 'revoke',
      effectiveRevision: cached.contentRevision,
      effectivePlaylistId: cached.playlistId,
      localPrayerAvailable: cached.localPrayerAvailable,
    });
  }

  if (remoteRevision > cached.contentRevision) {
    return Object.freeze({
      action: 'apply-remote',
      effectiveRevision: remoteRevision,
      effectivePlaylistId: remotePlaylistId,
      localPrayerAvailable: cached.localPrayerAvailable,
    });
  }

  if (remoteRevision === cached.contentRevision && remotePlaylistId !== cached.playlistId) {
    return Object.freeze({
      action: 'report-conflict',
      effectiveRevision: cached.contentRevision,
      effectivePlaylistId: cached.playlistId,
      localPrayerAvailable: cached.localPrayerAvailable,
    });
  }

  return Object.freeze({
    action: 'keep-local',
    effectiveRevision: cached.contentRevision,
    effectivePlaylistId: cached.playlistId,
    localPrayerAvailable: cached.localPrayerAvailable,
  });
}
