import {
  parsePrayerBoardTemplateConfig,
  type PrayerBoardData,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';
import { BoldCountdownFocusPrayerBoard } from './BoldCountdownFocusPrayerBoard';
import { FamilyClassroomPrayerBoard } from './FamilyClassroomPrayerBoard';
import { HeritageClassicPrayerBoard } from './HeritageClassicPrayerBoard';
import { MinimalModernPrayerBoard, type MinimalModernVariant } from './MinimalModernPrayerBoard';
import { ScenicSpiritualPrayerBoard } from './ScenicSpiritualPrayerBoard';
import { StructuredSplitBoard } from './StructuredSplitBoard';

export interface PrayerBoardRendererProps {
  readonly data: PrayerBoardData;
  readonly config: PrayerBoardTemplateConfig;
  readonly displayThemeOverride?: SmartDisplayThemeId;
  readonly scenicArtworkEnabled?: boolean;
  readonly familyEducationalHintsEnabled?: boolean;
  readonly familyDaylightCuesEnabled?: boolean;
}

export function displayThemeForPrayerBoardConfig(
  config: PrayerBoardTemplateConfig,
): SmartDisplayThemeId {
  switch (config.accentPreset) {
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

function minimalModernVariant(displayTheme: SmartDisplayThemeId): MinimalModernVariant {
  return displayTheme === 'midnight' || displayTheme === 'emerald' ? 'dark' : 'light';
}

function localizedBrandName(
  config: PrayerBoardTemplateConfig,
  locale: Locale,
  fallback: string | null,
): string | null {
  if (!config.moduleVisibility['mosque-branding']) return null;
  const names = config.branding.mosqueName;
  if (names === null) return fallback;
  return names[locale] ?? names.en ?? Object.values(names)[0] ?? fallback;
}

export function PrayerBoardRenderer({
  data,
  config,
  displayThemeOverride,
  scenicArtworkEnabled,
  familyEducationalHintsEnabled,
  familyDaylightCuesEnabled,
}: PrayerBoardRendererProps) {
  const normalized = parsePrayerBoardTemplateConfig(config);
  const locale = normalized.primaryLocale;
  const timeFormat = normalized.timeFormat;
  const displayTheme = displayThemeOverride ?? displayThemeForPrayerBoardConfig(normalized);
  const mosqueName = localizedBrandName(normalized, locale, data.mosqueName);
  const renderedData = mosqueName === data.mosqueName ? data : Object.freeze({ ...data, mosqueName });

  const board =
    normalized.templateId === 'minimal-modern' ? (
      <MinimalModernPrayerBoard
        data={renderedData}
        locale={locale}
        timeFormat={timeFormat}
        variant={minimalModernVariant(displayTheme)}
      />
    ) : normalized.templateId === 'bold-countdown-focus' ? (
      <BoldCountdownFocusPrayerBoard
        data={renderedData}
        locale={locale}
        timeFormat={timeFormat}
        displayTheme={displayTheme}
      />
    ) : normalized.templateId === 'structured-split-board' ? (
      <StructuredSplitBoard
        data={renderedData}
        locale={locale}
        timeFormat={timeFormat}
        displayTheme={displayTheme}
      />
    ) : normalized.templateId === 'scenic-spiritual' ? (
      <ScenicSpiritualPrayerBoard
        data={renderedData}
        locale={locale}
        timeFormat={timeFormat}
        displayTheme={displayTheme}
        artworkEnabled={scenicArtworkEnabled ?? true}
      />
    ) : normalized.templateId === 'family-classroom' ? (
      <FamilyClassroomPrayerBoard
        data={renderedData}
        locale={locale}
        timeFormat={timeFormat}
        displayTheme={displayTheme}
        educationalHintsEnabled={familyEducationalHintsEnabled ?? false}
        daylightCuesEnabled={
          familyDaylightCuesEnabled ?? normalized.moduleVisibility['sunrise-sunset']
        }
      />
    ) : (
      <HeritageClassicPrayerBoard
        data={renderedData}
        locale={locale}
        timeFormat={timeFormat}
        displayTheme={displayTheme}
      />
    );

  return (
    <div
      className="prayer-board-configured-surface"
      data-module-dates={normalized.moduleVisibility.dates ? 'on' : 'off'}
      data-module-jumuah={normalized.moduleVisibility.jumuah ? 'on' : 'off'}
      data-module-sunrise-sunset={normalized.moduleVisibility['sunrise-sunset'] ? 'on' : 'off'}
      data-module-announcements={normalized.moduleVisibility.announcements ? 'on' : 'off'}
      data-module-weather={normalized.moduleVisibility.weather ? 'on' : 'off'}
    >
      {board}
    </div>
  );
}
