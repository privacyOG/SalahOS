import { useEffect, useState, type ReactNode } from 'react';

import '../mobile-prayer-themes.css';
import {
  defaultPrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadMobilePrayerBoardDisplayConfig,
  MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
} from '../platform/mobilePrayerBoardDisplayConfig';
import {
  loadPrayerBoardDisplayConfig,
  PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
} from '../platform/prayerBoardDisplayConfig';

function readThemeConfig(): PrayerBoardTemplateConfig {
  try {
    const storage = getApplicationStorage();
    return (
      loadMobilePrayerBoardDisplayConfig(storage) ??
      loadPrayerBoardDisplayConfig(storage) ??
      defaultPrayerBoardTemplateConfig
    );
  } catch {
    return defaultPrayerBoardTemplateConfig;
  }
}

export function MobilePrayerThemeSurface({ children }: Readonly<{ children: ReactNode }>) {
  const [config, setConfig] = useState<PrayerBoardTemplateConfig>(readThemeConfig);

  useEffect(() => {
    const refresh = () => {
      setConfig(readThemeConfig());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refresh);
    window.addEventListener(PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refresh);
      window.removeEventListener(PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  return (
    <div
      className="mobile-prayer-theme-surface"
      data-mobile-prayer-template={config.templateId}
      data-mobile-prayer-accent={config.accentPreset}
      data-mobile-prayer-theme-version={config.version}
    >
      {children}
    </div>
  );
}
