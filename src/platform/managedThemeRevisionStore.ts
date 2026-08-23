import {
  parsePrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';

const STORAGE_KEY = 'salahos.managedThemeRevisionHistory.v1';
const STORE_VERSION = 1 as const;
const MAX_REVISIONS_PER_TARGET = 12;
const TARGET_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;

export type ManagedThemeRevisionScope = 'mosque-default' | 'display-override';

export interface ManagedThemeRevisionSnapshot {
  readonly scope: ManagedThemeRevisionScope;
  readonly targetId: string;
  readonly revision: number;
  readonly prayerBoardConfig: PrayerBoardTemplateConfig;
  readonly observedAt: string;
}

interface PersistedManagedThemeRevisionStore {
  readonly version: 1;
  readonly snapshots: readonly ManagedThemeRevisionSnapshot[];
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function normalizeTargetId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !TARGET_ID_PATTERN.test(normalized)
  ) {
    throw new RangeError('Managed theme revision target must be a stable lowercase-safe identifier');
  }
  return normalized;
}

function normalizeRevision(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError('Managed theme revision must be a non-negative integer');
  }
  return value;
}

function normalizeTimestamp(value: string): string {
  const date = new Date(value);
  if (!value.endsWith('Z') || !Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw new RangeError('Managed theme revision timestamp must be ISO-8601 UTC');
  }
  return value;
}

function normalizeScope(value: unknown): ManagedThemeRevisionScope {
  if (value !== 'mosque-default' && value !== 'display-override') {
    throw new RangeError('Managed theme revision scope is unsupported');
  }
  return value;
}

function normalizeSnapshot(value: ManagedThemeRevisionSnapshot): ManagedThemeRevisionSnapshot {
  return Object.freeze({
    scope: normalizeScope(value.scope),
    targetId: normalizeTargetId(value.targetId),
    revision: normalizeRevision(value.revision),
    prayerBoardConfig: parsePrayerBoardTemplateConfig(value.prayerBoardConfig),
    observedAt: normalizeTimestamp(value.observedAt),
  });
}

function parseSnapshot(value: unknown): ManagedThemeRevisionSnapshot | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  try {
    return normalizeSnapshot(value as ManagedThemeRevisionSnapshot);
  } catch {
    return null;
  }
}

function emptyStore(): PersistedManagedThemeRevisionStore {
  return Object.freeze({ version: STORE_VERSION, snapshots: Object.freeze([]) });
}

function readStore(storage: StorageLike): PersistedManagedThemeRevisionStore {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return emptyStore();
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      !('version' in value) ||
      value.version !== STORE_VERSION ||
      !('snapshots' in value) ||
      !Array.isArray(value.snapshots)
    ) {
      return emptyStore();
    }
    const snapshots = value.snapshots
      .map(parseSnapshot)
      .filter((snapshot): snapshot is ManagedThemeRevisionSnapshot => snapshot !== null);
    return Object.freeze({ version: STORE_VERSION, snapshots: Object.freeze(snapshots) });
  } catch {
    return emptyStore();
  }
}

function writeStore(storage: StorageLike, snapshots: readonly ManagedThemeRevisionSnapshot[]): void {
  if (snapshots.length === 0) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORE_VERSION, snapshots }));
}

export function recordManagedThemeRevision(
  storage: StorageLike,
  snapshot: ManagedThemeRevisionSnapshot,
): readonly ManagedThemeRevisionSnapshot[] {
  const normalized = normalizeSnapshot(snapshot);
  const current = readStore(storage).snapshots.filter(
    (entry) =>
      !(
        entry.scope === normalized.scope &&
        entry.targetId === normalized.targetId &&
        entry.revision === normalized.revision
      ),
  );
  const sameTarget = current
    .filter(
      (entry) => entry.scope === normalized.scope && entry.targetId === normalized.targetId,
    )
    .sort((left, right) => right.revision - left.revision)
    .slice(0, MAX_REVISIONS_PER_TARGET - 1);
  const otherTargets = current.filter(
    (entry) => !(entry.scope === normalized.scope && entry.targetId === normalized.targetId),
  );
  const next = Object.freeze([normalized, ...sameTarget, ...otherTargets]);
  writeStore(storage, next);
  return listManagedThemeRevisions(storage, normalized.scope, normalized.targetId);
}

export function listManagedThemeRevisions(
  storage: StorageLike,
  scope: ManagedThemeRevisionScope,
  targetId: string,
): readonly ManagedThemeRevisionSnapshot[] {
  const normalizedScope = normalizeScope(scope);
  const normalizedTargetId = normalizeTargetId(targetId);
  return Object.freeze(
    readStore(storage).snapshots
      .filter(
        (entry) => entry.scope === normalizedScope && entry.targetId === normalizedTargetId,
      )
      .sort((left, right) => right.revision - left.revision),
  );
}

export function clearManagedThemeRevisionHistory(storage: StorageLike): void {
  storage.removeItem(STORAGE_KEY);
}
