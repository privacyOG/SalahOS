import type { KeyValueStorage } from './settingsStorage';

export const QURAN_READING_PREFERENCES_STORAGE_KEY = 'salahos.quran-reading-preferences.v1';

export type QuranArabicFont = 'naskh' | 'traditional' | 'system';
export type QuranFontScale = 'compact' | 'comfortable' | 'large' | 'xlarge';
export type QuranTranslationMode = 'pickthall-1930' | 'none';

export interface QuranReadingPreferences {
  readonly version: 1;
  readonly translationMode: QuranTranslationMode;
  readonly arabicFont: QuranArabicFont;
  readonly fontScale: QuranFontScale;
  readonly bookmarkedAyahIds: readonly string[];
  readonly lastReadAyahId: string | null;
}

export const defaultQuranReadingPreferences: QuranReadingPreferences = Object.freeze({
  version: 1,
  translationMode: 'pickthall-1930',
  arabicFont: 'naskh',
  fontScale: 'comfortable',
  bookmarkedAyahIds: Object.freeze([]),
  lastReadAyahId: null,
});

const arabicFonts = new Set<QuranArabicFont>(['naskh', 'traditional', 'system']);
const fontScales = new Set<QuranFontScale>(['compact', 'comfortable', 'large', 'xlarge']);
const translationModes = new Set<QuranTranslationMode>(['pickthall-1930', 'none']);

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze(
    [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))],
  );
}

export function parseQuranReadingPreferences(value: unknown): QuranReadingPreferences {
  if (!value || typeof value !== 'object') return defaultQuranReadingPreferences;

  const candidate = value as Partial<QuranReadingPreferences>;
  return Object.freeze({
    version: 1,
    translationMode: translationModes.has(candidate.translationMode as QuranTranslationMode)
      ? (candidate.translationMode as QuranTranslationMode)
      : defaultQuranReadingPreferences.translationMode,
    arabicFont: arabicFonts.has(candidate.arabicFont as QuranArabicFont)
      ? (candidate.arabicFont as QuranArabicFont)
      : defaultQuranReadingPreferences.arabicFont,
    fontScale: fontScales.has(candidate.fontScale as QuranFontScale)
      ? (candidate.fontScale as QuranFontScale)
      : defaultQuranReadingPreferences.fontScale,
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

export function saveQuranReadingPreferences(
  storage: KeyValueStorage,
  preferences: QuranReadingPreferences,
): void {
  storage.setItem(
    QURAN_READING_PREFERENCES_STORAGE_KEY,
    JSON.stringify(parseQuranReadingPreferences(preferences)),
  );
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
