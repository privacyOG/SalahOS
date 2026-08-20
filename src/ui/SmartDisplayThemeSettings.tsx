import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { smartDisplayThemeCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';
import {
  loadSmartDisplayTheme,
  saveSmartDisplayTheme,
  SMART_DISPLAY_THEME_CHANGE_EVENT,
  smartDisplayThemes,
  type SmartDisplayThemeId,
} from '../platform/smartDisplayTheme';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = smartDisplayThemeCopy;

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function readTheme(): SmartDisplayThemeId {
  try {
    return loadSmartDisplayTheme(getApplicationStorage());
  } catch {
    return 'classic';
  }
}

export function SmartDisplayThemeSettings() {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const [theme, setTheme] = useState<SmartDisplayThemeId>(readTheme);
  const text = copy[locale];

  useEffect(() => {
    const refresh = () => {
      setLocale(readLocale());
      setTheme(readTheme());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) return null;

  const selectTheme = (nextTheme: SmartDisplayThemeId) => {
    saveSmartDisplayTheme(getApplicationStorage(), nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new Event(SMART_DISPLAY_THEME_CHANGE_EVENT));
  };

  return (
    <section
      className="smart-display-theme-settings"
      aria-labelledby="smart-display-theme-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header>
        <h2 id="smart-display-theme-title">{text.title}</h2>
        <p>{text.subtitle}</p>
      </header>
      <div className="smart-display-theme-settings__grid">
        {smartDisplayThemes.map((definition) => {
          const selected = theme === definition.id;
          const label = text[definition.id];
          const help = text[`${definition.id}Help` as const];
          return (
            <button
              key={definition.id}
              type="button"
              className="smart-display-theme-option"
              data-theme-preview={definition.id}
              aria-pressed={selected}
              onClick={() => {
                selectTheme(definition.id);
              }}
            >
              <span className="smart-display-theme-option__swatch" aria-hidden="true" />
              <span className="smart-display-theme-option__copy">
                <strong>{label}</strong>
                <small>{help}</small>
              </span>
              {selected && (
                <span className="smart-display-theme-option__selected">{text.selected}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
