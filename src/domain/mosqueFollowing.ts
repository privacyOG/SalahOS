import { createMosqueId, type MosqueId } from './mosqueIdentity';
import type { MosquePrayerPublication } from './mosquePrayerPublication';

export type MosqueCacheFreshness = 'missing' | 'fresh' | 'stale';

export interface CachedMosquePrayerData {
  readonly mosqueId: MosqueId;
  readonly revisionId: string;
  readonly synchronizedAt: string;
  readonly staleAfter: string;
  readonly publication: MosquePrayerPublication;
}

export interface MosqueFollowingState {
  readonly followedMosqueIds: readonly MosqueId[];
  readonly preferredMosqueId: MosqueId | null;
  readonly cachedPrayerData: readonly CachedMosquePrayerData[];
}

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function assertRevisionId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 160 || !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)) {
    throw new RangeError('Revision ID must use lowercase-safe identifier characters');
  }
  return normalized;
}

function freezeMosqueIds(values: readonly string[]): readonly MosqueId[] {
  const result: MosqueId[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const mosqueId = createMosqueId(value);
    if (seen.has(mosqueId)) continue;
    seen.add(mosqueId);
    result.push(mosqueId);
  }
  return Object.freeze(result);
}

function freezeCache(values: readonly CachedMosquePrayerData[]): readonly CachedMosquePrayerData[] {
  const byMosque = new Map<MosqueId, CachedMosquePrayerData>();
  for (const value of values) {
    const mosqueId = createMosqueId(value.mosqueId);
    if (value.publication.mosqueId !== mosqueId) {
      throw new RangeError('Cached prayer publication must belong to the cached mosque');
    }
    const synchronizedAt = assertIsoTimestamp(value.synchronizedAt, 'Synchronized at');
    const staleAfter = assertIsoTimestamp(value.staleAfter, 'Stale after');
    if (staleAfter <= synchronizedAt) {
      throw new RangeError('Stale-after timestamp must be later than synchronization time');
    }
    byMosque.set(
      mosqueId,
      Object.freeze({
        mosqueId,
        revisionId: assertRevisionId(value.revisionId),
        synchronizedAt,
        staleAfter,
        publication: value.publication,
      }),
    );
  }
  return Object.freeze([...byMosque.values()]);
}

export function createMosqueFollowingState(
  followedMosqueIds: readonly string[] = [],
  preferredMosqueId: string | null = null,
  cachedPrayerData: readonly CachedMosquePrayerData[] = [],
): MosqueFollowingState {
  const followed = freezeMosqueIds(followedMosqueIds);
  const preferred = preferredMosqueId === null ? null : createMosqueId(preferredMosqueId);
  if (preferred !== null && !followed.includes(preferred)) {
    throw new RangeError('Preferred mosque must also be followed');
  }

  const cache = freezeCache(cachedPrayerData).filter((entry) => followed.includes(entry.mosqueId));
  return Object.freeze({
    followedMosqueIds: followed,
    preferredMosqueId: preferred,
    cachedPrayerData: Object.freeze(cache),
  });
}

export function followMosque(state: MosqueFollowingState, mosqueId: string): MosqueFollowingState {
  const normalized = createMosqueId(mosqueId);
  if (state.followedMosqueIds.includes(normalized)) return state;
  return createMosqueFollowingState(
    [...state.followedMosqueIds, normalized],
    state.preferredMosqueId,
    state.cachedPrayerData,
  );
}

export function unfollowMosque(state: MosqueFollowingState, mosqueId: string): MosqueFollowingState {
  const normalized = createMosqueId(mosqueId);
  const followed = state.followedMosqueIds.filter((candidate) => candidate !== normalized);
  const preferred = state.preferredMosqueId === normalized ? null : state.preferredMosqueId;
  return createMosqueFollowingState(followed, preferred, state.cachedPrayerData);
}

export function setPreferredMosque(
  state: MosqueFollowingState,
  mosqueId: string | null,
): MosqueFollowingState {
  if (mosqueId === null) {
    return createMosqueFollowingState(state.followedMosqueIds, null, state.cachedPrayerData);
  }
  const normalized = createMosqueId(mosqueId);
  if (!state.followedMosqueIds.includes(normalized)) {
    throw new RangeError('Preferred mosque must also be followed');
  }
  return createMosqueFollowingState(
    state.followedMosqueIds,
    normalized,
    state.cachedPrayerData,
  );
}

export function cacheMosquePrayerData(
  state: MosqueFollowingState,
  entry: CachedMosquePrayerData,
): MosqueFollowingState {
  const mosqueId = createMosqueId(entry.mosqueId);
  if (!state.followedMosqueIds.includes(mosqueId)) {
    throw new RangeError('Prayer data may only be cached for a followed mosque');
  }
  const nextCache = state.cachedPrayerData.filter((candidate) => candidate.mosqueId !== mosqueId);
  nextCache.push(entry);
  return createMosqueFollowingState(state.followedMosqueIds, state.preferredMosqueId, nextCache);
}

export function cachedPrayerDataForMosque(
  state: MosqueFollowingState,
  mosqueId: string,
): CachedMosquePrayerData | null {
  const normalized = createMosqueId(mosqueId);
  return state.cachedPrayerData.find((entry) => entry.mosqueId === normalized) ?? null;
}

export function mosqueCacheFreshness(
  state: MosqueFollowingState,
  mosqueId: string,
  now: string,
): MosqueCacheFreshness {
  const current = assertIsoTimestamp(now, 'Current time');
  const cached = cachedPrayerDataForMosque(state, mosqueId);
  if (cached === null) return 'missing';
  return current >= cached.staleAfter ? 'stale' : 'fresh';
}
