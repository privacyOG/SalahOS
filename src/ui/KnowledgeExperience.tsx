import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadQuranReadingPreferences,
  QURAN_READING_PREFERENCES_CHANGE_EVENT,
  saveQuranReadingPreferences,
  type QuranReadingPreferences,
} from '../platform/quranReadingPreferences';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { KnowledgeScreen } from './KnowledgeScreen';
import { QuranOfflineReader } from './QuranOfflineReader';

function currentLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    const language = document.documentElement.lang.toLowerCase();
    if (language.startsWith('ar')) return 'ar';
    if (language.startsWith('tr')) return 'tr';
    if (language.startsWith('id')) return 'id';
    return 'en';
  }
}

export function KnowledgeExperience() {
  const locale = currentLocale();
  const [quranPreferences, setQuranPreferences] = useState<QuranReadingPreferences>(() =>
    loadQuranReadingPreferences(getApplicationStorage()),
  );

  useEffect(() => {
    const reload = () => {
      setQuranPreferences(loadQuranReadingPreferences(getApplicationStorage()));
    };
    window.addEventListener(QURAN_READING_PREFERENCES_CHANGE_EVENT, reload);
    return () => {
      window.removeEventListener(QURAN_READING_PREFERENCES_CHANGE_EVENT, reload);
    };
  }, []);

  const persistQuranPreferences = (next: QuranReadingPreferences): void => {
    setQuranPreferences(next);
    saveQuranReadingPreferences(getApplicationStorage(), next);
  };

  return (
    <div className="knowledge-experience" data-knowledge-experience>
      <KnowledgeScreen />
      <QuranOfflineReader
        locale={locale}
        preferences={quranPreferences}
        onPreferencesChange={persistQuranPreferences}
      />
    </div>
  );
}
