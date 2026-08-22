import {
  parsePrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import type { KeyValueStorage } from './settingsStorage';

export const MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY = 'salahos.managedPrayerBoardCache';
export const MANAGED_PRAYER_BOARD_CACHE_CHANGE_EVENT = 'salahos:managed-prayer-board-cache-change';

export interface ManagedPrayerBoardCache {
  readonly version: 1;
  readonly displayId: string;
  readonly contentRevision: number;
  readonly config: PrayerBoardTemplateConfig;
  readonly cachedAt: string;
}

const DISPLAY_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;

function normalizeDisplayId(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Managed cache display ID must be a string');
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 160 || !DISPLAY_ID_PATTERN.test(normalized)) {
    throw new RangeError('Managed cache display ID is invalid');
  }
  return normalized;
}

function normalizeRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new RangeError('Managed cache content revision must be a non-negative integer');
  }
  return value;
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Managed cache timestamp must be a string');
  const parsed = new Date(value);
  if (
    !value.endsWith('Z') ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString() !== value
  ) {
    throw new RangeError('Managed cache timestamp must be an ISO-8601 UTC timestamp');
  }
  return value;
}

function parseManagedPrayerBoardCache(value: unknown): ManagedPrayerBoardCache {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('version' in value)
  ) {
    throw new TypeError('Managed prayer-board cache is malformed');
  }
  const source = value as Record<string, unknown>;
  if (source.version !== 1)
    throw new RangeError('Managed prayer-board cache version is unsupported');
  return Object.freeze({
    version: 1,
    displayId: normalizeDisplayId(source.displayId),
    contentRevision: normalizeRevision(source.contentRevision),
    config: parsePrayerBoardTemplateConfig(source.config),
    cachedAt: normalizeTimestamp(source.cachedAt),
  });
}

export function loadManagedPrayerBoardCache(
  storage: KeyValueStorage,
): ManagedPrayerBoardCache | null {
  const serialized = storage.getItem(MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY);
  if (serialized === null) return null;
  try {
    return parseManagedPrayerBoardCache(JSON.parse(serialized));
  } catch {
    return null;
  }
}

export function saveManagedPrayerBoardCache(
  storage: KeyValueStorage,
  input: Omit<ManagedPrayerBoardCache, 'version'>,
): ManagedPrayerBoardCache {
  const normalized = parseManagedPrayerBoardCache({ version: 1, ...input });
  storage.setItem(MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearManagedPrayerBoardCache(storage: KeyValueStorage): void {
  storage.removeItem(MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY);
}

export type ManagedPrayerBoardReconciliationAction =
  'apply-remote' | 'keep-local' | 'report-conflict';

export function reconcileManagedPrayerBoardRevision(
  local: ManagedPrayerBoardCache | null,
  remoteRevision: number,
  remoteConfig: PrayerBoardTemplateConfig,
): ManagedPrayerBoardReconciliationAction {
  const revision = normalizeRevision(remoteRevision);
  const normalizedRemote = parsePrayerBoardTemplateConfig(remoteConfig);
  if (local === null) return 'apply-remote';
  if (revision > local.contentRevision) return 'apply-remote';
  if (revision < local.contentRevision) return 'keep-local';
  return JSON.stringify(local.config) === JSON.stringify(normalizedRemote)
    ? 'keep-local'
    : 'report-conflict';
}
