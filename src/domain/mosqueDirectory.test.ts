import { describe, expect, it } from 'vitest';

import { createMosqueId } from './mosqueIdentity';
import { createMosqueDirectoryQuery, sortMosqueDirectoryResults } from './mosqueDirectory';

describe('mosque directory', () => {
  it('keeps broad-area search free of precise coordinates', () => {
    expect(
      createMosqueDirectoryQuery({
        text: 'Lakemba',
        area: 'Sydney NSW',
        mode: 'broad-area',
        coordinates: null,
      }),
    ).toEqual({
      text: 'Lakemba',
      area: 'Sydney NSW',
      mode: 'broad-area',
      coordinates: null,
    });

    expect(() =>
      createMosqueDirectoryQuery({
        text: 'Lakemba',
        area: 'Sydney NSW',
        mode: 'broad-area',
        coordinates: { latitude: -33.92, longitude: 151.08 },
      }),
    ).toThrow('Broad-area mosque search must not include precise coordinates');
  });

  it('requires explicit coordinates for nearby search', () => {
    expect(() =>
      createMosqueDirectoryQuery({
        text: 'mosque',
        area: null,
        mode: 'nearby',
        coordinates: null,
      }),
    ).toThrow('Nearby mosque search requires explicit coordinates');
  });

  it('sorts followed mosques first and then by display name', () => {
    const results = sortMosqueDirectoryResults([
      {
        mosqueId: createMosqueId('mosque-z'),
        name: { en: 'Z Mosque' },
        areaLabel: 'Sydney',
        addressLabel: '2 Example Street',
        prayerSourceLabel: 'Managed timetable',
        synchronizedAt: null,
        followed: false,
      },
      {
        mosqueId: createMosqueId('mosque-a'),
        name: { en: 'A Mosque' },
        areaLabel: 'Sydney',
        addressLabel: '1 Example Street',
        prayerSourceLabel: 'Managed timetable',
        synchronizedAt: '2026-08-19T10:00:00.000Z',
        followed: true,
      },
    ]);

    expect(results.map((result) => result.mosqueId)).toEqual(['mosque-a', 'mosque-z']);
  });
});
