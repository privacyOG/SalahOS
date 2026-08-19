import type { Coordinates } from './coordinates';
import type { MosqueId } from './mosqueIdentity';
import type { LocalizedMosqueText } from './mosqueProfile';

export type MosqueDirectorySearchMode = 'broad-area' | 'nearby';

export interface MosqueDirectoryQuery {
  readonly text: string;
  readonly area: string | null;
  readonly mode: MosqueDirectorySearchMode;
  readonly coordinates: Coordinates | null;
}

export interface MosqueDirectoryResult {
  readonly mosqueId: MosqueId;
  readonly name: LocalizedMosqueText;
  readonly areaLabel: string;
  readonly addressLabel: string;
  readonly prayerSourceLabel: string;
  readonly synchronizedAt: string | null;
  readonly followed: boolean;
}

function normalizeText(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0 || normalized.length > maximumLength) {
    throw new RangeError(`${label} must contain 1-${String(maximumLength)} characters`);
  }
  return normalized;
}

function normalizeOptionalText(value: string | null, label: string): string | null {
  return value === null ? null : normalizeText(value, label, 160);
}

export function createMosqueDirectoryQuery(input: MosqueDirectoryQuery): MosqueDirectoryQuery {
  const text = normalizeText(input.text, 'Search text', 160);
  const area = normalizeOptionalText(input.area, 'Search area');

  if (input.mode === 'broad-area' && input.coordinates !== null) {
    throw new TypeError('Broad-area mosque search must not include precise coordinates');
  }
  if (input.mode === 'nearby' && input.coordinates === null) {
    throw new TypeError('Nearby mosque search requires explicit coordinates');
  }

  return Object.freeze({
    text,
    area,
    mode: input.mode,
    coordinates: input.coordinates,
  });
}

export function sortMosqueDirectoryResults(
  results: readonly MosqueDirectoryResult[],
): readonly MosqueDirectoryResult[] {
  return Object.freeze(
    [...results].sort((left, right) => {
      if (left.followed !== right.followed) return left.followed ? -1 : 1;
      const leftName = left.name.en ?? left.name.ar ?? '';
      const rightName = right.name.en ?? right.name.ar ?? '';
      return leftName.localeCompare(rightName);
    }),
  );
}
