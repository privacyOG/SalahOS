import {
  validateSharedMosqueRecord,
  type SharedMosqueRecord,
} from '../domain/sharedMosqueDirectory';
import type { KeyValueStorage } from './settingsStorage';

export const SHARED_MOSQUE_DIRECTORY_CACHE_KEY = 'salahos.sharedMosqueDirectoryCache.v1';
export const SHARED_MOSQUE_DIRECTORY_OUTBOX_KEY = 'salahos.sharedMosqueDirectoryOutbox.v1';
const CACHE_LIMIT = 200;
const OUTBOX_LIMIT = 50;

export interface SharedMosqueDirectoryCache {
  readonly version: 1;
  readonly cachedAt: string;
  readonly records: readonly SharedMosqueRecord[];
}

export interface SharedMosqueDirectoryOutboxItem {
  readonly id: string;
  readonly kind: 'submission' | 'edit-suggestion' | 'claim';
  readonly createdAt: string;
  readonly payload: Readonly<Record<string, string | number | null>>;
}

function parseArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function loadSharedMosqueDirectoryCache(
  storage: KeyValueStorage,
): SharedMosqueDirectoryCache | null {
  const raw = storage.getItem(SHARED_MOSQUE_DIRECTORY_CACHE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as {
      version?: unknown;
      cachedAt?: unknown;
      records?: unknown;
    };
    if (parsed.version !== 1 || typeof parsed.cachedAt !== 'string') return null;
    if (!Number.isFinite(Date.parse(parsed.cachedAt))) return null;
    const records = parseArray(parsed.records)
      .map((value) => validateSharedMosqueRecord(value as SharedMosqueRecord))
      .slice(0, CACHE_LIMIT);
    return Object.freeze({
      version: 1,
      cachedAt: parsed.cachedAt,
      records: Object.freeze(records),
    });
  } catch {
    return null;
  }
}

export function saveSharedMosqueDirectoryCache(
  storage: KeyValueStorage,
  records: readonly SharedMosqueRecord[],
  cachedAt = new Date().toISOString(),
): SharedMosqueDirectoryCache {
  const unique = new Map<string, SharedMosqueRecord>();
  for (const record of records) {
    const validated = validateSharedMosqueRecord(record);
    unique.set(validated.id, validated);
    if (unique.size >= CACHE_LIMIT) break;
  }
  const cache: SharedMosqueDirectoryCache = Object.freeze({
    version: 1,
    cachedAt,
    records: Object.freeze([...unique.values()]),
  });
  storage.setItem(SHARED_MOSQUE_DIRECTORY_CACHE_KEY, JSON.stringify(cache));
  return cache;
}

export function mergeSharedMosqueDirectoryCache(
  storage: KeyValueStorage,
  records: readonly SharedMosqueRecord[],
  priorityIds: readonly string[] = [],
): SharedMosqueDirectoryCache {
  const existing = loadSharedMosqueDirectoryCache(storage)?.records ?? [];
  const merged = new Map<string, SharedMosqueRecord>();
  for (const record of [...records, ...existing]) {
    const validated = validateSharedMosqueRecord(record);
    if (!merged.has(validated.id)) merged.set(validated.id, validated);
  }
  const priority = new Set(priorityIds);
  const ordered = [...merged.values()].sort((left, right) => {
    const leftPriority = priority.has(left.id) ? 1 : 0;
    const rightPriority = priority.has(right.id) ? 1 : 0;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
  return saveSharedMosqueDirectoryCache(storage, ordered);
}

export function loadSharedMosqueDirectoryOutbox(
  storage: KeyValueStorage,
): readonly SharedMosqueDirectoryOutboxItem[] {
  const raw = storage.getItem(SHARED_MOSQUE_DIRECTORY_OUTBOX_KEY);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SharedMosqueDirectoryOutboxItem => {
      if (typeof item !== 'object' || item === null) return false;
      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.createdAt === 'string' &&
        typeof candidate.kind === 'string' &&
        ['submission', 'edit-suggestion', 'claim'].includes(candidate.kind) &&
        typeof candidate.payload === 'object' &&
        candidate.payload !== null
      );
    });
  } catch {
    return [];
  }
}

export function queueSharedMosqueDirectoryOutbox(
  storage: KeyValueStorage,
  item: SharedMosqueDirectoryOutboxItem,
): readonly SharedMosqueDirectoryOutboxItem[] {
  const current = loadSharedMosqueDirectoryOutbox(storage).filter((entry) => entry.id !== item.id);
  const next = [item, ...current].slice(0, OUTBOX_LIMIT);
  storage.setItem(SHARED_MOSQUE_DIRECTORY_OUTBOX_KEY, JSON.stringify(next));
  return Object.freeze(next);
}

export function clearSharedMosqueDirectoryOutboxItem(storage: KeyValueStorage, id: string): void {
  const next = loadSharedMosqueDirectoryOutbox(storage).filter((item) => item.id !== id);
  storage.setItem(SHARED_MOSQUE_DIRECTORY_OUTBOX_KEY, JSON.stringify(next));
}
