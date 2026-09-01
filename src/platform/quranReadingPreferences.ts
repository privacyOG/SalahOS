import type { KeyValueStorage } from './settingsStorage';

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
