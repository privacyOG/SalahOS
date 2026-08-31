import { useMemo, useState } from 'react';

import {
  filterIslamicKnowledge,
  getIslamicKnowledgeEntryById,
  type IslamicKnowledgeEntry,
  type IslamicKnowledgeModule,
  type QuranKnowledgeEntry,
} from '../domain/islamicKnowledge';
import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';
import { FiqhStage7Details, HadithStage7Details } from './KnowledgeStage7Details';
import { BidiText } from './BidiText';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadQuranReadingPreferences,
  saveQuranReadingPreferences,
  setQuranLastRead,
  toggleQuranBookmark,
  type QuranArabicFont,
  type QuranFontScale,
  type QuranReadingPreferences,
  type QuranTranslationMode,
} from '../platform/quranReadingPreferences';
import { loadPersistedSettings } from '../platform/settingsStorage';

type KnowledgeCopy = Readonly<{
  eyebrow: string;
  title: string;
  intro: string;
  search: string;
  searchPlaceholder: string;
  all: string;
  quran: string;
  hadith: string;
  fiqh: string;
  qa: string;
  offline: string;
  source: string;
  collection: string;
  grade: string;
  gradedBy: string;
  scholar: string;
  noResults: string;
  guidance: string;
  quranReader: string;
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
  bookmarks: string;
  bookmarksOnly: string;
  allAyat: string;
  resume: string;
  markLastRead: string;
  bookmarked: string;
  bookmark: string;
  removeBookmark: string;
  share: string;
  shared: string;
  shareFailed: string;
  tafsir: string;
  tafsirSummary: string;
  relatedAyat: string;
  topics: string;
}>;

type KnowledgeFilter = IslamicKnowledgeModule | 'fiqh' | 'all';

const copy: Readonly<Record<Locale, KnowledgeCopy>> = {
  en: {
    eyebrow: 'Islamic Knowledge',
    title: 'Read with sources in view',
    intro:
      'A compact offline-first library for Qur’an passages, rigorously attributed hadith and source-aware Q&A. It is designed for learning, not as a substitute for a qualified scholar in personal rulings.',
    search: 'Search the library',
    searchPlaceholder: 'Ayah, text, topic, prayer, travel…',
    all: 'All',
    quran: 'Qur’an',
    hadith: 'Hadith',
    fiqh: 'Fiqh',
    qa: 'Q&A',
    offline: 'Available offline',
    source: 'Source',
    collection: 'Collection',
    grade: 'Grade',
    gradedBy: 'Grading authority',
    scholar: 'Scholar attribution',
    noResults: 'No knowledge entries match this search.',
    guidance:
      'Q&A summaries preserve source and scholar attribution and call out juristic variation where it matters.',
    quranReader: 'Qur’an reading controls',
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
    bookmarks: 'Bookmarks',
    bookmarksOnly: 'Show bookmarks',
    allAyat: 'Show all ayat',
    resume: 'Resume last read',
    markLastRead: 'Mark last read',
    bookmarked: 'Bookmarked',
    bookmark: 'Bookmark',
    removeBookmark: 'Remove bookmark',
    share: 'Share ayah',
    shared: 'Ayah copied or shared.',
    shareFailed: 'Sharing is not available on this device.',
    tafsir: 'Tafsir source',
    tafsirSummary: 'Tafsir summary',
    relatedAyat: 'Related ayat',
    topics: 'Topics',
  },
  ar: {
    eyebrow: 'المعرفة الإسلامية',
    title: 'اقرأ والمصادر أمامك',
    intro:
      'مكتبة موجزة تعمل دون اتصال لآيات من القرآن وأحاديث موثقة وأسئلة وأجوبة مع نسبة المصادر. هي للتعلّم وليست بديلاً عن العالم المؤهل في الأحكام الشخصية.',
    search: 'ابحث في المكتبة',
    searchPlaceholder: 'آية، نص، موضوع، صلاة، سفر…',
    all: 'الكل',
    quran: 'القرآن',
    hadith: 'الحديث',
    fiqh: 'الفقه',
    qa: 'سؤال وجواب',
    offline: 'متاح دون اتصال',
    source: 'المصدر',
    collection: 'المجموعة',
    grade: 'الدرجة',
    gradedBy: 'جهة التصحيح',
    scholar: 'نسبة العالم',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    guidance:
      'تحافظ ملخصات الأسئلة والأجوبة على نسبة المصدر والعالم وتوضح مواضع اختلاف الفقهاء عند الحاجة.',
    quranReader: 'إعدادات قراءة القرآن',
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
    bookmarks: 'المحفوظات',
    bookmarksOnly: 'عرض المحفوظات',
    allAyat: 'عرض كل الآيات',
    resume: 'متابعة آخر قراءة',
    markLastRead: 'تعيين آخر قراءة',
    bookmarked: 'محفوظة',
    bookmark: 'حفظ',
    removeBookmark: 'إزالة الحفظ',
    share: 'مشاركة الآية',
    shared: 'تم نسخ الآية أو مشاركتها.',
    shareFailed: 'المشاركة غير متاحة على هذا الجهاز.',
    tafsir: 'مصدر التفسير',
    tafsirSummary: 'ملخص التفسير',
    relatedAyat: 'آيات ذات صلة',
    topics: 'الموضوعات',
  },
  tr: {
    eyebrow: 'İslami Bilgi',
    title: 'Kaynakları görünür tutarak okuyun',
    intro:
      'Kur’an pasajları, kaynaklandırılmış hadisler ve kaynak duyarlı soru-cevap için çevrimdışı çalışan kısa bir kütüphane. Kişisel fetvalarda ehil bir âlimin yerini tutmaz.',
    search: 'Kütüphanede ara',
    searchPlaceholder: 'Ayet, metin, konu, namaz, yolculuk…',
    all: 'Tümü',
    quran: 'Kur’an',
    hadith: 'Hadis',
    fiqh: 'Fıkıh',
    qa: 'Soru & Cevap',
    offline: 'Çevrimdışı kullanılabilir',
    source: 'Kaynak',
    collection: 'Koleksiyon',
    grade: 'Derece',
    gradedBy: 'Derecelendiren',
    scholar: 'Âlim atfı',
    noResults: 'Bu aramayla eşleşen bilgi kaydı yok.',
    guidance:
      'Soru-cevap özetleri kaynak ve âlim atfını korur, gerektiğinde fıkhî ihtilafı açıkça belirtir.',
    quranReader: 'Kur’an okuma kontrolleri',
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
    bookmarks: 'Yer imleri',
    bookmarksOnly: 'Yer imlerini göster',
    allAyat: 'Tüm ayetleri göster',
    resume: 'Son okumaya dön',
    markLastRead: 'Son okuma olarak işaretle',
    bookmarked: 'Kaydedildi',
    bookmark: 'Kaydet',
    removeBookmark: 'Kaydı kaldır',
    share: 'Ayeti paylaş',
    shared: 'Ayet kopyalandı veya paylaşıldı.',
    shareFailed: 'Bu cihazda paylaşım kullanılamıyor.',
    tafsir: 'Tefsir kaynağı',
    tafsirSummary: 'Tefsir özeti',
    relatedAyat: 'İlgili ayetler',
    topics: 'Konular',
  },
  id: {
    eyebrow: 'Pengetahuan Islam',
    title: 'Membaca dengan sumber yang terlihat',
    intro:
      'Pustaka ringkas yang ramah luring untuk ayat Qur’an, hadis dengan atribusi jelas, dan tanya-jawab berbasis sumber. Ini untuk pembelajaran, bukan pengganti ulama yang kompeten dalam fatwa pribadi.',
    search: 'Cari di pustaka',
    searchPlaceholder: 'Ayat, teks, topik, salat, perjalanan…',
    all: 'Semua',
    quran: 'Qur’an',
    hadith: 'Hadis',
    fiqh: 'Fikih',
    qa: 'Tanya & Jawab',
    offline: 'Tersedia luring',
    source: 'Sumber',
    collection: 'Koleksi',
    grade: 'Derajat',
    gradedBy: 'Otoritas penilaian',
    scholar: 'Atribusi ulama',
    noResults: 'Tidak ada entri yang cocok dengan pencarian ini.',
    guidance:
      'Ringkasan tanya-jawab mempertahankan atribusi sumber dan ulama serta menandai perbedaan fikih bila relevan.',
    quranReader: 'Kontrol membaca Qur’an',
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
    bookmarks: 'Markah',
    bookmarksOnly: 'Tampilkan markah',
    allAyat: 'Tampilkan semua ayat',
    resume: 'Lanjutkan bacaan terakhir',
    markLastRead: 'Tandai terakhir dibaca',
    bookmarked: 'Ditandai',
    bookmark: 'Tandai',
    removeBookmark: 'Hapus markah',
    share: 'Bagikan ayat',
    shared: 'Ayat disalin atau dibagikan.',
    shareFailed: 'Berbagi tidak tersedia di perangkat ini.',
    tafsir: 'Sumber tafsir',
    tafsirSummary: 'Ringkasan tafsir',
    relatedAyat: 'Ayat terkait',
    topics: 'Topik',
  },
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

function shareTextForAyah(entry: QuranKnowledgeEntry, showTranslation: boolean): string {
  return [
    entry.arabic,
    showTranslation ? entry.translation : null,
    entry.reference,
    showTranslation ? entry.source : 'Arabic Uthmani text',
  ]
    .filter((value): value is string => Boolean(value))
    .join('\n\n');
}

async function shareAyah(entry: QuranKnowledgeEntry, showTranslation: boolean): Promise<boolean> {
  const text = shareTextForAyah(entry, showTranslation);
  if (typeof navigator.share === 'function') {
    await navigator.share({ title: entry.title, text });
    return true;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function QuranEntryCard({
  entry,
  labels,
  preferences,
  onToggleBookmark,
  onMarkLastRead,
  onOpenRelated,
  onShareStatus,
}: Readonly<{
  entry: QuranKnowledgeEntry;
  labels: KnowledgeCopy;
  preferences: QuranReadingPreferences;
  onToggleBookmark: (entryId: string) => void;
  onMarkLastRead: (entryId: string) => void;
  onOpenRelated: (entryId: string) => void;
  onShareStatus: (message: string) => void;
}>) {
  const bookmarked = preferences.bookmarkedAyahIds.includes(entry.id);
  const showTranslation = preferences.translationMode !== 'none';
  const arabicSource = getIslamicKnowledgeSource(entry.arabicSourceId);
  const translationSource = getIslamicKnowledgeSource(entry.translationSourceId);
  const tafsirSource = getIslamicKnowledgeSource(entry.tafsirSourceId);
  const related = entry.relatedAyahIds
    .map((id) => getIslamicKnowledgeEntryById(id))
    .filter((candidate): candidate is QuranKnowledgeEntry => candidate?.module === 'quran');

  return (
    <article
      className="knowledge-card knowledge-card--quran"
      data-knowledge-module="quran"
      data-quran-ayah-id={entry.id}
      data-quran-bookmarked={bookmarked ? 'true' : 'false'}
    >
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">{labels.quran}</span>
        <span className="knowledge-offline">{bookmarked ? labels.bookmarked : labels.offline}</span>
      </div>
      <h3>{entry.title}</h3>
      <p
        className="knowledge-card__arabic"
        lang="ar"
        dir="rtl"
        data-quran-font={preferences.arabicFont}
        data-quran-scale={preferences.fontScale}
      >
        {entry.arabic}
      </p>
      {showTranslation ? (
        <p
          data-quran-translation
          lang={entry.translationPresentation.lang}
          dir={entry.translationPresentation.dir}
        >
          {entry.translation}
        </p>
      ) : null}

      <div className="knowledge-quran-actions" aria-label={entry.reference}>
        <button
          type="button"
          aria-pressed={bookmarked}
          data-quran-bookmark={entry.id}
          onClick={() => {
            onToggleBookmark(entry.id);
          }}
        >
          {bookmarked ? labels.removeBookmark : labels.bookmark}
        </button>
        <button
          type="button"
          data-quran-last-read={entry.id}
          onClick={() => {
            onMarkLastRead(entry.id);
          }}
        >
          {labels.markLastRead}
        </button>
        <button
          type="button"
          data-quran-share={entry.id}
          onClick={() => {
            void shareAyah(entry, showTranslation)
              .then((shared) => {
                onShareStatus(shared ? labels.shared : labels.shareFailed);
              })
              .catch(() => {
                onShareStatus(labels.shareFailed);
              });
          }}
        >
          {labels.share}
        </button>
      </div>

      <dl className="knowledge-source-list">
        <div>
          <dt>{labels.source}</dt>
          <dd
            data-knowledge-source-metadata
            lang={entry.referencePresentation.lang}
            dir={entry.referencePresentation.dir}
          >
            <BidiText>{entry.reference}</BidiText> ·{' '}
            <span
              lang={arabicSource?.displayPresentation.lang ?? entry.referencePresentation.lang}
              dir={arabicSource?.displayPresentation.dir ?? entry.referencePresentation.dir}
            >
              {arabicSource?.title ?? entry.arabicSourceId}
            </span>
            {showTranslation ? (
              <>
                {' · '}
                <span
                  lang={
                    translationSource?.displayPresentation.lang ??
                    entry.translationPresentation.lang
                  }
                  dir={
                    translationSource?.displayPresentation.dir ?? entry.translationPresentation.dir
                  }
                >
                  {translationSource?.title ?? entry.translationSourceId}
                </span>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>{labels.tafsir}</dt>
          <dd
            data-knowledge-source-metadata
            lang={tafsirSource?.displayPresentation.lang ?? entry.tafsirSummaryPresentation.lang}
            dir={tafsirSource?.displayPresentation.dir ?? entry.tafsirSummaryPresentation.dir}
          >
            {tafsirSource?.title ?? entry.tafsirSourceId}
          </dd>
        </div>
      </dl>

      <section className="knowledge-tafsir" data-quran-tafsir>
        <h4>{labels.tafsirSummary}</h4>
        <p
          data-quran-tafsir-summary
          lang={entry.tafsirSummaryPresentation.lang}
          dir={entry.tafsirSummaryPresentation.dir}
        >
          {entry.tafsirSummary}
        </p>
      </section>

      <div className="knowledge-topics" data-quran-topics>
        <strong>{labels.topics}</strong>
        <span>{entry.topics.join(' · ')}</span>
      </div>

      <div className="knowledge-related" data-quran-related>
        <strong>{labels.relatedAyat}</strong>
        <div>
          {related.map((relatedEntry) => (
            <button
              type="button"
              key={relatedEntry.id}
              onClick={() => {
                onOpenRelated(relatedEntry.id);
              }}
              data-quran-related-reference
              lang={relatedEntry.referencePresentation.lang}
              dir={relatedEntry.referencePresentation.dir}
            >
              <BidiText>{relatedEntry.reference}</BidiText>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function KnowledgeEntryCard({
  entry,
  labels,
  locale,
  quranPreferences,
  onToggleBookmark,
  onMarkLastRead,
  onOpenRelated,
  onSearchHadithTopic,
  onNavigateHadith,
  onShareStatus,
}: Readonly<{
  entry: IslamicKnowledgeEntry;
  labels: KnowledgeCopy;
  locale: Locale;
  quranPreferences: QuranReadingPreferences;
  onToggleBookmark: (entryId: string) => void;
  onMarkLastRead: (entryId: string) => void;
  onOpenRelated: (entryId: string) => void;
  onSearchHadithTopic: (topic: string) => void;
  onNavigateHadith: (entryId: string) => void;
  onShareStatus: (message: string) => void;
}>) {
  if (entry.module === 'quran') {
    return (
      <QuranEntryCard
        entry={entry}
        labels={labels}
        preferences={quranPreferences}
        onToggleBookmark={onToggleBookmark}
        onMarkLastRead={onMarkLastRead}
        onOpenRelated={onOpenRelated}
        onShareStatus={onShareStatus}
      />
    );
  }

  if (entry.module === 'hadith') {
    return (
      <article className="knowledge-card knowledge-card--hadith" data-knowledge-module="hadith">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.hadith}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <HadithStage7Details
          entry={entry}
          locale={locale}
          onSearchTopic={onSearchHadithTopic}
          onNavigateHadith={onNavigateHadith}
        />
      </article>
    );
  }

  return (
    <article
      className="knowledge-card knowledge-card--fiqh"
      data-knowledge-module="qa"
      data-knowledge-content-type={entry.contentType}
    >
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">
          {entry.contentType === 'fiqh' ? labels.fiqh : labels.qa}
        </span>
        <span className="knowledge-offline">{labels.offline}</span>
      </div>
      <h3>{entry.question}</h3>
      {entry.contentType === 'fiqh' ? (
        <FiqhStage7Details entry={entry} locale={locale} />
      ) : (
        <p>{entry.answer}</p>
      )}
    </article>
  );
}

export function KnowledgeScreen({
  scope = 'library',
}: Readonly<{ scope?: 'library' | 'quran' | 'hadith' }>) {
  const locale = currentLocale();
  const labels = copy[locale];
  const [module, setModule] = useState<KnowledgeFilter>(() =>
    scope === 'hadith' ? 'hadith' : scope === 'quran' ? 'quran' : 'all',
  );
  const [query, setQuery] = useState('');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [quranPreferences, setQuranPreferences] = useState<QuranReadingPreferences>(() =>
    loadQuranReadingPreferences(getApplicationStorage()),
  );
  const entries = useMemo(() => {
    const baseModule: IslamicKnowledgeModule | 'all' = module === 'fiqh' ? 'qa' : module;
    const filtered = filterIslamicKnowledge(baseModule, query);
    const scoped =
      module === 'fiqh'
        ? filtered.filter((entry) => entry.module === 'qa' && entry.contentType === 'fiqh')
        : filtered;
    const surfaceScoped =
      scope === 'hadith'
        ? scoped.filter((entry) => entry.module === 'hadith')
        : scope === 'quran'
          ? scoped.filter((entry) => entry.module === 'quran')
          : scoped.filter((entry) => entry.module !== 'quran' && entry.module !== 'hadith');
    return surfaceScoped;
  }, [module, query, scope]);

  const persistQuranPreferences = (next: QuranReadingPreferences): void => {
    setQuranPreferences(next);
    saveQuranReadingPreferences(getApplicationStorage(), next);
  };

  const setTranslationMode = (translationMode: QuranTranslationMode): void => {
    persistQuranPreferences({ ...quranPreferences, translationMode });
  };
  const setArabicFont = (arabicFont: QuranArabicFont): void => {
    persistQuranPreferences({ ...quranPreferences, arabicFont });
  };
  const setFontScale = (fontScale: QuranFontScale): void => {
    persistQuranPreferences({ ...quranPreferences, fontScale });
  };

  const filters: readonly Readonly<{
    id: KnowledgeFilter;
    label: string;
  }>[] =
    scope === 'hadith' || scope === 'quran'
      ? []
      : [
          { id: 'all', label: labels.all },
          { id: 'fiqh', label: labels.fiqh },
          { id: 'qa', label: labels.qa },
        ];

  const resumeEntry = quranPreferences.lastReadAyahId
    ? getIslamicKnowledgeEntryById(quranPreferences.lastReadAyahId)
    : null;

  return (
    <main className="knowledge-screen" data-knowledge-screen>
      <header className="knowledge-hero">
        <p className="knowledge-hero__eyebrow">{labels.eyebrow}</p>
        <h1>{labels.title}</h1>
        <p>{labels.intro}</p>
        <div className="knowledge-hero__status" role="note">
          <span>{labels.offline}</span>
          <span aria-hidden="true">•</span>
          <span>{labels.guidance}</span>
        </div>
      </header>

      <section className="knowledge-controls" aria-label={labels.search}>
        <label className="knowledge-search">
          <span>{labels.search}</span>
          <input
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        {filters.length > 0 ? (
          <div className="knowledge-filter" role="group" aria-label={labels.eyebrow}>
            {filters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                aria-pressed={module === filter.id}
                data-knowledge-filter={filter.id}
                onClick={() => {
                  setModule(filter.id);
                  if (filter.id !== 'quran') setBookmarksOnly(false);
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {module === 'quran' ? (
        <section className="knowledge-quran-reader" data-quran-reading-controls>
          <div className="knowledge-quran-reader__heading">
            <div>
              <p>{labels.quranReader}</p>
              <strong>
                {labels.bookmarks}: {quranPreferences.bookmarkedAyahIds.length}
              </strong>
            </div>
            <div className="knowledge-quran-reader__actions">
              <button
                type="button"
                aria-pressed={bookmarksOnly}
                data-quran-bookmarks-only
                onClick={() => {
                  setBookmarksOnly((current) => !current);
                }}
              >
                {bookmarksOnly ? labels.allAyat : labels.bookmarksOnly}
              </button>
              {resumeEntry?.module === 'quran' ? (
                <button
                  type="button"
                  data-quran-resume
                  onClick={() => {
                    setBookmarksOnly(false);
                    setQuery(resumeEntry.reference.replace('Qur’an ', ''));
                  }}
                >
                  {labels.resume}: <BidiText>{resumeEntry.reference}</BidiText>
                </button>
              ) : null}
            </div>
          </div>

          <div className="knowledge-quran-settings">
            <label>
              <span>{labels.translation}</span>
              <select
                data-quran-translation-mode
                value={quranPreferences.translationMode}
                onChange={(event) => {
                  setTranslationMode(event.target.value as QuranTranslationMode);
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
                value={quranPreferences.arabicFont}
                onChange={(event) => {
                  setArabicFont(event.target.value as QuranArabicFont);
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
                value={quranPreferences.fontScale}
                onChange={(event) => {
                  setFontScale(event.target.value as QuranFontScale);
                }}
              >
                <option value="compact">{labels.sizeCompact}</option>
                <option value="comfortable">{labels.sizeComfortable}</option>
                <option value="large">{labels.sizeLarge}</option>
                <option value="xlarge">{labels.sizeXLarge}</option>
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {shareStatus ? (
        <p className="knowledge-share-status" role="status">
          {shareStatus}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="knowledge-empty" role="status">
          {labels.noResults}
        </p>
      ) : (
        <section className="knowledge-grid" aria-live="polite">
          {entries.map((entry) => (
            <KnowledgeEntryCard
              key={entry.id}
              entry={entry}
              labels={labels}
              locale={locale}
              quranPreferences={quranPreferences}
              onToggleBookmark={(entryId) => {
                persistQuranPreferences(toggleQuranBookmark(quranPreferences, entryId));
              }}
              onMarkLastRead={(entryId) => {
                persistQuranPreferences(setQuranLastRead(quranPreferences, entryId));
              }}
              onOpenRelated={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'quran') return;
                setModule('quran');
                setBookmarksOnly(false);
                setQuery(related.reference.replace('Qur’an ', ''));
              }}
              onSearchHadithTopic={(topic) => {
                setModule('hadith');
                setBookmarksOnly(false);
                setQuery(topic);
              }}
              onNavigateHadith={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'hadith') return;
                setModule('hadith');
                setBookmarksOnly(false);
                setQuery(related.reference);
              }}
              onShareStatus={setShareStatus}
            />
          ))}
        </section>
      )}
    </main>
  );
}
