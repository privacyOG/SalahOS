import { describe, expect, it } from 'vitest';

import { createDisplayIdentity } from './displayFleet';
import { resolveManagedPrayerBoardTarget } from './managedPrayerBoardTarget';

function identity(resolutionProfile: string, orientation: 'landscape' | 'portrait' = 'landscape') {
  return createDisplayIdentity({
    displayId: 'display:lobby',
    organizationId: 'org:example',
    mosqueId: 'mosque:example',
    locationId: 'location:lobby',
    orientation,
    resolutionProfile,
    playlistId: null,
  });
}

describe('managed prayer-board target validation', () => {
  it('resolves the validated 1080p and 4K landscape targets exactly', () => {
    expect(resolveManagedPrayerBoardTarget(identity('1920x1080'))).toMatchObject({
      width: 1920,
      height: 1080,
      supported: true,
    });
    expect(resolveManagedPrayerBoardTarget(identity('3840x2160'))).toMatchObject({
      width: 3840,
      height: 2160,
      supported: true,
    });
    expect(resolveManagedPrayerBoardTarget(identity('tv-16x9'))).toMatchObject({
      width: 1920,
      height: 1080,
      supported: true,
    });
  });

  it('blocks portrait and unvalidated landscape publication', () => {
    expect(resolveManagedPrayerBoardTarget(identity('1080x1920', 'portrait'))).toMatchObject({
      supported: false,
      orientation: 'portrait',
    });
    expect(resolveManagedPrayerBoardTarget(identity('1280x720'))).toMatchObject({
      supported: false,
      width: 1280,
      height: 720,
    });
  });

  it('rejects orientation mismatches and unknown profiles', () => {
    expect(resolveManagedPrayerBoardTarget(identity('1920x1080', 'portrait')).reason).toMatch(
      /orientation/u,
    );
    expect(resolveManagedPrayerBoardTarget(identity('custom-profile')).reason).toMatch(
      /exact viewport/u,
    );
  });
});
