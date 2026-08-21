import { useEffect, useMemo, useState } from 'react';

import {
  buildPrayerBoardData,
  parsePrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
  type PrayerBoardTemplateId,
} from '../domain/prayerBoardTemplate';
import type { SourcedPrayerDashboard } from '../domain/sourcedDashboard';
import { localeDirection, translate } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadPrayerBoardDisplayConfig,
  PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
} from '../platform/prayerBoardDisplayConfig';
import type { PersistedSettings } from '../platform/settingsStorage';
import {
  loadSmartDisplayTheme,
  SMART_DISPLAY_THEME_CHANGE_EVENT,
  type SmartDisplayThemeId,
} from '../platform/smartDisplayTheme';
import { displayThemeForPrayerBoardConfig, PrayerBoardRenderer } from './PrayerBoardRenderer';

export type SmartDisplayTemplateId = PrayerBoardTemplateId;

export interface SmartDisplayProps {
  readonly locale: Locale;
  readonly currentClock: string;
  readonly dashboard: SourcedPrayerDashboard | null;
  readonly timeFormat: PersistedSettings['timeFormat'];
  readonly hijriCorrectionDays: number;
  readonly offline: boolean;
  readonly systemTimeUnavailable: boolean;
  readonly calculationUnavailable: boolean;
  readonly templateId?: SmartDisplayTemplateId;
  readonly scenicArtworkEnabled?: boolean;
  readonly familyEducationalHintsEnabled?: boolean;
  readonly familyDaylightCuesEnabled?: boolean;
}

export function smartDisplayModeRequested(search: string): boolean {
  return new URLSearchParams(search).get('mode') === 'smart-display';
}

function smartDisplayTemplateOverride(search: string): SmartDisplayTemplateId | null {
  const requested = new URLSearchParams(search).get('template');
  if (
    requested === 'heritage-classic' ||
    requested === 'minimal-modern' ||
    requested === 'bold-countdown-focus' ||
    requested === 'structured-split-board' ||
    requested === 'scenic-spiritual' ||
    requested === 'family-classroom'
  ) {
    return requested;
  }
  return null;
}

export function smartDisplayTemplateRequested(search: string): SmartDisplayTemplateId {
  return smartDisplayTemplateOverride(search) ?? 'heritage-classic';
}

export function smartDisplayScenicArtworkRequested(search: string): boolean {
  return new URLSearchParams(search).get('artwork') !== 'off';
}

export function smartDisplayFamilyHintsRequested(search: string): boolean {
  return new URLSearchParams(search).get('hints') === 'on';
}

export function smartDisplayFamilyDaylightRequested(search: string): boolean {
  return new URLSearchParams(search).get('daylight') !== 'off';
}

function readSmartDisplayTheme(): SmartDisplayThemeId {
  try {
    return loadSmartDisplayTheme(getApplicationStorage());
  } catch {
    return 'classic';
  }
}

function readPrayerBoardDisplayConfig(): PrayerBoardTemplateConfig | null {
  try {
    return loadPrayerBoardDisplayConfig(getApplicationStorage());
  } catch {
    return null;
  }
}

export function SmartDisplay({
  locale,
  currentClock,
  dashboard,
  timeFormat,
  offline,
  systemTimeUnavailable,
  calculationUnavailable,
  templateId,
  scenicArtworkEnabled,
  familyEducationalHintsEnabled,
  familyDaylightCuesEnabled,
}: SmartDisplayProps) {
  const [displayTheme, setDisplayTheme] = useState<SmartDisplayThemeId>(readSmartDisplayTheme);
  const [displayConfig, setDisplayConfig] = useState<PrayerBoardTemplateConfig | null>(
    readPrayerBoardDisplayConfig,
  );
  const boardData = useMemo(
    () => (dashboard === null ? null : buildPrayerBoardData({ dashboard, offline })),
    [dashboard, offline],
  );
  const queryTemplate =
    typeof window === 'undefined' ? null : smartDisplayTemplateOverride(window.location.search);
  const resolvedTemplateId =
    templateId ?? queryTemplate ?? displayConfig?.templateId ?? 'heritage-classic';
  const resolvedConfig = useMemo(
    () =>
      parsePrayerBoardTemplateConfig({
        ...(displayConfig ?? {}),
        version: 1,
        templateId: resolvedTemplateId,
        primaryLocale: displayConfig?.primaryLocale ?? locale,
        timeFormat: displayConfig?.timeFormat ?? timeFormat,
      }),
    [displayConfig, locale, resolvedTemplateId, timeFormat],
  );
  const resolvedLocale = resolvedConfig.primaryLocale;
  const resolvedDisplayTheme =
    displayConfig === null ? displayTheme : displayThemeForPrayerBoardConfig(resolvedConfig);
  const resolvedScenicArtworkEnabled =
    scenicArtworkEnabled ??
    (typeof window === 'undefined'
      ? true
      : smartDisplayScenicArtworkRequested(window.location.search));
  const resolvedFamilyEducationalHintsEnabled =
    familyEducationalHintsEnabled ??
    (typeof window === 'undefined'
      ? false
      : smartDisplayFamilyHintsRequested(window.location.search));
  const resolvedFamilyDaylightCuesEnabled =
    familyDaylightCuesEnabled ??
    (typeof window === 'undefined'
      ? true
      : smartDisplayFamilyDaylightRequested(window.location.search));

  useEffect(() => {
    const refreshTheme = () => {
      setDisplayTheme(readSmartDisplayTheme());
    };
    const refreshDisplayConfig = () => {
      setDisplayConfig(readPrayerBoardDisplayConfig());
    };
    window.addEventListener(SMART_DISPLAY_THEME_CHANGE_EVENT, refreshTheme);
    window.addEventListener(PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refreshDisplayConfig);
    return () => {
      window.removeEventListener(SMART_DISPLAY_THEME_CHANGE_EVENT, refreshTheme);
      window.removeEventListener(PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refreshDisplayConfig);
    };
  }, []);

  return (
    <main
      className="smart-display"
      data-mode="smart-display"
      data-display-theme={resolvedDisplayTheme}
      data-display-template={resolvedTemplateId}
      dir={localeDirection(resolvedLocale)}
      lang={resolvedLocale}
    >
      {systemTimeUnavailable ? (
        <section className="smart-display-empty" role="alert">
          <strong>{translate(resolvedLocale, 'systemTimeInvalid')}</strong>
          <span>{translate(resolvedLocale, 'systemTimeInvalidHelp')}</span>
        </section>
      ) : calculationUnavailable ? (
        <section className="smart-display-empty" role="alert">
          <strong>{translate(resolvedLocale, 'calculationUnavailable')}</strong>
          <span>{translate(resolvedLocale, 'calculationUnavailableHelp')}</span>
        </section>
      ) : boardData === null ? (
        <>
          <header className="smart-display-header smart-display-header--unconfigured">
            <div className="smart-display-clock-block">
              <div className="smart-display-brand">
                <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
                <span>SalahOS</span>
              </div>
              <p
                className="smart-display-clock"
                aria-label={translate(resolvedLocale, 'currentTime')}
              >
                {currentClock}
              </p>
            </div>
          </header>
          {offline && (
            <p className="smart-display-status" role="status">
              {translate(resolvedLocale, 'offline')}
            </p>
          )}
          <section className="smart-display-empty">
            <strong>{translate(resolvedLocale, 'currentLocation')}</strong>
            <span>{translate(resolvedLocale, 'notConfigured')}</span>
          </section>
        </>
      ) : (
        <PrayerBoardRenderer
          data={boardData}
          config={resolvedConfig}
          displayThemeOverride={displayConfig === null ? displayTheme : undefined}
          scenicArtworkEnabled={resolvedScenicArtworkEnabled}
          familyEducationalHintsEnabled={resolvedFamilyEducationalHintsEnabled}
          familyDaylightCuesEnabled={resolvedFamilyDaylightCuesEnabled}
        />
      )}
    </main>
  );
}
