from pathlib import Path

ROOT = Path('.')


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding='utf-8')


write('src/ui/applicationRoute.ts', r'''export type ProductSurface = 'congregation' | 'admin';
export type CongregationDestination =
  'today' | 'calendar' | 'mosques' | 'qiblah' | 'knowledge' | 'community' | 'settings';
export type KnowledgeView = 'library' | 'quran' | 'hadith';
export type SettingsCategory =
  'location' | 'prayer' | 'adhan' | 'display' | 'mosques' | 'privacy-data' | 'advanced';
export type AdminDestination =
  | 'overview'
  | 'prayer-iqamah'
  | 'jumuah-ramadan'
  | 'community'
  | 'displays'
  | 'integrations'
  | 'members'
  | 'settings';
const congregationDestinations = new Set<CongregationDestination>([
  'today',
  'calendar',
  'mosques',
  'qiblah',
  'knowledge',
  'community',
  'settings',
]);
const knowledgeViews = new Set<KnowledgeView>(['library', 'quran', 'hadith']);
const settingsCategories = new Set<SettingsCategory>([
  'location',
  'prayer',
  'adhan',
  'display',
  'mosques',
  'privacy-data',
  'advanced',
]);
const legacySettingsCategories: Readonly<Record<string, SettingsCategory>> = Object.freeze({
  mosque: 'mosques',
  notifications: 'adhan',
  appearance: 'display',
  'data-privacy': 'privacy-data',
  'display-themes': 'display',
});
const adminDestinations = new Set<AdminDestination>([
  'overview',
  'prayer-iqamah',
  'jumuah-ramadan',
  'community',
  'displays',
  'integrations',
  'members',
  'settings',
]);
const legacyAdminDestinations: Readonly<Record<string, AdminDestination>> = Object.freeze({
  themes: 'displays',
  remote: 'displays',
});
const quranVerseKeyPattern = /^(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):(?:[1-9]|[1-9]\d|[1-2]\d\d)$/;

export function readProductSurface(search: string): ProductSurface {
  return new URLSearchParams(search).get('surface') === 'admin' ? 'admin' : 'congregation';
}
export function readCongregationDestination(search: string): CongregationDestination {
  const requested = new URLSearchParams(search).get('view');
  return requested !== null && congregationDestinations.has(requested as CongregationDestination)
    ? (requested as CongregationDestination)
    : 'today';
}
export function readKnowledgeView(search: string): KnowledgeView {
  if (readCongregationDestination(search) !== 'knowledge') return 'library';
  const requested = new URLSearchParams(search).get('knowledgeView');
  return requested !== null && knowledgeViews.has(requested as KnowledgeView)
    ? (requested as KnowledgeView)
    : 'library';
}
export function readQuranVerseKey(search: string): string | null {
  if (readKnowledgeView(search) !== 'quran') return null;
  const requested = new URLSearchParams(search).get('ayah');
  return requested !== null && quranVerseKeyPattern.test(requested) ? requested : null;
}
export function readSettingsCategory(search: string): SettingsCategory | null {
  const params = new URLSearchParams(search);
  if (readProductSurface(search) !== 'congregation' || params.get('view') !== 'settings')
    return null;
  const requested = params.get('settingsView');
  if (requested !== null && settingsCategories.has(requested as SettingsCategory))
    return requested as SettingsCategory;
  return requested !== null && requested in legacySettingsCategories
    ? (legacySettingsCategories[requested] ?? null)
    : null;
}
export function readAdminDestination(search: string): AdminDestination {
  const requested = new URLSearchParams(search).get('adminView');
  if (requested !== null && adminDestinations.has(requested as AdminDestination))
    return requested as AdminDestination;
  if (requested !== null && requested in legacyAdminDestinations)
    return legacyAdminDestinations[requested] ?? 'overview';
  return 'overview';
}
function preserveUnrelatedParameters(search: string) {
  return new URLSearchParams(search);
}
function clearKnowledgeParameters(params: URLSearchParams): void {
  params.delete('knowledgeView');
  params.delete('ayah');
}
export function searchForCongregationDestination(
  currentSearch: string,
  destination: CongregationDestination,
) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  params.delete('settingsView');
  if (destination !== 'knowledge') clearKnowledgeParameters(params);
  params.set('view', destination);
  return `?${params.toString()}`;
}
export function searchForKnowledgeView(
  currentSearch: string,
  knowledgeView: KnowledgeView,
  ayah: string | null = null,
) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  params.delete('settingsView');
  params.set('view', 'knowledge');
  params.set('knowledgeView', knowledgeView);
  if (knowledgeView === 'quran' && ayah !== null && quranVerseKeyPattern.test(ayah)) {
    params.set('ayah', ayah);
  } else {
    params.delete('ayah');
  }
  return `?${params.toString()}`;
}
export function searchForSettingsCategory(
  currentSearch: string,
  category: SettingsCategory | null,
) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  clearKnowledgeParameters(params);
  params.set('view', 'settings');
  if (category === null) params.delete('settingsView');
  else params.set('settingsView', category);
  return `?${params.toString()}`;
}
export function searchForAdminDestination(currentSearch: string, destination: AdminDestination) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.set('surface', 'admin');
  params.set('adminView', destination);
  params.delete('view');
  params.delete('settingsView');
  clearKnowledgeParameters(params);
  return `?${params.toString()}`;
}
''')

write('src/ui/KnowledgeExperience.tsx', r'''import { useEffect, useState } from 'react';

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
''')

write('src/platform/quranReadingPreferences.ts', r'''import type { KeyValueStorage } from './settingsStorage';

export const QURAN_READING_PREFERENCES_STORAGE_KEY = 'salahos.quran-reading-preferences.v1';
export const QURAN_READING_PREFERENCES_CHANGE_EVENT = 'salahos:quran-reading-preferences-change';

export type QuranArabicFont = 'amiri-quran' | 'system';
export type QuranFontScale = 'compact' | 'comfortable' | 'large' | 'xlarge';
export type QuranTranslationMode = 'pickthall-1930' | 'none';
export type QuranReadingMode = 'list' | 'page';

export interface QuranReadingPreferences {
  readonly version: 1;
  readonly translationMode: QuranTranslationMode;
  readonly arabicFont: QuranArabicFont;
  readonly fontScale: QuranFontScale;
  readonly readingMode: QuranReadingMode;
  readonly bookmarkedAyahIds: readonly string[];
  readonly lastReadAyahId: string | null;
}

export const defaultQuranReadingPreferences: QuranReadingPreferences = Object.freeze({
  version: 1,
  translationMode: 'pickthall-1930',
  arabicFont: 'amiri-quran',
  fontScale: 'comfortable',
  readingMode: 'list',
  bookmarkedAyahIds: Object.freeze([]),
  lastReadAyahId: null,
});

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze([
    ...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)),
  ]);
}

function translationMode(value: unknown): QuranTranslationMode {
  return value === 'pickthall-1930' || value === 'none'
    ? value
    : defaultQuranReadingPreferences.translationMode;
}

function arabicFont(value: unknown): QuranArabicFont {
  if (value === 'amiri-quran' || value === 'system') return value;
  if (value === 'naskh' || value === 'traditional') return 'amiri-quran';
  return defaultQuranReadingPreferences.arabicFont;
}

function fontScale(value: unknown): QuranFontScale {
  return value === 'compact' || value === 'comfortable' || value === 'large' || value === 'xlarge'
    ? value
    : defaultQuranReadingPreferences.fontScale;
}

function readingMode(value: unknown): QuranReadingMode {
  return value === 'page' || value === 'list' ? value : defaultQuranReadingPreferences.readingMode;
}

export function parseQuranReadingPreferences(value: unknown): QuranReadingPreferences {
  if (!value || typeof value !== 'object') return defaultQuranReadingPreferences;

  const candidate = value as Record<string, unknown>;
  return Object.freeze({
    version: 1,
    translationMode: translationMode(candidate.translationMode),
    arabicFont: arabicFont(candidate.arabicFont),
    fontScale: fontScale(candidate.fontScale),
    readingMode: readingMode(candidate.readingMode),
    bookmarkedAyahIds: stringArray(candidate.bookmarkedAyahIds),
    lastReadAyahId:
      typeof candidate.lastReadAyahId === 'string' && candidate.lastReadAyahId.length > 0
        ? candidate.lastReadAyahId
        : null,
  });
}

export function loadQuranReadingPreferences(storage: KeyValueStorage): QuranReadingPreferences {
  const serialized = storage.getItem(QURAN_READING_PREFERENCES_STORAGE_KEY);
  if (serialized === null) return defaultQuranReadingPreferences;
  try {
    return parseQuranReadingPreferences(JSON.parse(serialized));
  } catch {
    return defaultQuranReadingPreferences;
  }
}

function announceQuranReadingPreferencesChange(): void {
  if (typeof globalThis.dispatchEvent !== 'function' || typeof globalThis.Event !== 'function')
    return;
  globalThis.dispatchEvent(new Event(QURAN_READING_PREFERENCES_CHANGE_EVENT));
}

export function saveQuranReadingPreferences(
  storage: KeyValueStorage,
  preferences: QuranReadingPreferences,
): void {
  storage.setItem(
    QURAN_READING_PREFERENCES_STORAGE_KEY,
    JSON.stringify(parseQuranReadingPreferences(preferences)),
  );
  announceQuranReadingPreferencesChange();
}

export function toggleQuranBookmark(
  preferences: QuranReadingPreferences,
  ayahId: string,
): QuranReadingPreferences {
  const bookmarks = new Set(preferences.bookmarkedAyahIds);
  if (bookmarks.has(ayahId)) bookmarks.delete(ayahId);
  else bookmarks.add(ayahId);
  return Object.freeze({ ...preferences, bookmarkedAyahIds: Object.freeze([...bookmarks]) });
}

export function setQuranLastRead(
  preferences: QuranReadingPreferences,
  ayahId: string,
): QuranReadingPreferences {
  return Object.freeze({ ...preferences, lastReadAyahId: ayahId });
}
''')

write('src/ui/QuranOfflineReader.tsx', r'''import { Fragment, useEffect, useMemo, useState } from 'react';

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
  type QuranReadingMode,
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
    title: 'Complete offline Qur’an', complete: '114 surahs · 6,236 ayat · packaged for offline reading', loading: 'Loading the packaged Qur’an…', loadError: 'The packaged Qur’an could not be loaded.', search: 'Search the complete Qur’an', searchPlaceholder: '1:1, Arabic, translation, surah name…', surah: 'Surah', showMore: 'Show more ayat', bookmark: 'Bookmark', removeBookmark: 'Remove bookmark', lastRead: 'Mark last read', resume: 'Resume last read', bookmarks: 'Bookmarks', bookmarksOnly: 'Show bookmarks', allAyat: 'Show surah', share: 'Share ayah', copied: 'Ayah copied or shared.', copyFailed: 'Sharing is not available on this device.', source: 'Source', tafsir: 'Tafsir summary', related: 'Related ayat', noResults: 'No ayat match this search.', resultLimit: 'Showing the first 50 matches.', translation: 'Translation', pickthall: 'M. M. Pickthall (1930)', arabicOnly: 'Arabic only', arabicFont: 'Arabic font', fontAmiri: 'Amiri Quran', fontSystem: 'System Arabic', fontSize: 'Arabic size', sizeCompact: 'Compact', sizeComfortable: 'Comfortable', sizeLarge: 'Large', sizeXLarge: 'Extra large', readingMode: 'Reading mode', listMode: 'List', pageMode: 'Page', previousPage: 'Previous page', nextPage: 'Next page', page: 'Page', ayah: 'Ayah', selectedAyah: 'Selected ayah actions', quran: 'Qur’an', provenance: 'Uthmani Arabic text · M. M. Pickthall (1930) · packaged offline corpus',
  },
  ar: {
    title: 'القرآن الكامل دون اتصال', complete: '114 سورة · 6236 آية · محفوظ للقراءة دون اتصال', loading: 'جارٍ تحميل القرآن المحفوظ…', loadError: 'تعذر تحميل القرآن المحفوظ.', search: 'البحث في القرآن الكامل', searchPlaceholder: '1:1، العربية، الترجمة، اسم السورة…', surah: 'السورة', showMore: 'عرض المزيد من الآيات', bookmark: 'حفظ', removeBookmark: 'إزالة الحفظ', lastRead: 'تعيين آخر قراءة', resume: 'متابعة آخر قراءة', bookmarks: 'المحفوظات', bookmarksOnly: 'عرض المحفوظات', allAyat: 'عرض السورة', share: 'مشاركة الآية', copied: 'تم نسخ الآية أو مشاركتها.', copyFailed: 'المشاركة غير متاحة على هذا الجهاز.', source: 'المصدر', tafsir: 'ملخص التفسير', related: 'آيات ذات صلة', noResults: 'لا توجد آيات مطابقة للبحث.', resultLimit: 'تظهر أول 50 نتيجة.', translation: 'الترجمة', pickthall: 'م. م. بكتال (1930)', arabicOnly: 'العربية فقط', arabicFont: 'الخط العربي', fontAmiri: 'أميري قرآن', fontSystem: 'خط النظام', fontSize: 'حجم العربية', sizeCompact: 'مضغوط', sizeComfortable: 'مريح', sizeLarge: 'كبير', sizeXLarge: 'كبير جداً', readingMode: 'نمط القراءة', listMode: 'قائمة', pageMode: 'صفحة', previousPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', page: 'الصفحة', ayah: 'الآية', selectedAyah: 'إجراءات الآية المحددة', quran: 'القرآن', provenance: 'النص العربي العثماني · ترجمة م. م. بكتال (1930) · مجموعة محفوظة دون اتصال',
  },
  tr: {
    title: 'Tam çevrimdışı Kur’an', complete: '114 sure · 6.236 ayet · çevrimdışı okuma için paketlendi', loading: 'Paketlenmiş Kur’an yükleniyor…', loadError: 'Paketlenmiş Kur’an yüklenemedi.', search: 'Tam Kur’an’da ara', searchPlaceholder: '1:1, Arapça, meal, sure adı…', surah: 'Sure', showMore: 'Daha fazla ayet göster', bookmark: 'Kaydet', removeBookmark: 'Kaydı kaldır', lastRead: 'Son okuma olarak işaretle', resume: 'Son okumaya dön', bookmarks: 'Yer imleri', bookmarksOnly: 'Yer imlerini göster', allAyat: 'Sureyi göster', share: 'Ayeti paylaş', copied: 'Ayet kopyalandı veya paylaşıldı.', copyFailed: 'Bu cihazda paylaşım kullanılamıyor.', source: 'Kaynak', tafsir: 'Tefsir özeti', related: 'İlgili ayetler', noResults: 'Bu aramayla eşleşen ayet yok.', resultLimit: 'İlk 50 eşleşme gösteriliyor.', translation: 'Meal', pickthall: 'M. M. Pickthall (1930)', arabicOnly: 'Yalnızca Arapça', arabicFont: 'Arapça yazı tipi', fontAmiri: 'Amiri Quran', fontSystem: 'Sistem Arapçası', fontSize: 'Arapça boyutu', sizeCompact: 'Kompakt', sizeComfortable: 'Rahat', sizeLarge: 'Büyük', sizeXLarge: 'Çok büyük', readingMode: 'Okuma modu', listMode: 'Liste', pageMode: 'Sayfa', previousPage: 'Önceki sayfa', nextPage: 'Sonraki sayfa', page: 'Sayfa', ayah: 'Ayet', selectedAyah: 'Seçili ayet işlemleri', quran: 'Kur’an', provenance: 'Osmanî Arapça metin · M. M. Pickthall (1930) · çevrimdışı paketlenmiş külliyat',
  },
  id: {
    title: 'Qur’an lengkap luring', complete: '114 surah · 6.236 ayat · dikemas untuk dibaca luring', loading: 'Memuat Qur’an yang dikemas…', loadError: 'Qur’an yang dikemas tidak dapat dimuat.', search: 'Cari Qur’an lengkap', searchPlaceholder: '1:1, Arab, terjemahan, nama surah…', surah: 'Surah', showMore: 'Tampilkan ayat lainnya', bookmark: 'Tandai', removeBookmark: 'Hapus markah', lastRead: 'Tandai terakhir dibaca', resume: 'Lanjutkan bacaan terakhir', bookmarks: 'Markah', bookmarksOnly: 'Tampilkan markah', allAyat: 'Tampilkan surah', share: 'Bagikan ayat', copied: 'Ayat disalin atau dibagikan.', copyFailed: 'Berbagi tidak tersedia di perangkat ini.', source: 'Sumber', tafsir: 'Ringkasan tafsir', related: 'Ayat terkait', noResults: 'Tidak ada ayat yang cocok dengan pencarian ini.', resultLimit: 'Menampilkan 50 hasil pertama.', translation: 'Terjemahan', pickthall: 'M. M. Pickthall (1930)', arabicOnly: 'Arab saja', arabicFont: 'Font Arab', fontAmiri: 'Amiri Quran', fontSystem: 'Arab sistem', fontSize: 'Ukuran Arab', sizeCompact: 'Ringkas', sizeComfortable: 'Nyaman', sizeLarge: 'Besar', sizeXLarge: 'Sangat besar', readingMode: 'Mode baca', listMode: 'Daftar', pageMode: 'Halaman', previousPage: 'Halaman sebelumnya', nextPage: 'Halaman berikutnya', page: 'Halaman', ayah: 'Ayat', selectedAyah: 'Tindakan ayat terpilih', quran: 'Qur’an', provenance: 'Teks Arab Utsmani · M. M. Pickthall (1930) · korpus luring terkemas',
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

function initialVerse(preferences: QuranReadingPreferences, initialVerseKey: string | null): string {
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
      pack
        ? pack.surahs.flatMap((surah) => surah.ayahs.map((ayah) => ({ surah, ayah })))
        : [],
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
  const basmalaArabic = pack ? getQuranOfflineAyah(pack, '1:1')?.ayah.arabic ?? null : null;
  const lastRead = preferences.lastReadAyahId
    ? parseQuranVerseKey(preferences.lastReadAyahId)
    : null;

  const persistPatch = (
    patch: Partial<
      Pick<
        QuranReadingPreferences,
        'translationMode' | 'arabicFont' | 'fontScale' | 'readingMode'
      >
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
    <section className="quran-offline-reader" data-quran-offline-reader data-reading-mode={preferences.readingMode}>
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
              {labels.resume}: <BidiText>{`${String(lastRead.surah)}:${String(lastRead.ayah)}`}</BidiText>
            </button>
          ) : null}
        </div>
      </header>

      {loadError ? (
        <p className="knowledge-empty" role="alert">{labels.loadError}</p>
      ) : !pack ? (
        <p className="knowledge-empty" role="status">{labels.loading}</p>
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
                    lang={locale === 'ar' ? quranOfflineArabicPresentation.lang : quranOfflineTransliterationPresentation.lang}
                    dir={locale === 'ar' ? quranOfflineArabicPresentation.dir : quranOfflineTransliterationPresentation.dir}
                  >
                    {String(surah.surah)}. {locale === 'ar' ? surah.nameArabic : surah.nameTransliteration}
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
                onChange={(event) => persistPatch({ translationMode: event.target.value as QuranTranslationMode })}
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
                onChange={(event) => persistPatch({ arabicFont: event.target.value as QuranArabicFont })}
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
                onChange={(event) => persistPatch({ fontScale: event.target.value as QuranFontScale })}
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
                {([
                  ['list', labels.listMode],
                  ['page', labels.pageMode],
                ] as const).map(([mode, label]) => (
                  <button
                    type="button"
                    key={mode}
                    aria-pressed={preferences.readingMode === mode}
                    data-quran-reading-mode={mode}
                    onClick={() => persistPatch({ readingMode: mode as QuranReadingMode })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {preferences.readingMode === 'page' && normalBrowsing ? (
            <div className="quran-page-navigation" aria-label={labels.readingMode}>
              <button type="button" disabled={currentPage <= 1} onClick={() => selectPage(currentPage - 1)}>
                {labels.previousPage}
              </button>
              <strong>{labels.page} {String(currentPage)} / {String(maxPage)}</strong>
              <button type="button" disabled={currentPage >= maxPage} onClick={() => selectPage(currentPage + 1)}>
                {labels.nextPage}
              </button>
            </div>
          ) : null}

          {activeResult ? (
            <aside className="quran-ayah-utility" aria-label={labels.selectedAyah}>
              <strong><BidiText>{`${labels.quran} ${activeResult.ayah.key}`}</BidiText></strong>
              <div>
                <button
                  type="button"
                  data-quran-offline-bookmark={activeResult.ayah.key}
                  onClick={() => onPreferencesChange(toggleQuranBookmark(preferences, activeResult.ayah.key))}
                >
                  {preferences.bookmarkedAyahIds.includes(activeResult.ayah.key) ? labels.removeBookmark : labels.bookmark}
                </button>
                <button
                  type="button"
                  data-quran-offline-last-read={activeResult.ayah.key}
                  onClick={() => onPreferencesChange(setQuranLastRead(preferences, activeResult.ayah.key))}
                >
                  {labels.lastRead}
                </button>
                <button
                  type="button"
                  data-quran-offline-share={activeResult.ayah.key}
                  onClick={() => {
                    void shareOfflineAyah(activeResult, preferences.translationMode === 'pickthall-1930')
                      .then((shared) => setShareStatus(shared ? labels.copied : labels.copyFailed))
                      .catch(() => setShareStatus(labels.copyFailed));
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
            <p className="knowledge-empty" role="status">{labels.noResults}</p>
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
                  const tafsirSource = curated ? getIslamicKnowledgeSource(curated.tafsirSourceId) : null;
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
                            {result.surah.nameTransliteration} · <BidiText>{result.ayah.key}</BidiText> · Juz {String(result.ayah.juz)}
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
                          <span className="quran-offline-ayah__marker" aria-label={`${labels.ayah} ${String(parsed?.ayah ?? '')}`}>
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
                            <p data-quran-tafsir-summary lang={curated.tafsirSummaryPresentation.lang} dir={curated.tafsirSummaryPresentation.dir}>
                              {curated.tafsirSummary}
                            </p>
                            <small lang={tafsirSource.displayPresentation.lang} dir={tafsirSource.displayPresentation.dir}>
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

          {normalBrowsing && preferences.readingMode === 'list' && selected && visibleAyahCount < selected.ayahs.length ? (
            <button
              type="button"
              className="quran-offline-reader__more"
              data-quran-show-more
              onClick={() => setVisibleAyahCount((current) => Math.min(current + 20, selected.ayahs.length))}
            >
              {labels.showMore}
            </button>
          ) : null}

          {normalBrowsing ? (
            <footer className="quran-reader-info" data-quran-reader-provenance>
              <strong>{labels.source}</strong>
              <p>
                {labels.provenance}
                {preferences.readingMode === 'page' ? ` · ${labels.page} ${String(currentPage)}` : selected ? ` · ${labels.surah} ${String(selected.surah)}` : ''}
              </p>
            </footer>
          ) : null}
        </>
      )}

      {shareStatus ? <p className="knowledge-share-status" role="status">{shareStatus}</p> : null}
    </section>
  );
}
''')

write('src/quran-offline-reader.css', r'''.knowledge-experience__segments {
  position: sticky;
  z-index: 5;
  top: 0;
  display: flex;
  gap: 0.5rem;
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto 1rem;
  padding-block: 0.75rem;
  background: color-mix(in srgb, var(--salah-bg-canvas) 92%, transparent);
  backdrop-filter: blur(10px);
}

.knowledge-experience__segments button,
.quran-reading-mode button,
.quran-page-navigation button,
.quran-ayah-utility button,
.quran-offline-reader__header-actions button,
.quran-offline-ayah__related button,
.quran-offline-reader__more {
  min-height: 2.6rem;
  padding-inline: 0.9rem;
  border-radius: 999px;
}

.knowledge-experience__segments button[aria-pressed='true'],
.quran-reading-mode button[aria-pressed='true'],
.quran-offline-reader__header-actions button[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--salah-fg-accent) 45%, var(--salah-border-default));
  background: var(--salah-bg-accent-soft);
}

.quran-offline-reader {
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto clamp(2rem, 5vw, 4rem);
  padding: clamp(1rem, 2.5vw, 1.5rem);
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-lg);
  background: var(--salah-bg-surface);
  box-shadow: var(--salah-shadow-sm);
}

.quran-offline-reader__header,
.quran-offline-reader__navigation,
.quran-page-navigation,
.quran-ayah-utility,
.quran-surah-band > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quran-offline-reader__header {
  align-items: start;
  padding-block-end: 1rem;
  border-block-end: 1px solid var(--salah-border-subtle);
}

.quran-offline-reader__header h1 {
  margin: 0;
  color: var(--salah-fg-primary);
  font-size: clamp(1.5rem, 3vw, 2.4rem);
}

.quran-offline-reader__header p {
  margin-block-end: 0;
  color: var(--salah-fg-secondary);
}

.quran-offline-reader__header-actions,
.quran-offline-ayah__related > div,
.quran-ayah-utility > div,
.quran-reading-mode {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quran-offline-reader__navigation {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(14rem, 0.8fr);
  margin-block: 1rem;
}

.quran-offline-reader__navigation label,
.quran-offline-reader__reading-controls label,
.quran-offline-reader__reading-controls fieldset {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  margin: 0;
  color: var(--salah-fg-secondary);
  font-size: var(--salah-text-sm);
  font-weight: 750;
}

.quran-offline-reader__reading-controls {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-block: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-md);
  background: color-mix(in srgb, var(--salah-bg-surface) 96%, var(--salah-fg-accent));
}

.quran-offline-reader__reading-controls fieldset {
  padding: 0;
  border: 0;
}

.quran-offline-reader__navigation input,
.quran-offline-reader__navigation select,
.quran-offline-reader__reading-controls select {
  width: 100%;
  min-width: 0;
}

.quran-page-navigation,
.quran-ayah-utility {
  margin-block: 1rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-md);
  background: var(--salah-bg-muted);
}

.quran-ayah-utility strong {
  color: var(--salah-fg-primary);
}

.quran-offline-reader__hint,
.quran-offline-ayah__reference {
  margin: 0 0 1rem;
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-sm);
}

.quran-surah-band {
  margin-block: 1rem 0.8rem;
  padding: 1rem;
  border-block: 1px solid var(--salah-border-subtle);
  background: color-mix(in srgb, var(--salah-bg-accent-soft) 55%, var(--salah-bg-surface));
  text-align: center;
}

.quran-surah-band strong {
  color: var(--salah-fg-primary);
  font-size: 1.35rem;
}

.quran-surah-band p {
  margin: 0.65rem 0 0;
  color: var(--salah-fg-primary);
  font-family: 'amiri-quran', var(--salah-font-arabic, serif);
  font-size: 1.45rem;
  line-height: 1.9;
}

.quran-offline-reader__ayat {
  display: grid;
  gap: 0.9rem;
}

.quran-offline-reader__ayat--page {
  gap: 0;
  padding: clamp(0.5rem, 2vw, 1.25rem);
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-lg);
  background: color-mix(in srgb, var(--salah-bg-surface) 97%, var(--salah-fg-accent));
}

.quran-offline-ayah {
  min-width: 0;
  padding: clamp(1rem, 2.5vw, 1.4rem);
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-lg);
  background: color-mix(in srgb, var(--salah-bg-surface) 96%, var(--salah-fg-accent));
}

.quran-offline-reader__ayat--page .quran-offline-ayah {
  border: 0;
  border-block-end: 1px solid var(--salah-border-subtle);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.quran-offline-reader__ayat--page .quran-offline-ayah:last-child {
  border-block-end: 0;
}

.quran-offline-ayah[data-active='true'] {
  outline: 2px solid color-mix(in srgb, var(--salah-fg-accent) 60%, transparent);
  outline-offset: 2px;
}

.quran-offline-ayah .knowledge-card__arabic {
  margin-block: 1rem;
}

.quran-offline-reader__ayat--page .knowledge-card__arabic {
  text-align: justify;
  text-align-last: end;
}

.quran-offline-ayah__marker {
  display: inline-block;
  margin-inline-start: 0.35em;
  color: var(--salah-fg-accent);
  font-family: 'amiri-quran', var(--salah-font-arabic, serif);
  white-space: nowrap;
}

.quran-offline-ayah__translation {
  color: var(--salah-fg-secondary);
  line-height: 1.7;
}

.quran-offline-ayah__tafsir,
.quran-offline-ayah__related {
  display: grid;
  gap: 0.45rem;
  margin-block-start: 1rem;
  padding: 0.9rem;
  border-radius: var(--salah-radius-md);
  background: color-mix(in srgb, var(--salah-fg-accent) 6%, var(--salah-bg-surface));
}

.quran-offline-ayah__tafsir strong,
.quran-offline-ayah__related strong {
  color: var(--salah-fg-primary);
}

.quran-offline-ayah__tafsir p {
  margin: 0;
  color: var(--salah-fg-secondary);
  line-height: 1.65;
}

.quran-offline-ayah__tafsir small {
  color: var(--salah-fg-tertiary);
}

.quran-offline-reader__more {
  display: block;
  margin: 1rem auto 0;
}

.quran-reader-info {
  margin-block-start: 1rem;
  padding-block-start: 1rem;
  border-block-start: 1px solid var(--salah-border-subtle);
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-sm);
}

.quran-reader-info p {
  margin-block-end: 0;
}

@media (max-width: 900px) {
  .quran-offline-reader__reading-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .knowledge-experience__segments,
  .quran-offline-reader {
    width: min(100% - 1rem, 1180px);
  }

  .knowledge-experience__segments {
    overflow-x: auto;
  }

  .knowledge-experience__segments button {
    flex: 1 0 auto;
  }

  .quran-offline-reader__navigation,
  .quran-offline-reader__reading-controls {
    grid-template-columns: minmax(0, 1fr);
  }

  .quran-offline-reader__header-actions,
  .quran-ayah-utility > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }

  .quran-offline-reader__header-actions button,
  .quran-ayah-utility button {
    width: 100%;
  }
}

@media (prefers-contrast: more) {
  .quran-offline-reader,
  .quran-offline-ayah,
  .quran-offline-reader__ayat--page {
    border-width: 2px;
  }
}

@media (forced-colors: active) {
  .knowledge-experience__segments button[aria-pressed='true'],
  .quran-reading-mode button[aria-pressed='true'],
  .quran-offline-reader__header-actions button[aria-pressed='true'] {
    border-color: Highlight;
  }
}
''')

write('src/ui/applicationRoute.test.ts', r'''import { describe, expect, it } from 'vitest';

import {
  readAdminDestination,
  readCongregationDestination,
  readKnowledgeView,
  readProductSurface,
  readQuranVerseKey,
  readSettingsCategory,
  searchForAdminDestination,
  searchForCongregationDestination,
  searchForKnowledgeView,
  searchForSettingsCategory,
} from './applicationRoute';

describe('applicationRoute', () => {
  it('defaults unknown and absent congregation destinations to Today', () => {
    expect(readProductSurface('')).toBe('congregation');
    expect(readCongregationDestination('')).toBe('today');
    expect(readCongregationDestination('?view=unknown')).toBe('today');
  });

  it('reads every supported congregation destination from a reloadable URL', () => {
    for (const destination of [
      'today', 'calendar', 'mosques', 'qiblah', 'knowledge', 'community', 'settings',
    ] as const) {
      expect(readCongregationDestination(`?view=${destination}`)).toBe(destination);
    }
  });

  it('creates congregation links while preserving unrelated query state', () => {
    const search = searchForCongregationDestination(
      '?surface=admin&adminView=displays&settingsView=prayer&debug=1', 'knowledge',
    );
    const params = new URLSearchParams(search);
    expect(params.get('view')).toBe('knowledge');
    expect(params.get('debug')).toBe('1');
    expect(params.has('surface')).toBe(false);
    expect(params.has('adminView')).toBe(false);
    expect(params.has('settingsView')).toBe(false);
  });

  it('creates deep-linkable Knowledge sections and Qur’an ayah routes', () => {
    const quran = searchForKnowledgeView('?view=knowledge&debug=1', 'quran', '2:255');
    expect(readCongregationDestination(quran)).toBe('knowledge');
    expect(readKnowledgeView(quran)).toBe('quran');
    expect(readQuranVerseKey(quran)).toBe('2:255');
    expect(new URLSearchParams(quran).get('debug')).toBe('1');

    const hadith = searchForKnowledgeView(quran, 'hadith');
    expect(readKnowledgeView(hadith)).toBe('hadith');
    expect(readQuranVerseKey(hadith)).toBeNull();

    expect(readKnowledgeView('?view=knowledge&knowledgeView=unknown')).toBe('library');
    expect(readQuranVerseKey('?view=knowledge&knowledgeView=quran&ayah=not-an-ayah')).toBeNull();
  });

  it('clears Knowledge-specific state when leaving Knowledge', () => {
    const search = searchForCongregationDestination(
      '?view=knowledge&knowledgeView=quran&ayah=2%3A255&debug=1', 'today',
    );
    const params = new URLSearchParams(search);
    expect(params.has('knowledgeView')).toBe(false);
    expect(params.has('ayah')).toBe(false);
    expect(params.get('debug')).toBe('1');
  });

  it('creates, reads and clears reloadable Settings category links', () => {
    for (const category of [
      'location', 'prayer', 'adhan', 'display', 'mosques', 'privacy-data', 'advanced',
    ] as const) {
      const search = searchForSettingsCategory('?view=settings&debug=1', category);
      expect(readCongregationDestination(search)).toBe('settings');
      expect(readSettingsCategory(search)).toBe(category);
      expect(new URLSearchParams(search).get('debug')).toBe('1');
    }

    const fromAdmin = searchForSettingsCategory('?surface=admin&adminView=displays&debug=1', 'display');
    const adminParams = new URLSearchParams(fromAdmin);
    expect(readProductSurface(fromAdmin)).toBe('congregation');
    expect(readCongregationDestination(fromAdmin)).toBe('settings');
    expect(readSettingsCategory(fromAdmin)).toBe('display');
    expect(adminParams.get('view')).toBe('settings');
    expect(adminParams.get('settingsView')).toBe('display');
    expect(adminParams.has('surface')).toBe(false);
    expect(adminParams.has('adminView')).toBe(false);
    expect(adminParams.get('debug')).toBe('1');

    const cleared = searchForSettingsCategory('?view=settings&settingsView=prayer&debug=1', null);
    expect(readProductSurface(cleared)).toBe('congregation');
    expect(readCongregationDestination(cleared)).toBe('settings');
    expect(readSettingsCategory(cleared)).toBeNull();
    expect(new URLSearchParams(cleared).get('debug')).toBe('1');
    expect(readSettingsCategory('?view=settings&settingsView=unknown')).toBeNull();
  });

  it('migrates pre-Stage-8 Settings deep links into the seven canonical groups', () => {
    expect(readSettingsCategory('?view=settings&settingsView=mosque')).toBe('mosques');
    expect(readSettingsCategory('?view=settings&settingsView=notifications')).toBe('adhan');
    expect(readSettingsCategory('?view=settings&settingsView=appearance')).toBe('display');
    expect(readSettingsCategory('?view=settings&settingsView=display-themes')).toBe('display');
    expect(readSettingsCategory('?view=settings&settingsView=data-privacy')).toBe('privacy-data');
  });

  it('creates and reads every Stage 24 administration destination', () => {
    for (const destination of [
      'overview', 'prayer-iqamah', 'jumuah-ramadan', 'community', 'displays', 'integrations', 'members', 'settings',
    ] as const) {
      const search = searchForAdminDestination('?view=settings&settingsView=appearance&debug=1', destination);
      const params = new URLSearchParams(search);
      expect(readProductSurface(search)).toBe('admin');
      expect(readAdminDestination(search)).toBe(destination);
      expect(params.get('debug')).toBe('1');
      expect(params.has('view')).toBe(false);
      expect(params.has('settingsView')).toBe(false);
    }
  });

  it('migrates legacy theme and remote administration deep links to Displays', () => {
    expect(readAdminDestination('?surface=admin&adminView=themes')).toBe('displays');
    expect(readAdminDestination('?surface=admin&adminView=remote')).toBe('displays');
  });

  it('defaults unknown administration destinations to Overview', () => {
    expect(readProductSurface('?surface=admin')).toBe('admin');
    expect(readAdminDestination('?surface=admin&adminView=unknown')).toBe('overview');
  });
});
''')

write('src/platform/quranReadingPreferences.test.ts', r'''import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from './settingsStorage';
import {
  QURAN_READING_PREFERENCES_STORAGE_KEY,
  defaultQuranReadingPreferences,
  loadQuranReadingPreferences,
  parseQuranReadingPreferences,
  saveQuranReadingPreferences,
  setQuranLastRead,
  toggleQuranBookmark,
} from './quranReadingPreferences';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('Quran reading preferences', () => {
  it('loads safe offline defaults from empty or malformed storage', () => {
    const storage = new MemoryStorage();
    expect(loadQuranReadingPreferences(storage)).toEqual(defaultQuranReadingPreferences);
    storage.setItem(QURAN_READING_PREFERENCES_STORAGE_KEY, '{invalid');
    expect(loadQuranReadingPreferences(storage)).toEqual(defaultQuranReadingPreferences);
  });

  it('round-trips translation, typography, reading mode, bookmarks and last-read state', () => {
    const storage = new MemoryStorage();
    const preferences = parseQuranReadingPreferences({
      version: 1,
      translationMode: 'none',
      arabicFont: 'system',
      fontScale: 'large',
      readingMode: 'page',
      bookmarkedAyahIds: ['quran-prayer-remembrance', 'quran-prayer-remembrance'],
      lastReadAyahId: 'quran-patience-prayer',
    });
    saveQuranReadingPreferences(storage, preferences);
    expect(loadQuranReadingPreferences(storage)).toEqual({
      ...preferences,
      bookmarkedAyahIds: ['quran-prayer-remembrance'],
    });
  });

  it('migrates legacy preferences to the bundled font and List reading mode', () => {
    expect(parseQuranReadingPreferences({ arabicFont: 'naskh' }).arabicFont).toBe('amiri-quran');
    expect(parseQuranReadingPreferences({ arabicFont: 'traditional' }).arabicFont).toBe('amiri-quran');
    expect(parseQuranReadingPreferences({ translationMode: 'none' }).readingMode).toBe('list');
  });

  it('toggles bookmarks without mutating the prior state', () => {
    const bookmarked = toggleQuranBookmark(defaultQuranReadingPreferences, 'quran-prayer-remembrance');
    expect(bookmarked.bookmarkedAyahIds).toEqual(['quran-prayer-remembrance']);
    expect(defaultQuranReadingPreferences.bookmarkedAyahIds).toEqual([]);
    expect(toggleQuranBookmark(bookmarked, 'quran-prayer-remembrance').bookmarkedAyahIds).toEqual([]);
  });

  it('tracks the last-read ayah independently from bookmarks', () => {
    const updated = setQuranLastRead(defaultQuranReadingPreferences, 'quran-friday-prayer');
    expect(updated.lastReadAyahId).toBe('quran-friday-prayer');
    expect(updated.bookmarkedAyahIds).toEqual([]);
  });
});
''')

write('src/ui/QuranReaderV153.test.tsx', r'''import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { formatQuranAyahNumber } from './QuranOfflineReader';

const experienceSource = readFileSync(new URL('./KnowledgeExperience.tsx', import.meta.url), 'utf8');
const readerSource = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');

describe('v1.5.3 Qur’an reader architecture', () => {
  it('renders Library, Qur’an and Hadith as mutually exclusive Knowledge views', () => {
    expect(experienceSource).toContain("view === 'library' ? <KnowledgeScreen scope=\"library\" /> : null");
    expect(experienceSource).toContain("view === 'hadith' ? <KnowledgeScreen scope=\"hadith\" /> : null");
    expect(experienceSource).toContain("view === 'quran' ? (");
    expect(experienceSource).toContain('data-knowledge-view-select');
  });

  it('uses Arabic-Indic numbers for end-of-ayah markers', () => {
    expect(formatQuranAyahNumber(255)).toBe('٢٥٥');
    expect(readerSource).toContain('quran-offline-ayah__marker');
  });

  it('keeps ayah actions outside the individual reading article and exposes page mode', () => {
    expect(readerSource).toContain('className="quran-ayah-utility"');
    expect(readerSource).toContain("['page', labels.pageMode]");
    expect(readerSource).toContain('data-quran-reader-provenance');
    expect(readerSource).toContain('data-quran-surah-header');
    expect(readerSource).toContain('data-quran-basmala');
  });
});
''')

# Scope the existing KnowledgeScreen so the segmented surface does not duplicate Qur'an/Hadith.
knowledge = (ROOT / 'src/ui/KnowledgeScreen.tsx').read_text(encoding='utf-8')
knowledge = knowledge.replace(
    'export function KnowledgeScreen() {\n',
    "export function KnowledgeScreen({\n  scope = 'library',\n}: Readonly<{ scope?: 'library' | 'hadith' }>) {\n",
    1,
)
knowledge = knowledge.replace(
    "  const [module, setModule] = useState<KnowledgeFilter>('all');\n",
    "  const [module, setModule] = useState<KnowledgeFilter>(() =>\n    scope === 'hadith' ? 'hadith' : 'all',\n  );\n",
    1,
)
old_entries = """    const scoped =\n      module === 'fiqh'\n        ? filtered.filter((entry) => entry.module === 'qa' && entry.contentType === 'fiqh')\n        : filtered;\n    if (!bookmarksOnly) return scoped;\n    return scoped.filter(\n      (entry) => entry.module === 'quran' && quranPreferences.bookmarkedAyahIds.includes(entry.id),\n    );\n  }, [bookmarksOnly, module, query, quranPreferences.bookmarkedAyahIds]);\n"""
new_entries = """    const scoped =\n      module === 'fiqh'\n        ? filtered.filter((entry) => entry.module === 'qa' && entry.contentType === 'fiqh')\n        : filtered;\n    const surfaceScoped =\n      scope === 'hadith'\n        ? scoped.filter((entry) => entry.module === 'hadith')\n        : scoped.filter((entry) => entry.module !== 'quran' && entry.module !== 'hadith');\n    if (!bookmarksOnly) return surfaceScoped;\n    return surfaceScoped.filter(\n      (entry) => entry.module === 'quran' && quranPreferences.bookmarkedAyahIds.includes(entry.id),\n    );\n  }, [bookmarksOnly, module, query, quranPreferences.bookmarkedAyahIds, scope]);\n"""
if old_entries not in knowledge:
    raise SystemExit('KnowledgeScreen entries block not found')
knowledge = knowledge.replace(old_entries, new_entries, 1)
old_filters = """  const filters: readonly Readonly<{\n    id: KnowledgeFilter;\n    label: string;\n  }>[] = [\n    { id: 'all', label: labels.all },\n    { id: 'quran', label: labels.quran },\n    { id: 'hadith', label: labels.hadith },\n    { id: 'fiqh', label: labels.fiqh },\n    { id: 'qa', label: labels.qa },\n  ];\n"""
new_filters = """  const filters: readonly Readonly<{\n    id: KnowledgeFilter;\n    label: string;\n  }>[] =\n    scope === 'hadith'\n      ? []\n      : [\n          { id: 'all', label: labels.all },\n          { id: 'fiqh', label: labels.fiqh },\n          { id: 'qa', label: labels.qa },\n        ];\n"""
if old_filters not in knowledge:
    raise SystemExit('KnowledgeScreen filters block not found')
knowledge = knowledge.replace(old_filters, new_filters, 1)
knowledge = knowledge.replace(
    '        <div className="knowledge-filter" role="group" aria-label={labels.eyebrow}>\n          {filters.map((filter) => (',
    '        {filters.length > 0 ? (\n          <div className="knowledge-filter" role="group" aria-label={labels.eyebrow}>\n            {filters.map((filter) => (',
    1,
)
knowledge = knowledge.replace(
    "          ))}\n        </div>\n      </section>\n\n      {module === 'quran' ? (",
    "            ))}\n          </div>\n        ) : null}\n      </section>\n\n      {module === 'quran' ? (",
    1,
)
(ROOT / 'src/ui/KnowledgeScreen.tsx').write_text(knowledge, encoding='utf-8')
