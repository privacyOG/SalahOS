import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { validateMosqueTimetable } from '../domain/mosqueTimetable';
import type { KeyValueStorage } from './settingsStorage';

export const MOSQUE_LIBRARY_STORAGE_KEY = 'salahos.mosqueLibrary';
export const MOSQUE_LIBRARY_SCHEMA_VERSION = 1;

export interface MosqueLibraryEntry {
  readonly id: string;
  readonly timetable: MosqueTimetable;
}

interface MosqueLibraryEnvelope {
  readonly version: 1;
  readonly entries: readonly MosqueLibraryEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mosqueLibraryId(mosqueName: string): string {
  const normalized = mosqueName.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
  if (normalized.length === 0 || normalized.length > 160) {
    throw new RangeError('Mosque name must contain 1 through 160 characters');
  }
  return normalized;
}

function parseEntry(value: unknown): MosqueLibraryEntry {
  if (!isRecord(value) || typeof value.id !== 'string' || !isRecord(value.timetable)) {
    throw new TypeError('Mosque library entry must contain an id and timetable');
  }

  const timetable = value.timetable as unknown as MosqueTimetable;
  validateMosqueTimetable(timetable);
  const id = mosqueLibraryId(timetable.mosqueName);
  if (value.id !== id) {
    throw new RangeError('Mosque library entry id does not match the timetable name');
  }
  return { id, timetable };
}

export function parseMosqueLibrary(raw: string): readonly MosqueLibraryEntry[] {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== MOSQUE_LIBRARY_SCHEMA_VERSION) {
    throw new RangeError('Unsupported mosque-library schema version');
  }
  if (!Array.isArray(parsed.entries)) {
    throw new TypeError('Mosque library entries must be an array');
  }

  const entries = parsed.entries.map(parseEntry);
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new RangeError(`Duplicate mosque library id: ${entry.id}`);
    }
    ids.add(entry.id);
  }
  return entries;
}

export function serializeMosqueLibrary(entries: readonly MosqueLibraryEntry[]): string {
  const validated = entries.map(parseEntry);
  const envelope: MosqueLibraryEnvelope = {
    version: MOSQUE_LIBRARY_SCHEMA_VERSION,
    entries: validated,
  };
  return JSON.stringify(envelope);
}

export function loadMosqueLibrary(storage: KeyValueStorage): readonly MosqueLibraryEntry[] {
  const raw = storage.getItem(MOSQUE_LIBRARY_STORAGE_KEY);
  if (raw === null) return [];
  try {
    return parseMosqueLibrary(raw);
  } catch {
    return [];
  }
}

export function saveMosqueLibrary(
  storage: KeyValueStorage,
  entries: readonly MosqueLibraryEntry[],
): void {
  storage.setItem(MOSQUE_LIBRARY_STORAGE_KEY, serializeMosqueLibrary(entries));
}

export function upsertMosqueTimetable(
  entries: readonly MosqueLibraryEntry[],
  timetable: MosqueTimetable,
): readonly MosqueLibraryEntry[] {
  validateMosqueTimetable(timetable);
  const id = mosqueLibraryId(timetable.mosqueName);
  const next: MosqueLibraryEntry = { id, timetable };
  const existingIndex = entries.findIndex((entry) => entry.id === id);
  if (existingIndex === -1) return [...entries, next];
  return entries.map((entry, index) => (index === existingIndex ? next : entry));
}

export function removeMosqueTimetable(
  entries: readonly MosqueLibraryEntry[],
  id: string,
): readonly MosqueLibraryEntry[] {
  return entries.filter((entry) => entry.id !== id);
}
