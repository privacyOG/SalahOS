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
import {
  readKnowledgeView,
  readQuranVerseKey,
  searchForKnowledgeView,
  type KnowledgeView,
} from './applicationRoute';
import { KnowledgeScreen } from './KnowledgeScreen';
import { QuranOfflineReader } from './QuranOfflineReader';

type KnowledgeExperienceCopy = Readonly<{
  navigation: string;
  library: string;
  quran: string;
  hadith: string;
}>;

const copy: Readonly<Record<Locale, KnowledgeExperienceCopy>> = {
  en: { navigation: 'Knowledge sections', library: 'Library', quran: 'Qur’an', hadith: 'Hadith' },
  ar: { navigation: 'أقسام المعرفة', library: 'المكتبة', quran: 'القرآن', hadith: 'الحديث' },
  tr: { navigation: 'Bilgi bölümleri', library: 'Kütüphane', quran: 'Kur’an', hadith: 'Hadis' },
  id: { navigation: 'Bagian pengetahuan', library: 'Pustaka', quran: 'Qur’an', hadith: 'Hadis' },
};

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
  const labels = copy[locale];
  const [view, setView] = useState<KnowledgeView>(() => readKnowledgeView(window.location.search));
  const [verseKey, setVerseKey] = useState<string | null>(() =>
    readQuranVerseKey(window.location.search),
  );
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

  useEffect(() => {
    const syncRoute = () => {
      setView(readKnowledgeView(window.location.search));
      setVerseKey(readQuranVerseKey(window.location.search));
    };
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const persistQuranPreferences = (next: QuranReadingPreferences): void => {
    setQuranPreferences(next);
    saveQuranReadingPreferences(getApplicationStorage(), next);
  };

  const navigate = (next: KnowledgeView): void => {
    if (next === view) return;
    const search = searchForKnowledgeView(
      window.location.search,
      next,
      next === 'quran' ? verseKey : null,
    );
    history.pushState(null, '', `${location.pathname}${search}${location.hash}`);
    setView(next);
  };

  const updateVerseRoute = (nextVerseKey: string): void => {
    const search = searchForKnowledgeView(window.location.search, 'quran', nextVerseKey);
    history.replaceState(null, '', `${location.pathname}${search}${location.hash}`);
    setVerseKey(nextVerseKey);
  };

  const segments: readonly Readonly<{ id: KnowledgeView; label: string }>[] = [
    { id: 'library', label: labels.library },
    { id: 'quran', label: labels.quran },
    { id: 'hadith', label: labels.hadith },
  ];

  return (
    <div className="knowledge-experience" data-knowledge-experience data-knowledge-view={view}>
      <nav className="knowledge-experience__segments" aria-label={labels.navigation}>
        {segments.map((segment) => (
          <button
            type="button"
            key={segment.id}
            aria-pressed={view === segment.id}
            data-knowledge-view-select={segment.id}
            onClick={() => {
              navigate(segment.id);
            }}
          >
            {segment.label}
          </button>
        ))}
      </nav>

      {view === 'library' ? <KnowledgeScreen scope="library" /> : null}
      {view === 'hadith' ? <KnowledgeScreen scope="hadith" /> : null}
      {view === 'quran' ? (
        <QuranOfflineReader
          locale={locale}
          preferences={quranPreferences}
          onPreferencesChange={persistQuranPreferences}
          initialVerseKey={verseKey}
          onVerseNavigate={updateVerseRoute}
        />
      ) : null}
    </div>
  );
}
