import { describe, expect, it } from 'vitest';
import {
  australianMosqueDirectory,
  australianMosqueToProfile,
  australianMosques,
  searchAustralianMosques,
  sortAustralianMosquesByDistance,
} from './australianMosqueDirectoryCombined';
import { createCoordinates } from './coordinates';

describe('combined Australian mosque directory', () => {
  it('exposes the deduplicated 254-record combined snapshot across all regions', () => {
    expect(australianMosqueDirectory.schemaVersion).toBe(2);
    expect(australianMosqueDirectory.source.recordCount).toBe(254);
    expect(australianMosques).toHaveLength(254);
    expect(new Set(australianMosques.map((mosque) => mosque.regionCode))).toEqual(
      new Set(['AU-ACT', 'AU-NSW', 'AU-NT', 'AU-QLD', 'AU-SA', 'AU-TAS', 'AU-VIC', 'AU-WA']),
    );
  });

  it('searches Finder-only records and preserves their enriched source facts', () => {
    const results = searchAustralianMosques(australianMosques, 'Erskine Musallah');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'mosque-finder:sydney-cbd-erskine-musallah',
      name: 'Sydney CBD - Erskine Musallah',
    });
    expect(results[0]?.enriched.prayerTimes?.dhuhr).toBe('1:15 pm');
  });

  it('creates a timezone-aware mosque profile and retains private local distance ordering', () => {
    const mosque = australianMosques.find((candidate) => candidate.id === 'osm-node-3318094580');
    if (mosque === undefined) throw new Error('Al Hijrah fixture is missing');
    const profile = australianMosqueToProfile(mosque);
    expect(profile.id).toBe(mosque.id);
    expect(profile.timeZone).toBe('Australia/Sydney');

    const nearest = sortAustralianMosquesByDistance(
      australianMosques,
      createCoordinates(-33.8688, 151.2093),
    );
    expect(nearest).toHaveLength(254);
    expect(nearest[0]?.distanceKm).toBeGreaterThanOrEqual(0);
    expect(nearest[1]?.distanceKm ?? 0).toBeGreaterThanOrEqual(nearest[0]?.distanceKm ?? 0);
  });
});
