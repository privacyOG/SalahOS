import { describe, expect, it } from 'vitest';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import {
  loadMosqueLibrary,
  mosqueLibraryId,
  parseMosqueLibrary,
  removeMosqueTimetable,
  saveMosqueLibrary,
  upsertMosqueTimetable,
} from './mosqueLibrary';
import type { KeyValueStorage } from './settingsStorage';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const timetable: MosqueTimetable = {
  mosqueName: 'Example Mosque',
  days: [
    {
      date: '2026-08-21',
      prayers: {
        fajr: { startLocalMinutes: 330, iqamah: { kind: 'offset', offsetMinutes: 20 } },
        dhuhr: { startLocalMinutes: 750, iqamah: { kind: 'fixed', localMinutes: 780 } },
      },
      jumuahSessions: [{ label: 'First', khutbahLocalMinutes: 750, salahLocalMinutes: 780 }],
    },
  ],
};

describe('mosque timetable library', () => {
  it('round-trips validated timetables through storage', () => {
    const storage = new MemoryStorage();
    const entries = upsertMosqueTimetable([], timetable);
    saveMosqueLibrary(storage, entries);
    expect(loadMosqueLibrary(storage)).toEqual(entries);
  });

  it('uses normalized mosque names as stable ids and updates in place', () => {
    const first = upsertMosqueTimetable([], timetable);
    const updatedTimetable: MosqueTimetable = { ...timetable, mosqueName: '  Example   Mosque  ' };
    const second = upsertMosqueTimetable(first, updatedTimetable);

    expect(mosqueLibraryId(' Example   Mosque ')).toBe('example mosque');
    expect(second).toHaveLength(1);
    expect(second[0]?.timetable.mosqueName).toBe('  Example   Mosque  ');
    expect(removeMosqueTimetable(second, 'example mosque')).toEqual([]);
  });

  it('rejects duplicate ids and invalid nested timetable data', () => {
    const id = mosqueLibraryId(timetable.mosqueName);
    expect(() =>
      parseMosqueLibrary(
        JSON.stringify({
          version: 1,
          entries: [
            { id, timetable },
            { id, timetable },
          ],
        }),
      ),
    ).toThrow(/Duplicate/);

    expect(() =>
      parseMosqueLibrary(
        JSON.stringify({
          version: 1,
          entries: [
            {
              id: 'broken mosque',
              timetable: {
                mosqueName: 'Broken Mosque',
                days: [{ date: 'bad-date', prayers: {} }],
              },
            },
          ],
        }),
      ),
    ).toThrow();
  });

  it('falls back to an empty library when persisted data is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('salahos.mosqueLibrary', '{broken');
    expect(loadMosqueLibrary(storage)).toEqual([]);
  });
});
