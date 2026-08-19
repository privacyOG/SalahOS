import { useEffect, useState } from 'react';

import { calendarDate } from '../domain/calendar';
import { createLocationPrayerContext } from '../domain/locationPrayerContext';
import { deriveRamadanMode } from '../domain/ramadan';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = {
  en: {
    eyebrow: 'Ramadan mode',
    day: 'Ramadan day',
    yearSuffix: 'AH',
    message: 'Ramadan presentation is active for the selected location.',
    source: 'Prayer times continue to use your selected calculation or mosque source.',
  },
  ar: {
    eyebrow: 'وضع رمضان',
    day: 'اليوم من رمضان',
    yearSuffix: 'هـ',
    message: 'تم تفعيل عرض رمضان للموقع المحدد.',
    source: 'تستمر مواقيت الصلاة باستخدام طريقة الحساب أو مصدر المسجد الذي اخترته.',
  },
} as const;

function readPanelState() {
  const settings = loadPersistedSettings(getApplicationStorage());
  return {
    locale: settings.locale,
    location: settings.location,
    hijriCorrectionDays: settings.hijriCorrectionDays,
  };
}

export function RamadanModePanel() {
  const [panelState, setPanelState] = useState(readPanelState);
  const [instant, setInstant] = useState(() => new Date());
  const locale: Locale = panelState.locale;
  const text = copy[locale];
  const ramadan = getCurrentRamadanMode(panelState, instant);
  const active = ramadan?.active === true;

  useEffect(() => {
    if (active) {
      document.documentElement.dataset.ramadanMode = 'active';
    } else {
      delete document.documentElement.dataset.ramadanMode;
    }

    return () => {
      delete document.documentElement.dataset.ramadanMode;
    };
  }, [active]);

  useEffect(() => {
    const refresh = () => {
      setPanelState(readPanelState());
      setInstant(new Date());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    const timer = window.setInterval(() => {
      setInstant(new Date());
    }, 60_000);

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (!active || ramadan === null || smartDisplayModeRequested(window.location.search)) {
    return null;
  }

  return (
    <section
      className="ramadan-mode-panel"
      aria-labelledby="ramadan-mode-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="ramadan-mode-symbol" aria-hidden="true">
        ☾
      </div>
      <div className="ramadan-mode-copy">
        <p className="ramadan-mode-eyebrow">{text.eyebrow}</p>
        <h2 id="ramadan-mode-title">
          {text.day} {ramadan.ramadanDay}
        </h2>
        <p>{text.message}</p>
        <small>{text.source}</small>
      </div>
      <strong className="ramadan-mode-year" dir="ltr">
        {ramadan.hijriYear} {text.yearSuffix}
      </strong>
    </section>
  );
}

function getCurrentRamadanMode(
  panelState: ReturnType<typeof readPanelState>,
  instant: Date,
): ReturnType<typeof deriveRamadanMode> | null {
  if (panelState.location === null) {
    return null;
  }

  const context = createLocationPrayerContext(
    instant,
    panelState.location.coordinates,
    panelState.location.timeZone,
  );
  const hijri = calendarDate(context.civilDate, panelState.hijriCorrectionDays).hijri;
  return deriveRamadanMode(hijri);
}
