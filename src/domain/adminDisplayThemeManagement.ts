import type { ManagedDisplayRemoteStatus } from './managedAdminProtocol';
import {
  resolveManagedPrayerBoardTarget,
  type ManagedPrayerBoardTarget,
} from './managedPrayerBoardTarget';
import type {
  PrayerBoardAccentPreset,
  PrayerBoardArtworkId,
  PrayerBoardTemplateConfig,
  PrayerBoardTemplateId,
} from './prayerBoardTemplate';
import { getPrayerBoardTemplate, parsePrayerBoardTemplateConfig } from './prayerBoardTemplate';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';

export interface ManagedDisplayBulkAssignmentPlan {
  readonly selected: readonly ManagedDisplayRemoteStatus[];
  readonly supported: readonly ManagedDisplayRemoteStatus[];
  readonly unsupported: readonly Readonly<{
    display: ManagedDisplayRemoteStatus;
    target: ManagedPrayerBoardTarget;
  }>[];
}

export function smartDisplayThemeForAccent(accent: PrayerBoardAccentPreset): SmartDisplayThemeId {
  switch (accent) {
    case 'midnight':
      return 'midnight';
    case 'sandstone':
      return 'sandstone';
    case 'emerald':
    case 'jewel':
      return 'emerald';
    case 'neutral':
    default:
      return 'classic';
  }
}

export function nextManagedThemeRevision(currentRevision: number): number {
  if (!Number.isInteger(currentRevision) || currentRevision < 0) {
    throw new RangeError('Current managed theme revision must be a non-negative integer');
  }
  if (currentRevision >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Managed theme revision cannot advance safely');
  }
  return currentRevision + 1;
}

export function planManagedDisplayBulkAssignment(
  displays: readonly ManagedDisplayRemoteStatus[],
  selectedDisplayIds: ReadonlySet<string>,
): ManagedDisplayBulkAssignmentPlan {
  const selected = displays.filter((display) => selectedDisplayIds.has(display.identity.displayId));
  const supported: ManagedDisplayRemoteStatus[] = [];
  const unsupported: Array<{
    display: ManagedDisplayRemoteStatus;
    target: ManagedPrayerBoardTarget;
  }> = [];

  for (const display of selected) {
    const target = resolveManagedPrayerBoardTarget(display.identity);
    if (target.supported) supported.push(display);
    else unsupported.push({ display, target });
  }

  return Object.freeze({
    selected: Object.freeze(selected),
    supported: Object.freeze(supported),
    unsupported: Object.freeze(unsupported.map((entry) => Object.freeze(entry))),
  });
}

export function changeManagedThemeTemplate(
  config: PrayerBoardTemplateConfig,
  templateId: PrayerBoardTemplateId,
): PrayerBoardTemplateConfig {
  const template = getPrayerBoardTemplate(templateId);
  return parsePrayerBoardTemplateConfig({
    ...config,
    templateId,
    background: {
      kind: 'builtin',
      artworkId: template.fallbackArtworkId,
    },
  });
}

export function changeManagedThemeArtwork(
  config: PrayerBoardTemplateConfig,
  artworkId: PrayerBoardArtworkId,
): PrayerBoardTemplateConfig {
  return parsePrayerBoardTemplateConfig({
    ...config,
    background: { kind: 'builtin', artworkId },
  });
}

export function changeManagedThemeMosqueName(
  config: PrayerBoardTemplateConfig,
  locale: 'en' | 'ar' | 'tr' | 'id',
  mosqueName: string,
): PrayerBoardTemplateConfig {
  const names = { ...(config.branding.mosqueName ?? {}) };
  const normalized = mosqueName.trim().replace(/\s+/gu, ' ');
  if (normalized === '') delete names[locale];
  else names[locale] = normalized;
  return parsePrayerBoardTemplateConfig({
    ...config,
    branding: {
      mosqueName: names,
      logo: null,
    },
  });
}
