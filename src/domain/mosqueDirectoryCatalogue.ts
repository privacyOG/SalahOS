import type { AustralianMosqueDirectory } from './australianMosqueDirectory';
import {
  enrichAustralianMosqueRecord,
  enrichSharedMosqueRecord,
  resolveMosqueDirectoryEntities,
  type EnrichedMosqueDirectoryRecord,
} from './mosqueDirectoryEnrichment';
import type { SharedMosqueRecord } from './sharedMosqueDirectory';

export interface MosqueDirectoryCatalogueInput {
  readonly australianDirectory?: AustralianMosqueDirectory | null;
  readonly sharedRecords?: readonly SharedMosqueRecord[];
}

export function buildEnrichedMosqueDirectoryCatalogue(
  input: MosqueDirectoryCatalogueInput,
  now: Date = new Date(),
): readonly EnrichedMosqueDirectoryRecord[] {
  const records: EnrichedMosqueDirectoryRecord[] = [];
  if (input.australianDirectory !== null && input.australianDirectory !== undefined) {
    for (const record of input.australianDirectory.records) {
      records.push(enrichAustralianMosqueRecord(record, input.australianDirectory, now));
    }
  }
  for (const record of input.sharedRecords ?? []) {
    records.push(enrichSharedMosqueRecord(record, now));
  }
  return resolveMosqueDirectoryEntities(records, now);
}
