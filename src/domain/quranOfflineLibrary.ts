import manifest from '../data/quran-offline-manifest.json';
import { salahos2026EnglishMeaning } from './quranSalahos2026';
import { textPresentationMetadata, type TextPresentationMetadata } from './textPresentation';

export type QuranOfflineTranslationId = 'pickthall-1930';
export type QuranRevelationPlace = 'meccan' | 'medinan';

function presentationMetadata(
  value: Readonly<{ lang: string; dir: string }>,
): TextPresentationMetadata {
  if (value.dir !== 'ltr' && value.dir !== 'rtl') {
    throw new TypeError(`Unsupported text direction: ${value.dir}`);
  }
  return textPresentationMetadata(value.lang, value.dir);
}

export const quranOfflineArabicPresentation = presentationMetadata(
  manifest.textPresentation.arabic,
);
export const quranOfflineReferencePresentation = presentationMetadata(
  manifest.textPresentation.reference,
);
export const quranOfflineTransliterationPresentation = presentationMetadata(
  manifest.textPresentation.transliteration,
);

export function getQuranOfflineTranslationPresentation(
  translationId: QuranOfflineTranslationId,
): TextPresentationMetadata {
  return presentationMetadata(manifest.textPresentation.translations[translationId]);
}

export interface QuranOfflineAyah {
  readonly ayah: number;
  readonly key: string;
  readonly arabic: string;
  readonly translations: Readonly<Record<QuranOfflineTranslationId, string>>;
  readonly juz: number;
  readonly page: number;
}

export interface QuranOfflineSurah {
  readonly surah: number;
  readonly nameArabic: string;
  readonly nameTransliteration: string;
  readonly nameEnglish: string;
  readonly revelationPlace: QuranRevelationPlace;
  readonly ayahs: readonly QuranOfflineAyah[];
}

export interface QuranOfflineSurahSummary {
  readonly surah: number;
  readonly nameArabic: string;
  readonly nameTransliteration: string;
  readonly ayahCount: number;
  readonly revelationPlace: QuranRevelationPlace;
}

export interface QuranOfflinePack {
  readonly schemaVersion: 1;
  readonly counts: Readonly<{ surahs: 114; ayahs: 6236 }>;
  readonly sources: Readonly<{
    arabic: Readonly<{ id: string; upstream: string; commit: string; license: string }>;
    translations: Readonly<
      Record<
        QuranOfflineTranslationId,
        Readonly<{ sourceId: string; upstream: string; commit: string; translator: string }>
      >
    >;
  }>;
  readonly surahs: readonly QuranOfflineSurah[];
}

export interface QuranOfflineSearchResult {
  readonly surah: QuranOfflineSurah;
  readonly ayah: QuranOfflineAyah;
}

export type QuranPackFetcher = (
  input: string,
) => Promise<Readonly<{ ok: boolean; status: number; json(): Promise<unknown> }>>;

type QuranOfflinePackCandidate = Readonly<{
  schemaVersion?: number;
  counts?: Readonly<{ surahs?: number; ayahs?: number }>;
  sources?: QuranOfflinePack['sources'];
  surahs?: readonly QuranOfflineSurah[];
}>;

function assertPack(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function parseQuranVerseKey(
  value: string,
): Readonly<{ surah: number; ayah: number }> | null {
  const match = /^(\d{1,3}):(\d{1,3})$/u.exec(value.trim());
  if (!match) return null;
  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1) {
    return null;
  }
  return { surah, ayah };
}

export function validateQuranOfflinePack(value: unknown): QuranOfflinePack {
  assertPack(typeof value === 'object' && value !== null, 'Offline Qur’an pack is not an object.');
  const pack = value as QuranOfflinePackCandidate;
  assertPack(pack.schemaVersion === 1, 'Offline Qur’an pack schema version is invalid.');
  assertPack(pack.counts?.surahs === 114, 'Offline Qur’an pack must contain 114 surahs.');
  assertPack(pack.counts.ayahs === 6236, 'Offline Qur’an pack must contain 6,236 ayat.');
  const surahs = pack.surahs;
  assertPack(surahs?.length === 114, 'Offline Qur’an surah data is incomplete.');

  let ayahCount = 0;
  const verseKeys = new Set<string>();
  for (const surah of surahs) {
    assertPack(Number.isInteger(surah.surah), 'Offline Qur’an surah number is invalid.');
    assertPack(
      ['meccan', 'medinan'].includes(surah.revelationPlace),
      `Surah ${String(surah.surah)} revelation place is invalid.`,
    );
    assertPack(surah.ayahs.length > 0, `Surah ${String(surah.surah)} has no ayat.`);
    for (const ayah of surah.ayahs) {
      const key = `${String(surah.surah)}:${String(ayah.ayah)}`;
      assertPack(ayah.key === key, `Offline Qur’an verse key ${ayah.key} is invalid.`);
      assertPack(!verseKeys.has(key), `Offline Qur’an verse key ${key} is duplicated.`);
      assertPack(
        ayah.arabic.trim().length > 0,
        `Offline Qur’an Arabic text is missing for ${key}.`,
      );
      assertPack(
        ayah.translations['pickthall-1930'].trim().length > 0,
        `Offline Qur’an Pickthall translation is missing for ${key}.`,
      );
      verseKeys.add(key);
      ayahCount += 1;
    }
  }
  assertPack(
    ayahCount === 6236,
    `Offline Qur’an contains ${String(ayahCount)} ayat instead of 6,236.`,
  );
  return value as QuranOfflinePack;
}

/**
 * The pinned source may prefix the unnumbered opening Bismillah to ayah 1.
 * The reader renders that Bismillah separately under the surah heading, so
 * remove only that display-layer prefix. Al-Fatihah keeps its Bismillah as
 * ayah 1. Canonical packaged bytes and their integrity hash remain unchanged.
 */
export function quranReaderArabicForAyah(
  verseKey: string,
  arabic: string,
  canonicalBasmala: string,
): string {
  const parsed = parseQuranVerseKey(verseKey);
  if (parsed?.ayah !== 1 || parsed.surah === 1) return arabic;

  const text = arabic.trimStart();
  const basmala = canonicalBasmala.trim();
  if (basmala.length === 0 || !text.startsWith(basmala)) return arabic;

  const withoutBasmala = text.slice(basmala.length).trimStart();
  return withoutBasmala.length > 0 ? withoutBasmala : arabic;
}

function prepareQuranReaderPack(pack: QuranOfflinePack): QuranOfflinePack {
  const fatihah = pack.surahs.find((surah) => surah.surah === 1);
  const canonicalBasmala = fatihah?.ayahs.find((ayah) => ayah.ayah === 1)?.arabic ?? '';
  if (canonicalBasmala.trim().length === 0) return pack;

  const surahs = pack.surahs.map((surah) => {
    if (surah.surah === 1) return surah;

    const ayahs = surah.ayahs.map((ayah) => {
      if (ayah.ayah !== 1) return ayah;
      const arabic = quranReaderArabicForAyah(ayah.key, ayah.arabic, canonicalBasmala);
      return arabic === ayah.arabic ? ayah : Object.freeze({ ...ayah, arabic });
    });

    return Object.freeze({ ...surah, ayahs: Object.freeze(ayahs) });
  });

  return Object.freeze({ ...pack, surahs: Object.freeze(surahs) });
}

let cachedPackPromise: Promise<QuranOfflinePack> | null = null;

export function resetQuranOfflinePackCache(): void {
  cachedPackPromise = null;
}

export async function loadQuranOfflinePack(
  fetcher: QuranPackFetcher = globalThis.fetch.bind(globalThis),
): Promise<QuranOfflinePack> {
  const request =
    cachedPackPromise ??
    (async () => {
      const response = await fetcher(manifest.packPath);
      if (!response.ok) {
        throw new Error(
          `Packaged offline Qur’an could not be loaded (HTTP ${String(response.status)}).`,
        );
      }
      return prepareQuranReaderPack(validateQuranOfflinePack(await response.json()));
    })();

  cachedPackPromise = request;

  try {
    return await request;
  } catch (error) {
    if (cachedPackPromise === request) cachedPackPromise = null;
    throw error;
  }
}

export function getQuranOfflineSurah(
  pack: QuranOfflinePack,
  surahNumber: number,
): QuranOfflineSurah | null {
  return pack.surahs.find((surah) => surah.surah === surahNumber) ?? null;
}

export function getQuranOfflineAyah(
  pack: QuranOfflinePack,
  verseKey: string,
): QuranOfflineSearchResult | null {
  const parsed = parseQuranVerseKey(verseKey);
  if (!parsed) return null;
  const surah = getQuranOfflineSurah(pack, parsed.surah);
  const ayah = surah?.ayahs.find((candidate) => candidate.ayah === parsed.ayah);
  return surah && ayah ? { surah, ayah } : null;
}

export function listQuranOfflineSurahSummaries(
  pack: QuranOfflinePack,
): readonly QuranOfflineSurahSummary[] {
  return Object.freeze(
    pack.surahs.map((surah) => ({
      surah: surah.surah,
      nameArabic: surah.nameArabic,
      nameTransliteration: surah.nameTransliteration,
      ayahCount: surah.ayahs.length,
      revelationPlace: surah.revelationPlace,
    })),
  );
}

export function normalizeQuranSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[\u0640\u06e5\u06e6]/gu, '')
    .replace(/ٱ/gu, 'ا')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/gu, ' ');
}

export function searchQuranOfflineSurahs(
  pack: QuranOfflinePack,
  query: string,
): readonly QuranOfflineSurahSummary[] {
  const summaries = listQuranOfflineSurahSummaries(pack);
  const normalized = normalizeQuranSearchText(query);
  if (normalized.length === 0) return summaries;
  return Object.freeze(
    summaries.filter((surah) =>
      normalizeQuranSearchText(
        [String(surah.surah), surah.nameArabic, surah.nameTransliteration].join(' '),
      ).includes(normalized),
    ),
  );
}

export function firstQuranOfflineAyahInJuz(
  pack: QuranOfflinePack,
  juz: number,
): QuranOfflineSearchResult | null {
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) return null;
  for (const surah of pack.surahs) {
    const ayah = surah.ayahs.find((candidate) => candidate.juz === juz);
    if (ayah) return { surah, ayah };
  }
  return null;
}

export function firstQuranOfflineAyahOnPage(
  pack: QuranOfflinePack,
  page: number,
): QuranOfflineSearchResult | null {
  if (!Number.isInteger(page) || page < 1 || page > 604) return null;
  for (const surah of pack.surahs) {
    const ayah = surah.ayahs.find((candidate) => candidate.page === page);
    if (ayah) return { surah, ayah };
  }
  return null;
}

function searchableAyahText(surah: QuranOfflineSurah, ayah: QuranOfflineAyah): string {
  const pickthall = ayah.translations['pickthall-1930'];
  return normalizeQuranSearchText(
    [
      ayah.key,
      ayah.arabic,
      salahos2026EnglishMeaning(ayah.key, pickthall),
      pickthall,
      surah.nameArabic,
      surah.nameTransliteration,
      surah.nameEnglish,
      `juz ${String(ayah.juz)}`,
      `page ${String(ayah.page)}`,
    ].join(' '),
  );
}

export function searchQuranOfflinePack(
  pack: QuranOfflinePack,
  query: string,
  limit = 50,
): readonly QuranOfflineSearchResult[] {
  const normalized = normalizeQuranSearchText(query);
  if (normalized.length === 0 || limit <= 0) return [];

  const exact = getQuranOfflineAyah(pack, normalized);
  if (exact) return [exact];

  const results: QuranOfflineSearchResult[] = [];
  for (const surah of pack.surahs) {
    for (const ayah of surah.ayahs) {
      if (!searchableAyahText(surah, ayah).includes(normalized)) continue;
      results.push({ surah, ayah });
      if (results.length >= limit) return Object.freeze(results);
    }
  }
  return Object.freeze(results);
}
