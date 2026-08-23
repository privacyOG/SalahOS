import { describe, expect, it } from 'vitest';

import {
  changeManagedThemeArtwork,
  changeManagedThemeMosqueName,
  changeManagedThemeTemplate,
  nextManagedThemeRevision,
  planManagedDisplayBulkAssignment,
  smartDisplayThemeForAccent,
} from './adminDisplayThemeManagement';
import { createManagedDisplayRemoteStatus } from './managedAdminProtocol';
import { parsePrayerBoardTemplateConfig } from './prayerBoardTemplate';

function config() {
  return parsePrayerBoardTemplateConfig({
    version: 1,
    templateId: 'heritage-classic',
    primaryLocale: 'en',
    timeFormat: 'h23',
    accentPreset: 'neutral',
    branding: { mosqueName: { en: 'Old Name' }, logo: null },
  });
}

function display(
  displayId: string,
  orientation: 'landscape' | 'portrait',
  resolutionProfile: string,
) {
  return createManagedDisplayRemoteStatus({
    identity: {
      displayId,
      organizationId: 'org:example',
      mosqueId: 'mosque:example',
      locationId: `location:${displayId.split(':').at(-1) ?? 'display'}`,
      orientation,
      resolutionProfile,
      playlistId: null,
    },
    lastSeenAt: null,
    appVersion: null,
    reportedContentRevision: 0,
    reportedPrayerBoardTemplateId: null,
    syncState: 'offline',
    remoteConfig: {
      displayId,
      contentRevision: 4,
      playlistId: null,
      displayTheme: 'classic',
      prayerBoardConfig: config(),
      prayerBoardAssignment: 'display-override',
      revoked: false,
      updatedAt: '2026-08-23T05:00:00.000Z',
    },
  });
}

describe('admin display theme management model', () => {
  it('plans bulk assignment without admitting unsupported targets', () => {
    const displays = [
      display('display:lobby', 'landscape', '1920x1080'),
      display('display:hall', 'landscape', '3840x2160'),
      display('display:foyer', 'portrait', '1080x1920'),
      display('display:touch', 'landscape', '1280x720'),
    ];
    const selected = new Set(displays.map((item) => item.identity.displayId));
    const plan = planManagedDisplayBulkAssignment(displays, selected);

    expect(plan.selected).toHaveLength(4);
    expect(plan.supported.map((item) => item.identity.displayId)).toEqual([
      'display:lobby',
      'display:hall',
    ]);
    expect(plan.unsupported.map((item) => item.display.identity.displayId)).toEqual([
      'display:foyer',
      'display:touch',
    ]);
    expect(plan.unsupported.every((item) => item.target.reason !== null)).toBe(true);
  });

  it('advances revisions monotonically and rejects unsafe values', () => {
    expect(nextManagedThemeRevision(0)).toBe(1);
    expect(nextManagedThemeRevision(41)).toBe(42);
    expect(() => nextManagedThemeRevision(-1)).toThrow(/non-negative/u);
    expect(() => nextManagedThemeRevision(Number.MAX_SAFE_INTEGER)).toThrow(/cannot advance/u);
  });

  it('builds presentation-only template, artwork and branding drafts', () => {
    const templated = changeManagedThemeTemplate(config(), 'scenic-spiritual');
    expect(templated).toMatchObject({
      templateId: 'scenic-spiritual',
      background: { kind: 'builtin', artworkId: 'scenic-gradient' },
    });

    const artwork = changeManagedThemeArtwork(templated, 'geometric-heritage');
    expect(artwork.background).toEqual({ kind: 'builtin', artworkId: 'geometric-heritage' });

    const branded = changeManagedThemeMosqueName(artwork, 'ar', ' مسجد الاختبار ');
    expect(branded.branding.mosqueName).toMatchObject({
      en: 'Old Name',
      ar: 'مسجد الاختبار',
    });
    expect(branded.branding.logo).toBeNull();
  });

  it('maps presentation accents onto the legacy display-theme bridge deterministically', () => {
    expect(smartDisplayThemeForAccent('midnight')).toBe('midnight');
    expect(smartDisplayThemeForAccent('sandstone')).toBe('sandstone');
    expect(smartDisplayThemeForAccent('jewel')).toBe('emerald');
    expect(smartDisplayThemeForAccent('neutral')).toBe('classic');
  });
});
