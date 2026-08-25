import { useEffect, useMemo, useState } from 'react';

import {
  getQuranOfflineAyah,
  getQuranOfflineSurah,
  loadQuranOfflinePack,
  parseQuranVerseKey,
  searchQuranOfflinePack,
  type QuranOfflinePack,
  type QuranOfflineSearchResult,
} from '../domain/quranOfflineLibrary';
import {
  getIslamicKnowledgeEntryById,
  islamicKnowledgeEntries,
  type QuranKnowledgeEntry,
} from '../domain/islamicKnowledge';
import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';
import type { Locale } from '../i18n/translations';
import {
  setQuranLastRead,
  toggleQuranBookmark,
  type QuranReadingPreferences,
} from '../platform/quranReadingPreferences';

type QuranReaderCopy = Readonly<{
  title: string;
  complete: string;
  loading: string;
  loadError: string;
  search: string;
  searchPlaceholder: string;
  surah: string;
  showMore: string;
  bookmark: string;
  removeBookmark: string;
  lastRead: string;
  resume: string;
  bookmarks: string;
  bookmarksOnly: string;
  allAyat: string;
  share: string;
  copied: string;
  copyFailed: string;
  source: string;
  tafsir: string;
  related: string;
  noResults: string;
  resultLimit: string;
}>;

const copy: Readonly<Record<Locale, QuranReaderCopy>> = {
  en: {
    title: 'Complete offline Qur’an',
    complete: '114 surahs · 6,236 ayat · packaged for offline reading',
    loading: 'Loading the packaged Qur’an…',
    loadError: 'The packaged Qur’an could not be loaded.',
    search: 'Search the complete Qur’an',
    searchPlaceholder: '1:1, Arabic, translation, surah name…',
    surah: 'Surah',
    showMore: 'Show more ayat',
    bookmark: 'Bookmark',
    removeBookmark: 'Remove bookmark',
    lastRead: 'Mark last read',
    resume: 'Resume last read',
    bookmarks: 'Bookmarks',
    bookmarksOnly: 'Show bookmarks',
    allAyat: 'Show surah',
    share: 'Share ayah',
    copied: 'Ayah copied or shared.',
    copyFailed: 'Sharing is not available on this device.',
    source: 'Source',
    tafsir: 'Tafsir summary',
    related: 'Related ayat',
    noResults: 'No ayat match this search.',
    resultLimit: 'Showing the first 50 matches.',
  },
  ar: {
    title: 'القرآن الكامل دون اتصال',
    complete: '114 سورة · 6236 آية · محفوظ للقراءة دون اتصال',
    loading: 'جارٍ تحميل القرآن المحفوظ…',
    loadError: 'تعذر تحميل القرآن المحفوظ.',
    search: 'البحث في القرآن الكامل',
    searchPlaceholder: '1:1، العربية، الترجمة، اسم السورة…',
    surah: 'السورة',
    showMore: 'عرض المزيد من الآيات',
    bookmark: 'حفظ',
    removeBookmark: 'إزالة الحفظ',
    lastRead: 'تعيين آخر قراءة',
    resume: 'متابعة آخر قراءة',
    bookmarks: 'المحفوظات',
    bookmarksOnly: 'عرض المحفوظات',
    allAyat: 'عرض السورة',
    share: 'مشاركة الآية',
    copied: 'تم نسخ الآية أو مشاركتها.',
    copyFailed: 'المشاركة غير متاحة على هذا الجهاز.',
    source: 'المصدر',
    tafsir: 'ملخص التفسير',
    related: 'آيات ذات صلة',
    noResults: 'لا توجد آيات مطابقة للبحث.',
    resultLimit: 'تظهر أول 50 نتيجة.',
  },
  tr: {
    title: 'Tam çevrimdışı Kur’an',
    complete: '114 sure · 6.236 ayet · çevrimdışı okuma için paketlendi',
    loading: 'Paketlenmiş Kur’an yükleniyor…',
    loadError: 'Paketlenmiş Kur’an yüklenemedi.',
    search: 'Tam Kur’an’da ara',
    searchPlaceholder: '1:1, Arapça, meal, sure adı…',
    surah: 'Sure',
    showMore: 'Daha fazla ayet göster',
    bookmark: 'Kaydet',
    removeBookmark: 'Kaydı kaldır',
    lastRead: 'Son okuma olarak işaretle',
    resume: 'Son okumaya dön',
    bookmarks: 'Yer imleri',
    bookmarksOnly: 'Yer imlerini göster',
    allAyat: 'Sureyi göster',
    share: 'Ayeti paylaş',
    copied: 'Ayet kopyalandı veya paylaşıldı.',
    copyFailed: 'Bu cihazda paylaşım kullanılamıyor.',
    source: 'Kaynak',
    tafsir: 'Tefsir özeti',
    related: 'İlgili ayetler',
    noResults: 'Bu aramayla eşleşen ayet yok.',
    resultLimit: 'İlk 50 eşleşme gösteriliyor.',
  },
  id: {
    title: 'Qur’an lengkap luring',
    complete: '114 surah · 6.236 ayat · dikemas untuk dibaca luring',
    loading: 'Memuat Qur’an yang dikemas…',
    loadError: 'Qur’an yang dikemas tidak dapat dimuat.',
    search: 'Cari Qur’an lengkap',
    searchPlaceholder: '1:1, Arab, terjemahan, nama surah…',
    surah: 'Surah',
    showMore: 'Tampilkan ayat lainnya',
    bookmark: 'Tandai',
    removeBookmark: 'Hapus markah',
    lastRead: 'Tandai terakhir dibaca',
    resume: 'Lanjutkan bacaan terakhir',
    bookmarks: 'Markah',
    bookmarksOnly: 'Tampilkan markah',
    allAyat: 'Tampilkan surah',
    share: 'Bagikan ayat',
    copied: 'Ayat disalin atau dibagikan.',
    copyFailed: 'Berbagi tidak tersedia di perangkat ini.',
    source: 'Sumber',
    tafsir: 'Ringkasan tafsir',
    related: 'Ayat terkait',
    noResults: 'Tidak ada ayat yang cocok dengan pencarian ini.',
    resultLimit: 'Menampilkan 50 hasil pertama.',
  },
};

function curatedEntryForVerseKey(verseKey: string): QuranKnowledgeEntry | null {
  return (
    islamicKnowledgeEntries.find(
      (entry): entry is QuranKnowledgeEntry =>
        entry.module === 'quran' && entry.reference === `Qur’an ${verseKey}`,
    ) ?? null
  );
}

function relatedVerseKeys(entry: QuranKnowledgeEntry): readonly string[] {
  return entry.relatedAyahIds.flatMap((entryId) => {
    const related = getIslamicKnowledgeEntryById(entryId);
    return related?.module === 'quran' ? [related.reference.replace('Qur’an ', '')] : [];
  });
}

async function shareOfflineAyah(
  result: QuranOfflineSearchResult,
  showTranslation: boolean,
): Promise<boolean> {
  const text = [
    result.ayah.arabic,
    showTranslation ? result.ayah.translations['pickthall-1930'] : null,
    `Qur’an ${result.ayah.key}`,
    showTranslation ? 'M. M. Pickthall (1930)' : 'Uthmani Arabic text',
  ]
    .filter((value): value is string => Boolean(value))
    .join('\n\n');

  if (typeof navigator.share === 'function') {
    await navigator.share({ title: `Qur’an ${result.ayah.key}`, text });
    return true;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

export function QuranOfflineReader({
  locale,
  preferences,
  onPreferencesChange,
}: Readonly<{
  locale: Locale;
  preferences: QuranReadingPreferences;
  onPreferencesChange: (preferences: QuranReadingPreferences) => void;
}>) {
  const labels = copy[locale];
  const [pack, setPack] = useState<QuranOfflinePack | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const parsed = preferences.lastReadAyahId
      ? parseQuranVerseKey(preferences.lastReadAyahId)
      : null;
    return parsed?.surah ?? 1;
  });
  const [visibleAyahCount, setVisibleAyahCount] = useState(20);
  const [search, setSearch] = useState('');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    void loadQuranOfflinePack()
      .then((loaded) => {
        if (!cancelled) setPack(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchResults = useMemo(
    () => (pack && search.trim().length > 0 ? searchQuranOfflinePack(pack, search, 50) : []),
    [pack, search],
  );

  const bookmarkResults = useMemo(() => {
    if (!pack || !bookmarksOnly) return [];
    return preferences.bookmarkedAyahIds.flatMap((key) => {
      const result = getQuranOfflineAyah(pack, key);
      return result ? [result] : [];
    });
  }, [bookmarksOnly, pack, preferences.bookmarkedAyahIds]);

  const selected = pack ? getQuranOfflineSurah(pack, selectedSurah) : null;
  const selectedResults: readonly QuranOfflineSearchResult[] = selected
    ? selected.ayahs.slice(0, visibleAyahCount).map((ayah) => ({ surah: selected, ayah }))
    : [];
  const results = bookmarksOnly
    ? bookmarkResults
    : search.trim().length > 0
      ? searchResults
      : selectedResults;

  const jumpToVerse = (verseKey: string): void => {
    const parsed = parseQuranVerseKey(verseKey);
    if (!parsed) return;
    setBookmarksOnly(false);
    setSearch('');
    setSelectedSurah(parsed.surah);
    setVisibleAyahCount(Math.max(20, parsed.ayah));
    globalThis.setTimeout(() => {
      document
        .querySelector(`[data-quran-offline-ayah="${verseKey}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const lastRead = preferences.lastReadAyahId
    ? parseQuranVerseKey(preferences.lastReadAyahId)
    : null;

  return (
    <section className="quran-offline-reader" data-quran-offline-reader>
      <header className="quran-offline-reader__header">
        <div>
          <p className="knowledge-hero__eyebrow">{labels.title}</p>
          <h2>{labels.title}</h2>
          <p>{labels.complete}</p>
        </div>
        <div className="quran-offline-reader__header-actions">
          <button
            type="button"
            aria-pressed={bookmarksOnly}
            data-quran-offline-bookmarks
            onClick={() => {
              setBookmarksOnly((current) => !current);
              setSearch('');
            }}
          >
            {bookmarksOnly
              ? labels.allAyat
              : `${labels.bookmarks} (${String(preferences.bookmarkedAyahIds.filter((key) => parseQuranVerseKey(key)).length)})`}
          </button>
          {lastRead ? (
            <button
              type="button"
              data-quran-offline-resume
              onClick={() => {
                jumpToVerse(`${String(lastRead.surah)}:${String(lastRead.ayah)}`);
              }}
            >
              {labels.resume}: {String(lastRead.surah)}:{String(lastRead.ayah)}
            </button>
          ) : null}
        </div>
      </header>

      {loadError ? (
        <p className="knowledge-empty" role="alert">
          {labels.loadError}
        </p>
      ) : !pack ? (
        <p className="knowledge-empty" role="status">
          {labels.loading}
        </p>
      ) : (
        <>
          <div className="quran-offline-reader__navigation">
            <label>
              <span>{labels.search}</span>
              <input
                type="search"
                data-quran-offline-search
                value={search}
                placeholder={labels.searchPlaceholder}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setBookmarksOnly(false);
                }}
              />
            </label>
            <label>
              <span>{labels.surah}</span>
              <select
                data-quran-surah-select
                value={selectedSurah}
                onChange={(event) => {
                  setSelectedSurah(Number(event.target.value));
                  setVisibleAyahCount(20);
                  setBookmarksOnly(false);
                  setSearch('');
                }}
              >
                {pack.surahs.map((surah) => (
                  <option key={surah.surah} value={surah.surah}>
                    {String(surah.surah)}. {surah.nameTransliteration} · {surah.nameArabic}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {search.trim().length > 0 && searchResults.length === 50 ? (
            <p className="quran-offline-reader__hint">{labels.resultLimit}</p>
          ) : null}

          {results.length === 0 ? (
            <p className="knowledge-empty" role="status">
              {labels.noResults}
            </p>
          ) : (
            <div className="quran-offline-reader__ayat" aria-live="polite">
              {results.map((result) => {
                const curated = curatedEntryForVerseKey(result.ayah.key);
                const tafsirSource = curated
                  ? getIslamicKnowledgeSource(curated.tafsirSourceId)
                  : null;
                const isBookmarked = preferences.bookmarkedAyahIds.includes(result.ayah.key);
                return (
                  <article
                    className="quran-offline-ayah"
                    key={result.ayah.key}
                    data-quran-offline-ayah={result.ayah.key}
                  >
                    <div className="knowledge-card__meta-row">
                      <span className="knowledge-badge">
                        {result.surah.nameTransliteration} · {result.ayah.key}
                      </span>
                      <span className="knowledge-offline">Juz {String(result.ayah.juz)}</span>
                    </div>
                    <p
                      className={`knowledge-card__arabic knowledge-card__arabic--${preferences.arabicFont} knowledge-card__arabic--${preferences.fontScale}`}
                      lang="ar"
                      dir="rtl"
                    >
                      {result.ayah.arabic}
                    </p>
                    {preferences.translationMode === 'pickthall-1930' ? (
                      <p className="quran-offline-ayah__translation">
                        {result.ayah.translations['pickthall-1930']}
                      </p>
                    ) : null}
                    <dl className="knowledge-source-list">
                      <div>
                        <dt>{labels.source}</dt>
                        <dd>
                          Qur’an {result.ayah.key} · Uthmani Arabic · M. M. Pickthall (1930) · Page{' '}
                          {String(result.ayah.page)}
                        </dd>
                      </div>
                    </dl>
                    {curated && tafsirSource ? (
                      <div className="quran-offline-ayah__tafsir">
                        <strong>{labels.tafsir}</strong>
                        <p>{curated.tafsirSummary}</p>
                        <small>{tafsirSource.title}</small>
                      </div>
                    ) : null}
                    <div className="knowledge-card__actions">
                      <button
                        type="button"
                        data-quran-offline-bookmark={result.ayah.key}
                        onClick={() => {
                          onPreferencesChange(toggleQuranBookmark(preferences, result.ayah.key));
                        }}
                      >
                        {isBookmarked ? labels.removeBookmark : labels.bookmark}
                      </button>
                      <button
                        type="button"
                        data-quran-offline-last-read={result.ayah.key}
                        onClick={() => {
                          onPreferencesChange(setQuranLastRead(preferences, result.ayah.key));
                        }}
                      >
                        {labels.lastRead}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void shareOfflineAyah(
                            result,
                            preferences.translationMode === 'pickthall-1930',
                          )
                            .then((shared) => {
                              setShareStatus(shared ? labels.copied : labels.copyFailed);
                            })
                            .catch(() => {
                              setShareStatus(labels.copyFailed);
                            });
                        }}
                      >
                        {labels.share}
                      </button>
                    </div>
                    {curated ? (
                      <div className="quran-offline-ayah__related">
                        <strong>{labels.related}</strong>
                        <div>
                          {relatedVerseKeys(curated).map((verseKey) => (
                            <button
                              type="button"
                              key={verseKey}
                              onClick={() => {
                                jumpToVerse(verseKey);
                              }}
                            >
                              Qur’an {verseKey}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          {!bookmarksOnly &&
          search.trim().length === 0 &&
          selected &&
          visibleAyahCount < selected.ayahs.length ? (
            <button
              type="button"
              className="quran-offline-reader__more"
              data-quran-show-more
              onClick={() => {
                setVisibleAyahCount((current) => Math.min(current + 20, selected.ayahs.length));
              }}
            >
              {labels.showMore}
            </button>
          ) : null}
        </>
      )}

      {shareStatus ? (
        <p className="knowledge-share-status" role="status">
          {shareStatus}
        </p>
      ) : null}
    </section>
  );
}
