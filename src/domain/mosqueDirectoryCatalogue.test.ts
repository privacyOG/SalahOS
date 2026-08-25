import { describe, expect, it } from 'vitest';

import type { AustralianMosqueDirectory } from './australianMosqueDirectory';
import { buildEnrichedMosqueDirectoryCatalogue } from './mosqueDirectoryCatalogue';
import type { SharedMosqueRecord } from './sharedMosqueDirectory';

const timestamp = '2026-08-24T10:38:06.000Z';
const now = new Date('2026-08-25T00:00:00.000Z');

const australianDirectory: AustralianMosqueDirectory = {
  schemaVersion: 1,
  source: {
    name: 'OpenStreetMap contributors',
    licence: 'ODbL-1.0',
    attributionUrl: 'https://www.openstreetmap.org/copyright',
    licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    overpassQueryTemplate: 'fixture',
    regionCodes: ['AU-NSW'],
    osmBaseTimestamp: timestamp,
    rawElementCount: 1,
    recordCount: 1,
    skippedOrDeduplicatedCount: 0,
  },
  records: [
    {
      id: 'osm-node-500',
      osmType: 'node',
      osmId: 500,
      name: 'Unity Mosque',
      address: '1 Unity Street, Lakemba NSW 2195, Australia',
      regionCode: 'AU-NSW',
      state: 'NSW',
      latitude: -33.92,
      longitude: 151.075,
      website: 'https://unity.example/',
    },
  ],
};

const sharedDuplicate: SharedMosqueRecord = {
  id: 'community-unity',
  name: 'Unity Mosque',
  nameAr: null,
  address: '1 Unity Street, Lakemba NSW 2195, Australia',
  countryCode: 'AU',
  latitude: -33.92001,
  longitude: 151.07501,
  timeZone: 'Australia/Sydney',
  website: 'https://unity.example/',
  phone: '+61 2 9000 1000',
  source: 'community',
  verification: { state: 'verified', verifiedAt: timestamp, claimedAt: null },
  revision: 2,
  updatedAt: timestamp,
};

describe('buildEnrichedMosqueDirectoryCatalogue', () => {
  it('merges duplicate OSM/community entities and retains both source records', () => {
    const catalogue = buildEnrichedMosqueDirectoryCatalogue(
      { australianDirectory, sharedRecords: [sharedDuplicate] },
      now,
    );

    expect(catalogue).toHaveLength(1);
    expect(catalogue[0]?.sourceRecordIds).toEqual(
      expect.arrayContaining(['osm-node-500', 'community-unity']),
    );
    expect(catalogue[0]?.contact.phone).toBe('+61 2 9000 1000');
    expect(catalogue[0]?.verification.state).toBe('verified');
    expect(catalogue[0]?.provenance.map((entry) => entry.sourceKind)).toEqual(
      expect.arrayContaining(['openstreetmap', 'community']),
    );
  });
});
