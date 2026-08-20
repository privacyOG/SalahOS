import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { createMosqueProfile } from '../domain/mosqueProfile';
import type { KeyValueStorage } from './settingsStorage';
import {
  loadMosqueProfileLibrary,
  parseMosqueProfileLibrary,
  removeMosqueProfile,
  saveMosqueProfileLibrary,
  selectMosqueProfile,
  serializeMosqueProfileLibrary,
  upsertMosqueProfile,
  type MosqueProfileLibraryState,
} from './mosqueProfileLibrary';

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

const profileOne = createMosqueProfile({
  id: 'masjid-al-noor:sydney',
  name: { en: 'Masjid Al Noor', ar: 'مسجد النور' },
  description: { en: 'Local mosque profile.' },
  address: { formatted: '1 Example Street, Sydney NSW', countryCode: 'AU' },
  coordinates: createCoordinates(-33.8688, 151.2093),
  timeZone: 'Australia/Sydney',
  facilities: ['wudu', 'parking'],
  contact: { email: 'info@example.org', links: [] },
});

const profileTwo = createMosqueProfile({
  id: 'masjid-al-falah:sydney',
  name: { en: 'Masjid Al Falah' },
  address: { formatted: '2 Example Street, Sydney NSW', countryCode: 'AU' },
  coordinates: createCoordinates(-33.92, 151.05),
  timeZone: 'Australia/Sydney',
  facilities: ['women-prayer-space'],
  contact: { links: [{ kind: 'website', url: 'https://example.org/falah' }] },
});

function state(): MosqueProfileLibraryState {
  return { profiles: [profileOne, profileTwo], selectedProfileId: profileOne.id };
}

describe('mosque profile library', () => {
  it('round-trips multiple validated profiles and the selected stable ID', () => {
    expect(parseMosqueProfileLibrary(serializeMosqueProfileLibrary(state()))).toEqual(state());
  });

  it('persists and reloads multiple profiles locally', () => {
    const storage = new MemoryStorage();
    saveMosqueProfileLibrary(storage, state());

    expect(loadMosqueProfileLibrary(storage)).toEqual(state());
  });

  it('upserts, selects and removes profiles without name-based identity', () => {
    const empty: MosqueProfileLibraryState = { profiles: [], selectedProfileId: null };
    const withOne = upsertMosqueProfile(empty, profileOne);
    const withTwo = upsertMosqueProfile(withOne, profileTwo);
    const selected = selectMosqueProfile(withTwo, profileTwo.id);

    expect(selected.profiles.map((profile) => profile.id)).toEqual([profileOne.id, profileTwo.id]);
    expect(selected.selectedProfileId).toBe(profileTwo.id);

    const removed = removeMosqueProfile(selected, profileTwo.id);
    expect(removed.profiles).toEqual([profileOne]);
    expect(removed.selectedProfileId).toBeNull();
  });

  it('rejects duplicate IDs, unknown selected IDs and malformed profile data', () => {
    expect(() =>
      serializeMosqueProfileLibrary({
        profiles: [profileOne, profileOne],
        selectedProfileId: profileOne.id,
      }),
    ).toThrow(/unique/u);

    expect(() =>
      parseMosqueProfileLibrary(
        JSON.stringify({ version: 1, profiles: [profileOne], selectedProfileId: 'missing:mosque' }),
      ),
    ).toThrow(/must exist/u);

    expect(() =>
      parseMosqueProfileLibrary(
        JSON.stringify({ version: 1, profiles: [{ id: 'broken' }], selectedProfileId: null }),
      ),
    ).toThrow();
  });

  it('fails closed when persisted profile content is invalid', () => {
    const storage = new MemoryStorage();
    storage.setItem('salahos.mosqueProfileLibrary', '{"version":99}');

    expect(loadMosqueProfileLibrary(storage)).toEqual({ profiles: [], selectedProfileId: null });
  });
});
