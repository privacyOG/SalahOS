import { describe, expect, it } from 'vitest';
import { getLocationSearchCatalogueSize, searchLocations } from './locationSearch';

describe('offline manual location search', () => {
  it('ships a comprehensive IANA principal-location catalogue', () => {
    expect(getLocationSearchCatalogueSize()).toBeGreaterThanOrEqual(300);
  });

  it('finds a city and returns its representative coordinates and IANA timezone', () => {
    const [sydney] = searchLocations('Sydney');
    expect(sydney).toMatchObject({
      city: 'Sydney',
      countryCodes: ['AU'],
      timeZone: 'Australia/Sydney',
      coordinates: {
        latitude: -33.866667,
        longitude: 151.216667,
      },
    });
  });

  it('supports country-name and country-code searches without network lookup', () => {
    const australia = searchLocations('Australia', { limit: 20 });
    expect(australia.some((result) => result.timeZone === 'Australia/Sydney')).toBe(true);
    expect(australia.some((result) => result.timeZone === 'Australia/Perth')).toBe(true);

    const lebanon = searchLocations('LB');
    expect(lebanon[0]).toMatchObject({ city: 'Beirut', timeZone: 'Asia/Beirut' });
  });

  it('normalizes accents, case and timezone separators', () => {
    expect(searchLocations('reykjavik')[0]?.timeZone).toBe('Atlantic/Reykjavik');
    expect(searchLocations('america buenos aires')[0]?.timeZone).toBe(
      'America/Argentina/Buenos_Aires',
    );
  });

  it('requires at least two normalized query characters and caps result count', () => {
    expect(searchLocations('a')).toEqual([]);
    expect(searchLocations('America', { limit: 3 })).toHaveLength(3);
    expect(searchLocations('America', { limit: 100 })).toHaveLength(20);
  });
});
