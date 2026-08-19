import { describe, expect, it } from 'vitest';

import { assertPublicApiPayload, buildPublicApiPath, createPublicApiPolicy } from './publicApi';

describe('public API contract', () => {
  it('defines versioned read-only endpoints with cache and rate-limit metadata', () => {
    const policy = createPublicApiPolicy();

    expect(policy.version).toBe('v1');
    expect(policy.endpoints).toHaveLength(3);
    expect(policy.endpoints.every((endpoint) => endpoint.method === 'GET')).toBe(true);
    expect(policy.endpoints.every((endpoint) => endpoint.cacheControl.startsWith('public'))).toBe(
      true,
    );
    expect(policy.endpoints.every((endpoint) => endpoint.rateLimitPerMinute > 0)).toBe(true);
  });

  it('builds deterministic profile, daily prayer and monthly timetable paths', () => {
    expect(buildPublicApiPath('profile', 'Masjid.One')).toBe('/api/v1/mosques/masjid.one');
    expect(buildPublicApiPath('daily-prayers', 'masjid.one', '2026-08-20')).toBe(
      '/api/v1/mosques/masjid.one/prayers/2026-08-20',
    );
    expect(buildPublicApiPath('monthly-timetable', 'masjid.one', '2026-08')).toBe(
      '/api/v1/mosques/masjid.one/timetables/2026-08',
    );
  });

  it('rejects invalid dates, months and identifiers', () => {
    expect(() => buildPublicApiPath('profile', 'bad id')).toThrow(/identifier/u);
    expect(() => buildPublicApiPath('daily-prayers', 'masjid.one', '2026-02-30')).toThrow(
      /valid Gregorian date/u,
    );
    expect(() => buildPublicApiPath('monthly-timetable', 'masjid.one', '2026-13')).toThrow(
      /valid Gregorian month/u,
    );
  });

  it('forbids private administration and member fields in public payloads', () => {
    expect(() => assertPublicApiPayload({ mosqueId: 'masjid.one', prayers: {} })).not.toThrow();
    expect(() => assertPublicApiPayload({ mosqueId: 'masjid.one', members: [] })).toThrow(
      /forbidden field: members/u,
    );
    expect(() => assertPublicApiPayload({ pairingCodes: [] })).toThrow(
      /forbidden field: pairingCodes/u,
    );
  });
});
