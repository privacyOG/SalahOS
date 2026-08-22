import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import '../mobile-prayer-themes.css';
import '../mobile-prayer-theme-geometry.css';
import '../mobile-prayer-modules.css';
import {
  defaultPrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
  type PrayerBoardWeatherSnapshot,
} from '../domain/prayerBoardTemplate';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadMobilePrayerBoardDisplayConfig,
  MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
} from '../platform/mobilePrayerBoardDisplayConfig';
import {
  loadUsablePrayerBoardWeather,
  PRAYER_BOARD_WEATHER_CHANGE_EVENT,
  refreshPrayerBoardWeather,
} from '../platform/prayerBoardWeather';
import { PrayerBoardWeatherModule } from './PrayerBoardWeatherModule';

const MobilePrayerThemeConfigContext = createContext<PrayerBoardTemplateConfig>(
  defaultPrayerBoardTemplateConfig,
);

function readThemeConfig(): PrayerBoardTemplateConfig {
  try {
    const storage = getApplicationStorage();
    return loadMobilePrayerBoardDisplayConfig(storage) ?? defaultPrayerBoardTemplateConfig;
  } catch {
    return defaultPrayerBoardTemplateConfig;
  }
}

function readWeather(): PrayerBoardWeatherSnapshot | null {
  try {
    return loadUsablePrayerBoardWeather(getApplicationStorage());
  } catch {
    return null;
  }
}

export function useMobilePrayerThemeConfig(): PrayerBoardTemplateConfig {
  return useContext(MobilePrayerThemeConfigContext);
}

export function MobilePrayerThemeSurface({ children }: Readonly<{ children: ReactNode }>) {
  const [config, setConfig] = useState<PrayerBoardTemplateConfig>(readThemeConfig);
  const [weather, setWeather] = useState<PrayerBoardWeatherSnapshot | null>(readWeather);

  useEffect(() => {
    const refresh = () => {
      setConfig(readThemeConfig());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!config.moduleVisibility.weather) {
      setWeather(null);
      return;
    }

    let active = true;
    const refresh = async () => {
      const next = await refreshPrayerBoardWeather(getApplicationStorage());
      if (active) setWeather(next);
    };
    const refreshFromConfiguration = () => {
      setWeather(readWeather());
      void refresh();
    };

    setWeather(readWeather());
    void refresh();
    const timer = window.setInterval(
      () => {
        void refresh();
      },
      15 * 60 * 1000,
    );
    window.addEventListener(PRAYER_BOARD_WEATHER_CHANGE_EVENT, refreshFromConfiguration);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(PRAYER_BOARD_WEATHER_CHANGE_EVENT, refreshFromConfiguration);
    };
  }, [config.moduleVisibility.weather]);

  return (
    <MobilePrayerThemeConfigContext.Provider value={config}>
      <div
        className="mobile-prayer-theme-surface"
        data-mobile-prayer-template={config.templateId}
        data-mobile-prayer-accent={config.accentPreset}
        data-mobile-prayer-theme-version={config.version}
        data-mobile-prayer-weather={config.moduleVisibility.weather ? 'on' : 'off'}
      >
        {children}
        {config.moduleVisibility.weather && (
          <PrayerBoardWeatherModule weather={weather} locale={config.primaryLocale} />
        )}
      </div>
    </MobilePrayerThemeConfigContext.Provider>
  );
}
