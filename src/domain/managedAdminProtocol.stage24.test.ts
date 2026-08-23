import { describe, expect, it } from 'vitest';

import { createManagedPrayerBoardAssignmentConfig } from './managedAdminProtocol';
import { parsePrayerBoardTemplateConfig } from './prayerBoardTemplate';

describe('managed prayer-board presentation media', () => {
  it('preserves allowlisted built-in artwork while removing device-local logo media', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: { kind: 'builtin', artworkId: 'geometric-heritage' },
      branding: {
        mosqueName: { en: 'Example Masjid' },
        logo: {
          assetId: 'logo-1',
          mimeType: 'image/png',
          byteSize: 4096,
          width: 256,
          height: 256,
        },
      },
    });

    const managed = createManagedPrayerBoardAssignmentConfig(config);
    expect(managed.background).toEqual({ kind: 'builtin', artworkId: 'geometric-heritage' });
    expect(managed.branding).toEqual({ mosqueName: { en: 'Example Masjid' }, logo: null });
  });

  it('replaces device-local background media with the selected template fallback', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: {
        kind: 'local-image',
        asset: {
          assetId: 'background-1',
          mimeType: 'image/webp',
          byteSize: 200000,
          width: 1920,
          height: 1080,
        },
        focalPoint: { x: 0.5, y: 0.5 },
      },
    });

    const managed = createManagedPrayerBoardAssignmentConfig(config);
    expect(managed.background).toEqual({ kind: 'builtin', artworkId: 'scenic-gradient' });
  });
});
