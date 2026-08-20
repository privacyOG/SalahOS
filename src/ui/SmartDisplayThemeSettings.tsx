import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
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

const copy = {
  en: {
    title: 'Smart-display theme',
    subtitle: 'Choose the presentation used only on TV, kiosk and smart-display mode.',
    classic: 'Classic',
    classicHelp: 'Bright, neutral and highly legible.',
    midnight: 'Midnight',
    midnightHelp: 'Deep navy with restrained gold accents.',
    sandstone: 'Sandstone',
    sandstoneHelp: 'Warm stone and parchment tones.',
    emerald: 'Emerald',
    emeraldHelp: 'Dark green with luminous prayer highlights.',
    selected: 'Selected',
  },
  ar: {
    title: 'سمة شاشة العرض',
    subtitle: 'اختر المظهر الخاص بوضع التلفاز والكشك وشاشة العرض فقط.',
    classic: 'كلاسيكي',
    classicHelp: 'فاتح ومحايد وواضح للقراءة.',
    midnight: 'منتصف الليل',
    midnightHelp: 'كحلي عميق مع لمسات ذهبية هادئة.',
    sandstone: 'الحجر الرملي',
    sandstoneHelp: 'درجات دافئة من الحجر والورق.',
    emerald: 'زمردي',
    emeraldHelp: 'أخضر داكن مع إبراز واضح لأوقات الصلاة.',
    selected: 'محدد',
  },
} as const;

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
              {selected && <span className="smart-display-theme-option__selected">{text.selected}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
