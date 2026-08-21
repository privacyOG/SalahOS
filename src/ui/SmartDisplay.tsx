import { useEffect, useMemo, useState } from 'react';

import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import type { SourcedPrayerDashboard } from '../domain/sourcedDashboard';
import { localeDirection, translate } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import type { PersistedSettings } from '../platform/settingsStorage';
import {
  loadSmartDisplayTheme,
  SMART_DISPLAY_THEME_CHANGE_EVENT,
  type SmartDisplayThemeId,
} from '../platform/smartDisplayTheme';
import { BoldCountdownFocusPrayerBoard } from './BoldCountdownFocusPrayerBoard';
import { HeritageClassicPrayerBoard } from './HeritageClassicPrayerBoard';
import { MinimalModernPrayerBoard, type MinimalModernVariant } from './MinimalModernPrayerBoard';

export type SmartDisplayTemplateId =
  | 'heritage-classic'
  | 'minimal-modern'
  | 'bold-countdown-focus';

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
}

export function smartDisplayModeRequested(search: string): boolean {
  return new URLSearchParams(search).get('mode') === 'smart-display';
}

export function smartDisplayTemplateRequested(search: string): SmartDisplayTemplateId {
  const requested = new URLSearchParams(search).get('template');
  if (requested === 'minimal-modern' || requested === 'bold-countdown-focus') return requested;
  return 'heritage-classic';
}

function readSmartDisplayTheme(): SmartDisplayThemeId {
  try {
    return loadSmartDisplayTheme(getApplicationStorage());
  } catch {
    return 'classic';
  }
}

function minimalModernVariant(displayTheme: SmartDisplayThemeId): MinimalModernVariant {
  return displayTheme === 'midnight' || displayTheme === 'emerald' ? 'dark' : 'light';
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
}: SmartDisplayProps) {
  const [displayTheme, setDisplayTheme] = useState<SmartDisplayThemeId>(readSmartDisplayTheme);
  const boardData = useMemo(
    () => (dashboard === null ? null : buildPrayerBoardData({ dashboard, offline })),
    [dashboard, offline],
  );
  const resolvedTemplateId =
    templateId ??
    (typeof window === 'undefined'
      ? 'heritage-classic'
      : smartDisplayTemplateRequested(window.location.search));

  useEffect(() => {
    const refresh = () => {
      setDisplayTheme(readSmartDisplayTheme());
    };
    window.addEventListener(SMART_DISPLAY_THEME_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(SMART_DISPLAY_THEME_CHANGE_EVENT, refresh);
    };
  }, []);

  return (
    <main
      className="smart-display"
      data-mode="smart-display"
      data-display-theme={displayTheme}
      data-display-template={resolvedTemplateId}
      dir={localeDirection(locale)}
      lang={locale}
    >
      {systemTimeUnavailable ? (
        <section className="smart-display-empty" role="alert">
          <strong>{translate(locale, 'systemTimeInvalid')}</strong>
          <span>{translate(locale, 'systemTimeInvalidHelp')}</span>
        </section>
      ) : calculationUnavailable ? (
        <section className="smart-display-empty" role="alert">
          <strong>{translate(locale, 'calculationUnavailable')}</strong>
          <span>{translate(locale, 'calculationUnavailableHelp')}</span>
        </section>
      ) : boardData === null ? (
        <>
          <header className="smart-display-header smart-display-header--unconfigured">
            <div className="smart-display-clock-block">
              <div className="smart-display-brand">
                <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
                <span>SalahOS</span>
              </div>
              <p className="smart-display-clock" aria-label={translate(locale, 'currentTime')}>
                {currentClock}
              </p>
            </div>
          </header>
          {offline && (
            <p className="smart-display-status" role="status">
              {translate(locale, 'offline')}
            </p>
          )}
          <section className="smart-display-empty">
            <strong>{translate(locale, 'currentLocation')}</strong>
            <span>{translate(locale, 'notConfigured')}</span>
          </section>
        </>
      ) : resolvedTemplateId === 'minimal-modern' ? (
        <MinimalModernPrayerBoard
          data={boardData}
          locale={locale}
          timeFormat={timeFormat}
          variant={minimalModernVariant(displayTheme)}
        />
      ) : resolvedTemplateId === 'bold-countdown-focus' ? (
        <BoldCountdownFocusPrayerBoard
          data={boardData}
          locale={locale}
          timeFormat={timeFormat}
          displayTheme={displayTheme}
        />
      ) : (
        <HeritageClassicPrayerBoard
          data={boardData}
          locale={locale}
          timeFormat={timeFormat}
          displayTheme={displayTheme}
        />
      )}
    </main>
  );
}
