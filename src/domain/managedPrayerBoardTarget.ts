import type { DisplayIdentity } from './displayFleet';

export interface ManagedPrayerBoardTarget {
  readonly width: number;
  readonly height: number;
  readonly orientation: 'landscape' | 'portrait';
  readonly resolutionProfile: string;
  readonly supported: boolean;
  readonly reason: string | null;
}

const EXACT_PROFILE_PATTERN = /^(\d{3,4})x(\d{3,4})$/u;

function profileDimensions(identity: DisplayIdentity): readonly [number, number] | null {
  const exact = EXACT_PROFILE_PATTERN.exec(identity.resolutionProfile);
  if (exact !== null) {
    const width = Number(exact[1]);
    const height = Number(exact[2]);
    if (width >= 320 && width <= 8192 && height >= 320 && height <= 8192) {
      return [width, height] as const;
    }
  }

  switch (identity.resolutionProfile) {
    case 'tv-16x9':
    case 'tv-1080p':
      return [1920, 1080] as const;
    case 'tv-4k':
      return [3840, 2160] as const;
    case 'portrait-foyer':
      return [1080, 1920] as const;
    case 'touch-display-2':
      return identity.orientation === 'landscape'
        ? ([1280, 720] as const)
        : ([720, 1280] as const);
    default:
      return null;
  }
}

export function resolveManagedPrayerBoardTarget(identity: DisplayIdentity): ManagedPrayerBoardTarget {
  const dimensions = profileDimensions(identity);
  if (dimensions === null) {
    return Object.freeze({
      width: 0,
      height: 0,
      orientation: identity.orientation,
      resolutionProfile: identity.resolutionProfile,
      supported: false,
      reason: 'Resolution profile does not resolve to an exact viewport size.',
    });
  }

  const [width, height] = dimensions;
  const geometricOrientation = width >= height ? 'landscape' : 'portrait';
  if (geometricOrientation !== identity.orientation) {
    return Object.freeze({
      width,
      height,
      orientation: identity.orientation,
      resolutionProfile: identity.resolutionProfile,
      supported: false,
      reason: 'Resolution dimensions do not match the enrolled display orientation.',
    });
  }

  if (identity.orientation !== 'landscape') {
    return Object.freeze({
      width,
      height,
      orientation: identity.orientation,
      resolutionProfile: identity.resolutionProfile,
      supported: false,
      reason: 'The six Stage 23 prayer-board templates are currently validated only in landscape.',
    });
  }

  const validated =
    (width === 1920 && height === 1080) || (width === 3840 && height === 2160);
  return Object.freeze({
    width,
    height,
    orientation: identity.orientation,
    resolutionProfile: identity.resolutionProfile,
    supported: validated,
    reason: validated
      ? null
      : 'Prayer-board publication is limited to the validated 1920×1080 and 3840×2160 targets.',
  });
}
