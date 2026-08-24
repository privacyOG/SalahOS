import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  findPotentialSharedMosqueDuplicate,
  searchSharedMosques,
  sharedMosqueToProfile,
  type SharedMosqueRecord,
} from './sharedMosqueDirectory';

const records: readonly SharedMosqueRecord[] = [
  {
    id: 'lakemba-example',
    name: 'Lakemba Community Mosque',
    nameAr: 'مسجد لاكمبا',
    address: '1 Example Street, Lakemba NSW 2195',
    countryCode: 'AU',
    latitude: -33.9195,
    longitude: 151.075,
    timeZone: 'Australia/Sydney',
    website: 'https://example.org/',
    phone: '+61 2 9000 0000',
    source: 'community',
    verification: { state: 'claimed', verifiedAt: '2026-08-01T00:00:00Z', claimedAt: '2026-08-02T00:00:00Z' },
    revision: 4,
    updatedAt: '2026-08-23T00:00:00Z',
  },
  {
    id: 'auburn-example',
    name: 'Auburn Mosque',
    nameAr: null,
    address: '2 Example Road, Auburn NSW 2144',
    countryCode: 'AU',
    latitude: -33.849,
    longitude: 151.033,
    timeZone: 'Australia/Sydney',
    website: null,
    phone: null,
    source: 'community',
    verification: { state: 'verified', verifiedAt: '2026-08-01T00:00:00Z', claimedAt: null },
    revision: 2,
    updatedAt: '2026-08-22T00:00:00Z',
  },
];

describe('shared mosque directory', () => {
  it('searches names and addresses and orders nearby results by distance', () => {
    expect(searchSharedMosques(records, { query: 'lakemba' })).toHaveLength(1);
    const nearby = searchSharedMosques(records, {
      coordinates: createCoordinates(-33.91, 151.08),
      radiusKm: 30,
    });
    expect(nearby).toHaveLength(2);
    expect(nearby[0]?.mosque.id).toBe('lakemba-example');
    expect(nearby[0]?.distanceKm).toBeTypeOf('number');
  });

  it('detects duplicate submissions by normalized name/address and proximity', () => {
    const duplicate = findPotentialSharedMosqueDuplicate(records, {
      name: '  Lakemba Community Mosque ',
      address: 'Different wording',
      countryCode: 'AU',
      latitude: -33.9198,
      longitude: 151.0752,
      timeZone: 'Australia/Sydney',
    });
    expect(duplicate?.id).toBe('lakemba-example');
  });

  it('converts a shared record into the existing mosque profile domain', () => {
    const profile = sharedMosqueToProfile(records[0]!);
    expect(profile.id).toBe('shared-lakemba-example');
    expect(profile.name.en).toBe('Lakemba Community Mosque');
    expect(profile.contact.links[0]?.url).toBe('https://example.org/');
    expect(profile.timeZone).toBe('Australia/Sydney');
  });
});
