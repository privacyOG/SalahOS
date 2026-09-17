import { useEffect, useMemo, useRef, useState } from 'react';

import '../quran-knowledge-reader.css';

import {
  getQuranOfflineAyah,
  getQuranOfflineSurah,
  loadQuranOfflinePack,
  parseQuranVerseKey,
  type QuranOfflinePack,
} from '../domain/quranOfflineLibrary';
import type { Locale } from '../i18n/translations';
import type { QuranReadingPreferences } from '../platform/quranReadingPreferences';
import { QuranOfflineReader } from './QuranOfflineReader';

type QuranQuickNavigationCopy = Readonly<{
  title: string;
  surah: string;
  ayah: string;
  loading: string;
}>;

const copy: Readonly<Record<Locale, QuranQuickNavigationCopy>> = {
  en: {
    title: 'Jump to a verse',
    surah: 'Surah',
    ayah: 'Ayah',
    loading: 'Loading Qur’an…',
  },
  ar: {
    title: 'الانتقال إلى آية',
    surah: 'السورة',
    ayah: 'الآية',
    loading: 'جارٍ تحميل القرآن…',
  },
  tr: {
    title: 'Bir ayete git',
    surah: 'Sure',
    ayah: 'Ayet',
    loading: 'Kur’an yükleniyor…',
  },
  id: {
    title: 'Buka ayat',
    surah: 'Surah',
    ayah: 'Ayat',
    loading: 'Memuat Qur’an…',
  },
};

function normalizedInitialVerseKey(
  preferences: QuranReadingPreferences,
  initialVerseKey: string | null,
): string {
  const candidate = initialVerseKey ?? preferences.lastReadAyahId ?? '1:1';
  return parseQuranVerseKey(candidate) ? candidate : '1:1';
}

function applyVisibleTranslationReferences(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-quran-offline-translation]').forEach((translation) => {
    const ayah = translation.closest<HTMLElement>('[data-quran-offline-ayah]');
    const verseKey = ayah?.getAttribute('data-quran-offline-ayah');
    if (!verseKey) return;
    if (translation.getAttribute('data-quran-visible-reference') !== verseKey) {
      translation.setAttribute('data-quran-visible-reference', verseKey);
    }
  });
}

export function QuranKnowledgeReader({
  locale,
  preferences,
  onPreferencesChange,
  initialVerseKey = null,
  onVerseNavigate,
}: Readonly<{
  locale: Locale;
  preferences: QuranReadingPreferences;
  onPreferencesChange: (preferences: QuranReadingPreferences) => void;
  initialVerseKey?: string | null;
  onVerseNavigate?: (verseKey: string) => void;
}>) {
  const labels = copy[locale];
  const [pack, setPack] = useState<QuranOfflinePack | null>(null);
  const [selectedVerseKey, setSelectedVerseKey] = useState(() =>
    normalizedInitialVerseKey(preferences, initialVerseKey),
  );
  const readerHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void loadQuranOfflinePack()
      .then((loaded) => {
        if (!cancelled) setPack(loaded);
      })
      .catch(() => {
        if (!cancelled) setPack(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialVerseKey || !parseQuranVerseKey(initialVerseKey)) return;
    setSelectedVerseKey(initialVerseKey);
  }, [initialVerseKey]);

  useEffect(() => {
    const root = readerHostRef.current;
    if (!root) return;
    const decorate = () => {
      applyVisibleTranslationReferences(root);
    };
    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  const parsedSelection = parseQuranVerseKey(selectedVerseKey);
  const selectedSurah = useMemo(
    () => (pack && parsedSelection ? getQuranOfflineSurah(pack, parsedSelection.surah) : null),
    [pack, parsedSelection?.surah],
  );

  const navigateToVerse = (verseKey: string): void => {
    if (!parseQuranVerseKey(verseKey)) return;
    if (pack && !getQuranOfflineAyah(pack, verseKey)) return;
    setSelectedVerseKey(verseKey);
    onVerseNavigate?.(verseKey);
  };

  return (
    <>
      <section
        className="quran-knowledge-reader__picker"
        data-quran-quick-navigation
        aria-label={labels.title}
      >
        <div className="quran-knowledge-reader__picker-heading">
          <strong>{labels.title}</strong>
          {selectedSurah ? (
            <span>
              {selectedSurah.nameTransliteration} · {selectedSurah.nameArabic}
            </span>
          ) : null}
        </div>
        <div className="quran-knowledge-reader__picker-controls">
          <label>
            <span>{labels.surah}</span>
            <select
              data-quran-surah-select
              aria-label={labels.surah}
              value={String(parsedSelection?.surah ?? 1)}
              disabled={!pack}
              onChange={(event) => {
                const surahNumber = Number(event.target.value);
                const surah = pack ? getQuranOfflineSurah(pack, surahNumber) : null;
                const firstAyah = surah?.ayahs[0];
                if (firstAyah) navigateToVerse(firstAyah.key);
              }}
            >
              {!pack ? <option value="1">{labels.loading}</option> : null}
              {pack?.surahs.map((surah) => (
                <option key={surah.surah} value={surah.surah}>
                  {surah.surah}. {surah.nameTransliteration} — {surah.nameArabic}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{labels.ayah}</span>
            <select
              data-quran-ayah-select
              aria-label={labels.ayah}
              value={selectedVerseKey}
              disabled={!selectedSurah}
              onChange={(event) => {
                navigateToVerse(event.target.value);
              }}
            >
              {!selectedSurah ? <option value={selectedVerseKey}>{labels.loading}</option> : null}
              {selectedSurah?.ayahs.map((ayah) => (
                <option key={ayah.key} value={ayah.key}>
                  {ayah.ayah}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="quran-knowledge-reader__reader-host" ref={readerHostRef}>
        <QuranOfflineReader
          locale={locale}
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
          initialVerseKey={selectedVerseKey}
          onVerseNavigate={(verseKey) => {
            setSelectedVerseKey(verseKey);
            onVerseNavigate?.(verseKey);
          }}
        />
      </div>
    </>
  );
}
