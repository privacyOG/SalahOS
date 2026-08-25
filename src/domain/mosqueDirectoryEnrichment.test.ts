import { describe, expect, it } from 'vitest';

import type { AustralianMosqueDirectory, AustralianMosqueRecord } from './australianMosqueDirectory';
import {
  createEnrichedMosqueDirectoryRecord,
  enrichAustralianMosqueRecord,
  likelySameMosque,
  mergeEnrichedMosqueDirectoryRecords,
  mosqueDirectoryEntityMatchScore,
  resolveMosqueDirectoryEntities,
} from './mosqueDirectoryEnrichment';

const snapshotTime = '2026-08-24T10:38:06.000Z';
const now = new Date('2026-08-25T00:00:00.000Z');

const directory: AustralianMosqueDirectory = {
  schemaVersion: 1,
  source: {
    name: 'OpenStreetMap contributors',
    licence: 'ODbL-1.0',
    attributionUrl: 'https://www.openstreetmap.org/copyright',
    licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    overpassQueryTemplate: 'fixture',
    regionCodes: ['AU-NSW'],
    osmBaseTimestamp: snapshotTime,
    rawElementCount: 1,
    recordCount: 1,
    skippedOrDeduplicatedCount: 0,
  },
  records: [],
};

const australianRecord: AustralianMosqueRecord = {
  id: 'osm-node-123',
  osmType: 'node',
  osmId: 123,
  name: 'Example Islamic Centre',
  address: '10 Example Street, Lakemba, NSW, 2195, Australia',
  regionCode: 'AU-NSW',
  state: 'NSW',
  latitude: -33.919,
  longitude: 151.075,
  website: 'https://example.org/',
  phone: '+61 2 9000 0000',
};

function officialRecord() {
  return createEnrichedMosqueDirectoryRecord(
    {
      id: 'official-example-centre',
      sourceRecordIds: ['official-example-centre'],
      name: 'Example Islamic Centre',
      aliases: ['Example Mosque'],
      address: {
        formatted: '10 Example Street, Lakemba NSW 2195, Australia',
        locality: 'Lakemba',
        region: 'NSW',
        postcode: '2195',
        countryCode: 'AU',
      },
      latitude: -33.91902,
      longitude: 151.07501,
      timeZone: 'Australia/Sydney',
      contact: {
        phone: '+61 2 9000 0000',
        email: 'office@example.org',
        website: 'https://example.org/',
        social: [{ platform: 'facebook', url: 'https://facebook.com/examplemosque' }],
      },
      prayerTimes: {
        fajr: '05:10',
        dhuhr: '12:05',
        asr: '15:15',
        maghrib: '17:40',
        isha: '19:00',
        timetableUrl: 'https://example.org/timetable',
        sourceLabel: 'Official timetable',
        updatedAt: '2026-08-24T08:00:00.000Z',
      },
      jumuahTimes: [{ time: '13:00', label: 'First Jumuah' }],
      facilities: ['wudu', 'parking', 'women-prayer-space'],
      services: ['classes', 'youth'],
      verification: {
        state: 'claimed',
        verifiedAt: '2026-08-24T09:00:00.000Z',
        verifiedBy: 'Example Islamic Centre',
        lastReviewedAt: '2026-08-24T09:00:00.000Z',
      },
      provenance: [
        {
          sourceId: 'official:https://example.org',
          sourceKind: 'official-website',
          sourceLabel: 'Example Islamic Centre',
          sourceUrl: 'https://example.org/',
          observedAt: '2026-08-24T09:00:00.000Z',
          confidence: 1,
          fields: [
            'name',
            'aliases',
            'address',
            'coordinates',
            'phone',
            'email',
            'website',
            'social',
            'prayer-times',
            'jumuah-times',
            'facilities',
            'services',
          ],
        },
      ],
      conflictCount: 0,
    },
    now,
  );
}

describe('mosque directory enrichment', () => {
  it('adapts the Australian OSM seed with field-level provenance and freshness', () => {
    const enriched = enrichAustralianMosqueRecord(australianRecord, directory, now);

    expect(enriched.address.postcode).toBe('2195');
    expect(enriched.provenance).toHaveLength(1);
    expect(enriched.provenance[0]?.fields).toContain('website');
    expect(enriched.quality.freshness).toBe('fresh');
    expect(enriched.quality.provenanceCoveragePercent).toBe(100);
    expect(enriched.quality.score).toBeGreaterThan(40);
  });

  it('scores official and OSM representations as the same real-world mosque', () => {
    const osm = enrichAustralianMosqueRecord(australianRecord, directory, now);
    const official = officialRecord();

    expect(mosqueDirectoryEntityMatchScore(osm, official)).toBeGreaterThanOrEqual(0.65);
    expect(likelySameMosque(osm, official)).toBe(true);
  });

  it('merges richer official fields without losing OSM provenance', () => {
    const osm = enrichAustralianMosqueRecord(australianRecord, directory, now);
    const official = officialRecord();
    const merged = mergeEnrichedMosqueDirectoryRecords(osm, official, now);

    expect(merged.contact.email).toBe('office@example.org');
    expect(merged.prayerTimes?.timetableUrl).toBe('https://example.org/timetable');
    expect(merged.jumuahTimes[0]?.time).toBe('13:00');
    expect(merged.facilities).toContain('women-prayer-space');
    expect(merged.services).toContain('youth');
    expect(merged.verification.state).toBe('claimed');
    expect(merged.provenance.map((entry) => entry.sourceKind)).toEqual(
      expect.arrayContaining(['openstreetmap', 'official-website']),
    );
    expect(merged.sourceRecordIds).toEqual(
      expect.arrayContaining(['osm-node-123', 'official-example-centre']),
    );
  });

  it('resolves duplicate entities while retaining unrelated nearby mosques', () => {
    const osm = enrichAustralianMosqueRecord(australianRecord, directory, now);
    const official = officialRecord();
    const other = createEnrichedMosqueDirectoryRecord(
      {
        ...official,
        id: 'other-mosque',
        sourceRecordIds: ['other-mosque'],
        name: 'Different Mosque',
        address: { formatted: '40 Other Road, Bankstown NSW 2200', countryCode: 'AU' },
        latitude: -33.918,
        longitude: 151.03,
        contact: { social: [] },
        provenance: [
          {
            sourceId: 'community:other',
            sourceKind: 'community',
            sourceLabel: 'Community submission',
            observedAt: snapshotTime,
            confidence: 0.7,
            fields: ['name', 'address', 'coordinates'],
          },
        ],
        verification: { state: 'unverified', verifiedAt: null, lastReviewedAt: snapshotTime },
        prayerTimes: null,
        jumuahTimes: [],
        facilities: [],
        services: [],
        conflictCount: 0,
      },
      now,
    );

    const resolved = resolveMosqueDirectoryEntities([osm, official, other], now);
    expect(resolved).toHaveLength(2);
    expect(resolved.some((record) => record.sourceRecordIds.length === 2)).toBe(true);
  });
});
