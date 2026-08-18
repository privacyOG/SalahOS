import { describe, expect, it } from 'vitest';
import { createMosqueId, createMosqueOrganizationId } from './mosqueIdentity';

describe('managed mosque identities', () => {
  it('normalizes stable IDs independently of display names', () => {
    expect(createMosqueId('  Masjid-Al-Noor:Sydney  ')).toBe('masjid-al-noor:sydney');
    expect(createMosqueOrganizationId(' PrivacyOG.Mosques ')).toBe('privacyog.mosques');
  });

  it('rejects whitespace, path-like, and unstable identifiers', () => {
    expect(() => createMosqueId('a')).toThrow();
    expect(() => createMosqueId('masjid al noor')).toThrow();
    expect(() => createMosqueId('../masjid')).toThrow();
    expect(() => createMosqueOrganizationId('org/branch')).toThrow();
  });
});
