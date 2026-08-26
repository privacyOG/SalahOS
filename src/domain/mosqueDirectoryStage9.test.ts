import { describe, expect, it } from 'vitest';

import {
  calculateMosqueDirectoryQuality,
  createEnrichedMosqueDirectoryRecord,
  type EnrichedMosqueDirectoryRecord,
} from './mosqueDirectoryEnrichment';

function baseRecord(observedAt = '2026-08-25T00:00:00.000Z', conflictCount = 0) {
  return {
    id: 'stage9-quality-mosque',
    sourceRecordIds: ['stage9-quality-mosque'],
    name: 'Stage 9 Quality Mosque',
    aliases: ['Stage 9 Masjid'],
    address: {
      formatted: '10 Example Street, Sydney NSW 2000, Australia',
      locality: 'Sydney',
      region: 'NSW',
      postcode: '2000',
      countryCode: 'AU',
    },
    latitude: -33.8688,
    longitude: 151.2093,
    timeZone: 'Australia/Sydney',
    contact: {
      phone: '+61 2 9000 0000',
      email: 'office@example.org',
      website: 'https://example.org/',
      social: [{ platform: 'facebook' as const, url: 'https://facebook.com/example' }],
    },
    prayerTimes: {
      fajr: '05:10',
      dhuhr: '12:05',
      asr: '15:15',
      maghrib: '17:40',
      isha: '19:00',
      timetableUrl: 'https://example.org/timetable',
      updatedAt: observedAt,
    },
    jumuahTimes: [{ time: '13:00', label: 'First Jumuah' }],
    facilities: ['wudu' as const, 'parking' as const],
    services: ['classes' as const, 'youth' as const],
    verification: {
      state: 'verified' as const,
      verifiedAt: observedAt,
      verifiedBy: 'Stage 9 verifier',
      lastReviewedAt: observedAt,
    },
    provenance: [
      {
        sourceId: 'official:https://example.org',
        sourceKind: 'official-website' as const,
        sourceLabel: 'Stage 9 official fixture',
        sourceUrl: 'https://example.org/',
        observedAt,
        confidence: 1,
        fields: [
          'name' as const,
          'aliases' as const,
          'address' as const,
          'coordinates' as const,
          'phone' as const,
          'email' as const,
          'website' as const,
          'social' as const,
          'prayer-times' as const,
          'jumuah-times' as const,
          'facilities' as const,
          'services' as const,
        ],
      },
    ],
    conflictCount,
  };
}

describe('Stage 9 mosque directory data quality', () => {
  it('classifies the same sourced record as fresh, aging and stale at release boundaries', () => {
    const input = baseRecord('2026-01-01T00:00:00.000Z');

    expect(calculateMosqueDirectoryQuality(input, new Date('2026-03-31T00:00:00.000Z')).freshness).toBe(
      'fresh',
    );
    expect(calculateMosqueDirectoryQuality(input, new Date('2026-04-02T00:00:00.000Z')).freshness).toBe(
      'aging',
    );
    expect(calculateMosqueDirectoryQuality(input, new Date('2027-01-02T00:00:00.000Z')).freshness).toBe(
      'stale',
    );
  });

  it('penalizes unresolved conflicts without losing completeness or provenance coverage', () => {
    const now = new Date('2026-08-26T00:00:00.000Z');
    const clean = calculateMosqueDirectoryQuality(baseRecord('2026-08-25T00:00:00.000Z', 0), now);
    const conflicted = calculateMosqueDirectoryQuality(
      baseRecord('2026-08-25T00:00:00.000Z', 2),
      now,
    );

    expect(clean.completenessPercent).toBe(100);
    expect(clean.provenanceCoveragePercent).toBe(100);
    expect(conflicted.completenessPercent).toBe(clean.completenessPercent);
    expect(conflicted.provenanceCoveragePercent).toBe(clean.provenanceCoveragePercent);
    expect(conflicted.score).toBe(clean.score - 16);
    expect(conflicted.conflictCount).toBe(2);
  });

  it('drops unsafe contact URLs instead of exposing them as mosque actions', () => {
    const record: EnrichedMosqueDirectoryRecord = createEnrichedMosqueDirectoryRecord(
      {
        ...baseRecord(),
        contact: {
          phone: '+61 2 9000 0000',
          email: 'office@example.org',
          website: 'javascript:alert(1)',
          social: [
            { platform: 'facebook', url: 'javascript:alert(2)' },
            { platform: 'instagram', url: 'https://instagram.com/example' },
          ],
        },
      },
      new Date('2026-08-26T00:00:00.000Z'),
    );

    expect(record.contact.website).toBeUndefined();
    expect(record.contact.social).toEqual([
      { platform: 'instagram', url: 'https://instagram.com/example' },
    ]);
    expect(record.quality.completenessPercent).toBeLessThan(100);
  });
});
