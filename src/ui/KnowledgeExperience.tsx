import { useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadQuranReadingPreferences,
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
