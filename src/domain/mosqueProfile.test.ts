import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { createMosqueOrganization, createMosqueProfile } from './mosqueProfile';

function validProfile() {
  return {
    id: 'masjid-al-noor:sydney',
    organizationId: 'privacyog.mosques',
    parentMosqueId: 'privacyog-campus',
    name: { en: 'Masjid Al Noor', ar: 'مسجد النور' },
    description: { en: 'Community mosque', ar: 'مسجد المجتمع' },
    address: { formatted: '1 Example Street, Sydney NSW 2000', countryCode: 'au' },
    coordinates: createCoordinates(-33.8688, 151.2093),
    timeZone: 'Australia/Sydney',
    facilities: ['wudu', 'parking', 'wheelchair-accessible'] as const,
    accessibilityNotes: { en: 'Step-free entrance' },
    contact: {
      email: 'INFO@EXAMPLE.ORG',
      phone: '+61 2 9000 0000',
      links: [
        { kind: 'website' as const, url: 'https://example.org' },
        {
          kind: 'registration' as const,
          url: 'https://example.org/events',
          label: { en: 'Events' },
        },
      ],
    },
    logo: {
      assetId: 'mosque-logo-v1',
      mimeType: 'image/webp' as const,
      byteSize: 125_000,
      width: 1024,
      height: 1024,
    },
  };
}

describe('managed mosque profile', () => {
  it('creates an immutable normalized bilingual profile with stable relationships', () => {
    const profile = createMosqueProfile(validProfile());

    expect(profile.id).toBe('masjid-al-noor:sydney');
    expect(profile.organizationId).toBe('privacyog.mosques');
    expect(profile.parentMosqueId).toBe('privacyog-campus');
    expect(profile.name).toEqual({ en: 'Masjid Al Noor', ar: 'مسجد النور' });
    expect(profile.address.countryCode).toBe('AU');
    expect(profile.contact.email).toBe('info@example.org');
    expect(profile.contact.links[0]?.url).toBe('https://example.org/');
    expect(profile.coordinates).toEqual({ latitude: -33.8688, longitude: 151.2093 });
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.name)).toBe(true);
    expect(Object.isFrozen(profile.facilities)).toBe(true);
    expect(Object.isFrozen(profile.contact.links)).toBe(true);
  });

  it('supports organizations with unique stable branch identities', () => {
    const organization = createMosqueOrganization({
      id: 'privacyog.mosques',
      name: { en: 'PrivacyOG Mosques', ar: 'مساجد برايفسي أو جي' },
      branchIds: ['masjid-al-noor:sydney', 'masjid-al-noor:bankstown'],
    });

    expect(organization.branchIds).toEqual([
      'masjid-al-noor:sydney',
      'masjid-al-noor:bankstown',
    ]);
    expect(Object.isFrozen(organization.branchIds)).toBe(true);
  });

  it('rejects profiles without a usable bilingual name or supported timezone', () => {
    expect(() => createMosqueProfile({ ...validProfile(), name: {} })).toThrow(
      'Mosque name requires at least one English or Arabic value',
    );
    expect(() => createMosqueProfile({ ...validProfile(), timeZone: 'Not/A_Timezone' })).toThrow(
      'Timezone must be a supported IANA timezone identifier',
    );
  });

  it('rejects self-parent relationships and duplicate organization branches', () => {
    expect(() =>
      createMosqueProfile({
        ...validProfile(),
        parentMosqueId: 'masjid-al-noor:sydney',
      }),
    ).toThrow('A mosque profile cannot be its own parent');

    expect(() =>
      createMosqueOrganization({
        id: 'privacyog.mosques',
        name: { en: 'PrivacyOG Mosques' },
        branchIds: ['masjid-al-noor:sydney', 'MASJID-AL-NOOR:SYDNEY'],
      }),
    ).toThrow('Mosque organization branch IDs must be unique');
  });

  it('rejects unsafe public URLs and credentials embedded in links', () => {
    const profile = validProfile();
    expect(() =>
      createMosqueProfile({
        ...profile,
        contact: {
          ...profile.contact,
          links: [{ kind: 'website', url: 'javascript:alert(1)' }],
        },
      }),
    ).toThrow('Public URL must use HTTP(S) and must not contain credentials');

    expect(() =>
      createMosqueProfile({
        ...profile,
        contact: {
          ...profile.contact,
          links: [{ kind: 'website', url: 'https://user:secret@example.org' }],
        },
      }),
    ).toThrow('Public URL must use HTTP(S) and must not contain credentials');
  });

  it('rejects oversized or unsupported logo metadata', () => {
    const profile = validProfile();
    expect(() =>
      createMosqueProfile({
        ...profile,
        logo: { ...profile.logo, byteSize: 5_000_001 },
      }),
    ).toThrow('Mosque logo must be between 1 byte and 5 MB');

    expect(() =>
      createMosqueProfile({
        ...profile,
        logo: { ...profile.logo, width: 5000 },
      }),
    ).toThrow('Mosque logo dimensions must be between 1 and 4096 pixels');
  });
});
