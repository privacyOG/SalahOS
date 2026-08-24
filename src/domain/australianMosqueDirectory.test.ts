import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  australianMosqueDirectory,
  australianMosques,
  australianMosqueToProfile,
  searchAustralianMosques,
  sortAustralianMosquesByDistance,
} from './australianMosqueDirectory';

describe('Australian mosque directory', () => {
  it('loads the bundled OSM snapshot with explicit ODbL provenance', () => {
    expect(australianMosqueDirectory.schemaVersion).toBe(1);
    expect(australianMosqueDirectory.source.name).toBe('OpenStreetMap contributors');
    expect(australianMosqueDirectory.source.licence).toBe('ODbL-1.0');
    expect(australianMosqueDirectory.source.recordCount).toBe(106);
    expect(australianMosqueDirectory.source.rawElementCount).toBe(122);
    expect(australianMosques).toHaveLength(106);
    expect(new Set(australianMosques.map((mosque) => mosque.id)).size).toBe(106);
  });

  it('searches names, addresses, states and Arabic text on device', () => {
    expect(
      searchAustralianMosques(australianMosques, 'Tempe').map((mosque) => mosque.name),
    ).toContain('Al Hijrah Mosque');
    expect(
      searchAustralianMosques(australianMosques, 'Auburn NSW').map((mosque) => mosque.name),
    ).toContain('Auburn Gallipoli Mosque');
    expect(searchAustralianMosques(australianMosques, 'definitely-not-a-mosque')).toEqual([]);
  });

  it('orders nearby mosques by haversine distance from a saved location', () => {
    const from = createCoordinates(-33.9164673, 151.0282113);
    const nearby = sortAustralianMosquesByDistance(australianMosques, from);
    expect(nearby[0]?.mosque.name).toBe('Al Amanah');
    expect(nearby[0]?.distanceKm).toBeCloseTo(0, 8);
    expect(nearby[1]?.distanceKm).toBeGreaterThanOrEqual(nearby[0]?.distanceKm ?? 0);
  });

  it('converts a directory result into the existing local mosque profile model', () => {
    const record = australianMosques.find((mosque) => mosque.name === 'Al Hijrah Mosque');
    expect(record).toBeDefined();
    if (record === undefined) return;

    const profile = australianMosqueToProfile(record);
    expect(profile.id).toBe(record.id);
    expect(profile.name.en).toBe('Al Hijrah Mosque');
    expect(profile.address.countryCode).toBe('AU');
    expect(profile.timeZone).toBe('Australia/Sydney');
    expect(profile.contact.phone).toBe('+61 2 9591 1593');
    expect(profile.contact.links[0]?.url).toBe('https://cide.org.au/');
  });
});
