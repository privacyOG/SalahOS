import { Fragment, useEffect, useMemo, useState } from 'react';

import {
  getQuranOfflineAyah,
  getQuranOfflineTranslationPresentation,
  getQuranOfflineSurah,
  loadQuranOfflinePack,
  parseQuranVerseKey,
  quranOfflineArabicPresentation,
  quranOfflineReferencePresentation,
  quranOfflineTransliterationPresentation,
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
  type QuranArabicFont,
  type QuranFontScale,
  type QuranReadingPreferences,
  type QuranTranslationMode,
} from '../platform/quranReadingPreferences';
import { BidiText } from './BidiText';

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
  translation: string;
  pickthall: string;
  arabicOnly: string;
  arabicFont: string;
  fontAmiri: string;
  fontSystem: string;
  fontSize: string;
  sizeCompact: string;
  sizeComfortable: string;
  sizeLarge: string;
  sizeXLarge: string;
  readingMode: string;
  listMode: string;
  pageMode: string;
  previousPage: string;
  nextPage: string;
  page: string;
  ayah: string;
  selectedAyah: string;
  quran: string;
  provenance: string;
}>;

const pickthallPresentation = getQuranOfflineTranslationPresentation('pickthall-1930');

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
    translation: 'Translation',
    pickthall: 'M. M. Pickthall (1930)',
    arabicOnly: 'Arabic only',
    arabicFont: 'Arabic font',
    fontAmiri: 'Amiri Quran',
    fontSystem: 'System Arabic',
    fontSize: 'Arabic size',
    sizeCompact: 'Compact',
    sizeComfortable: 'Comfortable',
    sizeLarge: 'Large',
    sizeXLarge: 'Extra large',
    readingMode: 'Reading mode',
    listMode: 'List',
    pageMode: 'Page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    page: 'Page',
    ayah: 'Ayah',
    selectedAyah: 'Selected ayah actions',
    quran: 'Qur’an',
    provenance: 'Uthmani Arabic text · M. M. Pickthall (1930) · packaged offline corpus',
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
    translation: 'الترجمة',
    pickthall: 'م. م. بكتال (1930)',
    arabicOnly: 'العربية فقط',
    arabicFont: 'الخط العربي',
    fontAmiri: 'أميري قرآن',
    fontSystem: 'خط النظام',
    fontSize: 'حجم العربية',
    sizeCompact: 'مضغوط',
    sizeComfortable: 'مريح',
    sizeLarge: 'كبير',
    sizeXLarge: 'كبير جداً',
    readingMode: 'نمط القراءة',
    listMode: 'قائمة',
    pageMode: 'صفحة',
    previousPage: 'الصفحة السابقة',
    nextPage: 'الصفحة التالية',
    page: 'الصفحة',
    ayah: 'الآية',
    selectedAyah: 'إجراءات الآية المحددة',
    quran: 'القرآن',
    provenance: 'النص العربي العثماني · ترجمة م. م. بكتال (1930) · مجموعة محفوظة دون اتصال',
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
    translation: 'Meal',
    pickthall: 'M. M. Pickthall (1930)',
    arabicOnly: 'Yalnızca Arapça',
    arabicFont: 'Arapça yazı tipi',
    fontAmiri: 'Amiri Quran',
    fontSystem: 'Sistem Arapçası',
    fontSize: 'Arapça boyutu',
    sizeCompact: 'Kompakt',
    sizeComfortable: 'Rahat',
    sizeLarge: 'Büyük',
    sizeXLarge: 'Çok büyük',
    readingMode: 'Okuma modu',
    listMode: 'Liste',
    pageMode: 'Sayfa',
    previousPage: 'Önceki sayfa',
    nextPage: 'Sonraki sayfa',
    page: 'Sayfa',
    ayah: 'Ayet',
    selectedAyah: 'Seçili ayet işlemleri',
    quran: 'Kur’an',
    provenance: 'Osmanî Arapça metin · M. M. Pickthall (1930) · çevrimdışı paketlenmiş külliyat',
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
    translation: 'Terjemahan',
    pickthall: 'M. M. Pickthall (1930)',
    arabicOnly: 'Arab saja',
    arabicFont: 'Font Arab',
    fontAmiri: 'Amiri Quran',
    fontSystem: 'Arab sistem',
    fontSize: 'Ukuran Arab',
    sizeCompact: 'Ringkas',
    sizeComfortable: 'Nyaman',
    sizeLarge: 'Besar',
    sizeXLarge: 'Sangat besar',
    readingMode: 'Mode baca',
    listMode: 'Daftar',
    pageMode: 'Halaman',
    previousPage: 'Halaman sebelumnya',
    nextPage: 'Halaman berikutnya',
    page: 'Halaman',
    ayah: 'Ayat',
    selectedAyah: 'Tindakan ayat terpilih',
    quran: 'Qur’an',
    provenance: 'Teks Arab Utsmani · M. M. Pickthall (1930) · korpus luring terkemas',
  },
};

function curatedEntryForVerseKey(verseKey: string): QuranKnowledgeEntry | null {
  const entry = islamicKnowledgeEntries.find(
    (candidate) => candidate.module === 'quran' && candidate.reference === `Qur’an ${verseKey}`,
  );
  return entry?.module === 'quran' ? entry : null;
}

function relatedVerseKeys(entry: QuranKnowledgeEntry): readonly string[] {
  return entry.relatedAyahIds.flatMap((entryId) => {
    const related = getIslamicKnowledgeEntryById(entryId);
    return related?.module === 'quran' ? [related.reference.replace('Qur’an ', '')] : [];
  });
}

export function formatQuranAyahNumber(ayah: number): string {
  return new Intl.NumberFormat('ar-u-nu-arab', { useGrouping: false }).format(ayah);
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
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function initialVerse(
  preferences: QuranReadingPreferences,
  initialVerseKey: string | null,
): string {
  return initialVerseKey ?? preferences.lastReadAyahId ?? '1:1';
}

export function QuranOfflineReader({
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
  const initialParsed = parseQuranVerseKey(initialVerse(preferences, initialVerseKey));
  const [pack, setPack] = useState<QuranOfflinePack | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(initialParsed?.surah ?? 1);
  const [visibleAyahCount, setVisibleAyahCount] = useState(Math.max(20, initialParsed?.ayah ?? 1));
  const [search, setSearch] = useState('');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [activeAyahKey, setActiveAyahKey] = useState(initialVerse(preferences, initialVerseKey));
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void loadQuranOfflinePack()
      .then((loaded) => {
        if (cancelled) return;
        setPack(loaded);
        const target = getQuranOfflineAyah(loaded, initialVerse(preferences, initialVerseKey));
        if (target) {
          const parsed = parseQuranVerseKey(target.ayah.key);
          setSelectedSurah(target.surah.surah);
          setVisibleAyahCount(Math.max(20, parsed?.ayah ?? 1));
          setCurrentPage(target.ayah.page);
          setActiveAyahKey(target.ayah.key);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pack || !initialVerseKey) return;
    const target = getQuranOfflineAyah(pack, initialVerseKey);
    if (!target) return;
    const parsed = parseQuranVerseKey(initialVerseKey);
    setBookmarksOnly(false);
    setSearch('');
    setSelectedSurah(target.surah.surah);
    setVisibleAyahCount(Math.max(20, parsed?.ayah ?? 1));
    setCurrentPage(target.ayah.page);
    setActiveAyahKey(initialVerseKey);
    globalThis.setTimeout(() => {
      document
        .querySelector(`[data-quran-offline-ayah="${initialVerseKey}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }, [initialVerseKey, pack]);

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

  const allResults = useMemo<readonly QuranOfflineSearchResult[]>(
    () =>
      pack ? pack.surahs.flatMap((surah) => surah.ayahs.map((ayah) => ({ surah, ayah }))) : [],
    [pack],
  );
  const maxPage = useMemo(
    () => allResults.reduce((highest, result) => Math.max(highest, result.ayah.page), 1),
    [allResults],
  );
  const pageResults = useMemo(
    () => allResults.filter((result) => result.ayah.page === currentPage),
    [allResults, currentPage],
  );

  const selected = pack ? getQuranOfflineSurah(pack, selectedSurah) : null;
  const selectedResults: readonly QuranOfflineSearchResult[] = selected
    ? selected.ayahs.slice(0, visibleAyahCount).map((ayah) => ({ surah: selected, ayah }))
    : [];
  const normalBrowsing = !bookmarksOnly && search.trim().length === 0;
  const results = bookmarksOnly
    ? bookmarkResults
    : search.trim().length > 0
      ? searchResults
      : preferences.readingMode === 'page'
        ? pageResults
        : selectedResults;
  const activeResult = pack ? getQuranOfflineAyah(pack, activeAyahKey) : null;
  const basmalaArabic = pack ? (getQuranOfflineAyah(pack, '1:1')?.ayah.arabic ?? null) : null;
  const lastRead = preferences.lastReadAyahId
    ? parseQuranVerseKey(preferences.lastReadAyahId)
    : null;

  const persistPatch = (
    patch: Partial<
      Pick<QuranReadingPreferences, 'translationMode' | 'arabicFont' | 'fontScale' | 'readingMode'>
    >,
  ): void => {
    onPreferencesChange({ ...preferences, ...patch });
  };

  const jumpToVerse = (verseKey: string): void => {
    const parsed = parseQuranVerseKey(verseKey);
    if (!parsed) return;
    setBookmarksOnly(false);
    setSearch('');
    setSelectedSurah(parsed.surah);
    setVisibleAyahCount(Math.max(20, parsed.ayah));
    setActiveAyahKey(verseKey);
    if (pack) {
      const target = getQuranOfflineAyah(pack, verseKey);
      if (target) setCurrentPage(target.ayah.page);
    }
    onVerseNavigate?.(verseKey);
    globalThis.setTimeout(() => {
      document
        .querySelector(`[data-quran-offline-ayah="${verseKey}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const selectSurah = (surahNumber: number): void => {
    const surah = pack ? getQuranOfflineSurah(pack, surahNumber) : null;
    const first = surah?.ayahs[0];
    setSelectedSurah(surahNumber);
    setVisibleAyahCount(20);
    setBookmarksOnly(false);
    setSearch('');
    if (first) {
      setCurrentPage(first.page);
      setActiveAyahKey(first.key);
      onVerseNavigate?.(first.key);
    }
  };

  const selectPage = (page: number): void => {
    const nextPage = Math.max(1, Math.min(page, maxPage));
    setCurrentPage(nextPage);
    setBookmarksOnly(false);
    setSearch('');
    const first = allResults.find((result) => result.ayah.page === nextPage);
    if (first) {
      setSelectedSurah(first.surah.surah);
      setActiveAyahKey(first.ayah.key);
      onVerseNavigate?.(first.ayah.key);
    }
  };

  const renderSurahBand = (result: QuranOfflineSearchResult) => {
    const showBasmala = result.surah.surah !== 1 && result.surah.surah !== 9 && basmalaArabic;
    return (
      <header className="quran-surah-band" data-quran-surah-header={result.surah.surah}>
        <div>
          <span lang={quranOfflineTransliterationPresentation.lang} dir="ltr">
            {result.surah.nameTransliteration}
          </span>
          <strong lang="ar" dir="rtl">
            {result.surah.nameArabic}
          </strong>
        </div>
        {showBasmala ? (
          <p lang="ar" dir="rtl" data-quran-basmala>
            {basmalaArabic}
          </p>
        ) : null}
      </header>
    );
  };

  return (
    <section
      className="quran-offline-reader"
      data-quran-offline-reader
      data-reading-mode={preferences.readingMode}
    >
      <header className="quran-offline-reader__header">
        <div>
          <h1>{labels.title}</h1>
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
              {labels.resume}:{' '}
              <BidiText>{`${String(lastRead.surah)}:${String(lastRead.ayah)}`}</BidiText>
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
                  selectSurah(Number(event.target.value));
                }}
              >
                {pack.surahs.map((surah) => (
                  <option
                    key={surah.surah}
                    value={surah.surah}
                    lang={
                      locale === 'ar'
                        ? quranOfflineArabicPresentation.lang
                        : quranOfflineTransliterationPresentation.lang
                    }
                    dir={
                      locale === 'ar'
                        ? quranOfflineArabicPresentation.dir
                        : quranOfflineTransliterationPresentation.dir
                    }
                  >
                    {String(surah.surah)}.{' '}
                    {locale === 'ar' ? surah.nameArabic : surah.nameTransliteration}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="quran-offline-reader__reading-controls" data-quran-reading-controls>
            <label>
              <span>{labels.translation}</span>
              <select
                data-quran-translation-mode
                value={preferences.translationMode}
                onChange={(event) => {
                  persistPatch({ translationMode: event.target.value as QuranTranslationMode });
                }}
              >
                <option value="pickthall-1930">{labels.pickthall}</option>
                <option value="none">{labels.arabicOnly}</option>
              </select>
            </label>
            <label>
              <span>{labels.arabicFont}</span>
              <select
                data-quran-font-select
                value={preferences.arabicFont}
                onChange={(event) => {
                  persistPatch({ arabicFont: event.target.value as QuranArabicFont });
                }}
              >
                <option value="amiri-quran">{labels.fontAmiri}</option>
                <option value="system">{labels.fontSystem}</option>
              </select>
            </label>
            <label>
              <span>{labels.fontSize}</span>
              <select
                data-quran-size-select
                value={preferences.fontScale}
                onChange={(event) => {
                  persistPatch({ fontScale: event.target.value as QuranFontScale });
                }}
              >
                <option value="compact">{labels.sizeCompact}</option>
                <option value="comfortable">{labels.sizeComfortable}</option>
                <option value="large">{labels.sizeLarge}</option>
                <option value="xlarge">{labels.sizeXLarge}</option>
              </select>
            </label>
            <fieldset>
              <legend>{labels.readingMode}</legend>
              <div className="quran-reading-mode" role="group" aria-label={labels.readingMode}>
                {(
                  [
                    ['list', labels.listMode],
                    ['page', labels.pageMode],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    type="button"
                    key={mode}
                    aria-pressed={preferences.readingMode === mode}
                    data-quran-reading-mode={mode}
                    onClick={() => {
                      persistPatch({ readingMode: mode });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {preferences.readingMode === 'page' && normalBrowsing ? (
            <div className="quran-page-navigation" aria-label={labels.readingMode}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  selectPage(currentPage - 1);
                }}
              >
                {labels.previousPage}
              </button>
              <strong>
                {labels.page} {String(currentPage)} / {String(maxPage)}
              </strong>
              <button
                type="button"
                disabled={currentPage >= maxPage}
                onClick={() => {
                  selectPage(currentPage + 1);
                }}
              >
                {labels.nextPage}
              </button>
            </div>
          ) : null}

          {activeResult ? (
            <aside className="quran-ayah-utility" aria-label={labels.selectedAyah}>
              <strong>
                <BidiText>{`${labels.quran} ${activeResult.ayah.key}`}</BidiText>
              </strong>
              <div>
                <button
                  type="button"
                  data-quran-offline-bookmark={activeResult.ayah.key}
                  onClick={() => {
                    onPreferencesChange(toggleQuranBookmark(preferences, activeResult.ayah.key));
                  }}
                >
                  {preferences.bookmarkedAyahIds.includes(activeResult.ayah.key)
                    ? labels.removeBookmark
                    : labels.bookmark}
                </button>
                <button
                  type="button"
                  data-quran-offline-last-read={activeResult.ayah.key}
                  onClick={() => {
                    onPreferencesChange(setQuranLastRead(preferences, activeResult.ayah.key));
                  }}
                >
                  {labels.lastRead}
                </button>
                <button
                  type="button"
                  data-quran-offline-share={activeResult.ayah.key}
                  onClick={() => {
                    void shareOfflineAyah(
                      activeResult,
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
            </aside>
          ) : null}

          {search.trim().length > 0 && searchResults.length === 50 ? (
            <p className="quran-offline-reader__hint">{labels.resultLimit}</p>
          ) : null}

          {results.length === 0 ? (
            <p className="knowledge-empty" role="status">
              {labels.noResults}
            </p>
          ) : (
            <>
              {normalBrowsing && preferences.readingMode === 'list' && selectedResults[0]
                ? renderSurahBand(selectedResults[0])
                : null}
              <div
                className={`quran-offline-reader__ayat quran-offline-reader__ayat--${preferences.readingMode}`}
                aria-live="polite"
              >
                {results.map((result) => {
                  const parsed = parseQuranVerseKey(result.ayah.key);
                  const curated = curatedEntryForVerseKey(result.ayah.key);
                  const tafsirSource = curated
                    ? getIslamicKnowledgeSource(curated.tafsirSourceId)
                    : null;
                  const showPageSurahBand =
                    normalBrowsing && preferences.readingMode === 'page' && parsed?.ayah === 1;
                  return (
                    <Fragment key={result.ayah.key}>
                      {showPageSurahBand ? renderSurahBand(result) : null}
                      <article
                        className="quran-offline-ayah"
                        data-quran-offline-ayah={result.ayah.key}
                        data-active={activeAyahKey === result.ayah.key ? 'true' : undefined}
                        onClick={() => {
                          setActiveAyahKey(result.ayah.key);
                          onVerseNavigate?.(result.ayah.key);
                        }}
                      >
                        {!normalBrowsing ? (
                          <p
                            className="quran-offline-ayah__reference"
                            lang={quranOfflineTransliterationPresentation.lang}
                            dir={quranOfflineTransliterationPresentation.dir}
                          >
                            {result.surah.nameTransliteration} ·{' '}
                            <BidiText>{result.ayah.key}</BidiText> · Juz {String(result.ayah.juz)}
                          </p>
                        ) : null}
                        <p
                          className="knowledge-card__arabic"
                          lang="ar"
                          dir="rtl"
                          data-quran-font={preferences.arabicFont}
                          data-quran-scale={preferences.fontScale}
                        >
                          {result.ayah.arabic}{' '}
                          <span
                            className="quran-offline-ayah__marker"
                            aria-label={`${labels.ayah} ${String(parsed?.ayah ?? '')}`}
                          >
                            ۝ {formatQuranAyahNumber(parsed?.ayah ?? 1)}
                          </span>
                        </p>
                        {preferences.translationMode === 'pickthall-1930' ? (
                          <p
                            className="quran-offline-ayah__translation"
                            data-quran-offline-translation
                            lang={pickthallPresentation.lang}
                            dir={pickthallPresentation.dir}
                          >
                            {result.ayah.translations['pickthall-1930']}
                          </p>
                        ) : null}
                        {curated && tafsirSource ? (
                          <div className="quran-offline-ayah__tafsir">
                            <strong>{labels.tafsir}</strong>
                            <p
                              data-quran-tafsir-summary
                              lang={curated.tafsirSummaryPresentation.lang}
                              dir={curated.tafsirSummaryPresentation.dir}
                            >
                              {curated.tafsirSummary}
                            </p>
                            <small
                              lang={tafsirSource.displayPresentation.lang}
                              dir={tafsirSource.displayPresentation.dir}
                            >
                              {tafsirSource.title}
                            </small>
                          </div>
                        ) : null}
                        {curated ? (
                          <div className="quran-offline-ayah__related">
                            <strong>{labels.related}</strong>
                            <div>
                              {relatedVerseKeys(curated).map((verseKey) => (
                                <button
                                  type="button"
                                  key={verseKey}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    jumpToVerse(verseKey);
                                  }}
                                  data-quran-related-reference
                                  lang={quranOfflineReferencePresentation.lang}
                                  dir={quranOfflineReferencePresentation.dir}
                                >
                                  {labels.quran} <BidiText>{verseKey}</BidiText>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    </Fragment>
                  );
                })}
              </div>
            </>
          )}

          {normalBrowsing &&
          preferences.readingMode === 'list' &&
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

          {normalBrowsing ? (
            <footer className="quran-reader-info" data-quran-reader-provenance>
              <strong>{labels.source}</strong>
              <p data-knowledge-source-metadata lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {labels.provenance}
                {preferences.readingMode === 'page'
                  ? ` · ${labels.page} ${String(currentPage)}`
                  : selected
                    ? ` · ${labels.surah} ${String(selected.surah)}`
                    : ''}
              </p>
            </footer>
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
