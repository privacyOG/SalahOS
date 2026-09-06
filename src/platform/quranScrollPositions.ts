const QURAN_SCROLL_POSITIONS_STORAGE_KEY = 'salahos.quran.scroll-positions.v1';

export interface QuranScrollPositionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type QuranScrollPositionMap = Readonly<Record<string, number>>;

function defaultStorage(): QuranScrollPositionStorage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function parseScrollPositions(raw: string | null): QuranScrollPositionMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const safe: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const surah = Number(key);
      if (
        Number.isInteger(surah) &&
        surah >= 1 &&
        surah <= 114 &&
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0
      ) {
        safe[String(surah)] = value;
      }
    }
    return safe;
  } catch {
    return {};
  }
}

export function quranScrollPositionForSurah(
  surah: number,
  storage: QuranScrollPositionStorage | null = defaultStorage(),
): number {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || storage === null) return 0;
  try {
    return (
      parseScrollPositions(storage.getItem(QURAN_SCROLL_POSITIONS_STORAGE_KEY))[String(surah)] ?? 0
    );
  } catch {
    return 0;
  }
}

export function persistQuranScrollPosition(
  surah: number,
  scrollTop: number,
  storage: QuranScrollPositionStorage | null = defaultStorage(),
): void {
  if (
    !Number.isInteger(surah) ||
    surah < 1 ||
    surah > 114 ||
    !Number.isFinite(scrollTop) ||
    scrollTop < 0 ||
    storage === null
  ) {
    return;
  }
  try {
    const next = {
      ...parseScrollPositions(storage.getItem(QURAN_SCROLL_POSITIONS_STORAGE_KEY)),
      [String(surah)]: scrollTop,
    };
    storage.setItem(QURAN_SCROLL_POSITIONS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Reading remains fully functional when storage is unavailable.
  }
}
