import salahos2026 from '../data/quran-salahos-2026-overrides.json';
import { textPresentationMetadata, type TextPresentationMetadata } from './textPresentation';

export const SALAHOS_2026_TRANSLATION_ID = 'salahos-2026' as const;
export const SALAHOS_2026_SOURCE_ID = 'quran-salahos-2026' as const;
export const SALAHOS_2026_DISPLAY_NAME = 'SalahOS 2026 (English meaning)' as const;
export const SALAHOS_2026_BASE_TRANSLATION_ID = 'pickthall-1930' as const;

export const salahos2026Presentation: TextPresentationMetadata = textPresentationMetadata(
  'en',
  'ltr',
);

export type SalahOS2026Treatment =
  | 'muhkam-foundation'
  | 'tafwid-with-tanzih'
  | 'contextual-tawil'
  | 'tafwid-and-contextual-tawil';

export type SalahOS2026Classification = 'muhkam-foundation' | 'mutashabih';

export interface SalahOS2026EditorialEntry {
  readonly verseKey: string;
  readonly classification: SalahOS2026Classification;
  readonly treatment: SalahOS2026Treatment;
  readonly englishMeaning: string;
  readonly editorialNote: string;
  readonly salafReading: string | null;
  readonly khalafReading: string | null;
  readonly guideSpecificMeaning: string | null;
}

const entries = Object.freeze(
  new Map(
    salahos2026.entries.map((entry) => [
      entry.verseKey,
      Object.freeze(entry as SalahOS2026EditorialEntry),
    ]),
  ),
);

export function getSalahOS2026EditorialEntry(
  verseKey: string,
): SalahOS2026EditorialEntry | null {
  return entries.get(verseKey) ?? null;
}

/**
 * SalahOS 2026 is a derived English-meaning layer.
 *
 * The pinned Pickthall 1930 corpus remains the byte-stable baseline where the
 * owner-supplied Ash'ari editorial guide has not yet produced a verse-specific
 * wording. Explicit guide-driven entries replace that baseline for display,
 * search, copy/share and curated Knowledge identity. Whole-corpus scholarly
 * approval remains a separate release gate and is never inferred here.
 */
export function salahos2026EnglishMeaning(verseKey: string, pickthall1930: string): string {
  const override = getSalahOS2026EditorialEntry(verseKey);
  return override?.englishMeaning ?? pickthall1930;
}

export function isSalahOS2026MutashabihVerse(verseKey: string): boolean {
  return getSalahOS2026EditorialEntry(verseKey)?.classification === 'mutashabih';
}

export const salahos2026EditorialVerseKeys = Object.freeze([...entries.keys()].sort());
