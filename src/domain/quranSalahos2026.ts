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
  'muhkam-foundation' | 'tafwid-with-tanzih' | 'contextual-tawil' | 'tafwid-and-contextual-tawil';

export type SalahOS2026Classification = 'muhkam-foundation' | 'mutashabih';

export interface SalahOS2026BaseRewrite {
  readonly from: string;
  readonly to: string;
}

export interface SalahOS2026EditorialEntry {
  readonly verseKey: string;
  readonly classification: SalahOS2026Classification;
  readonly treatment: SalahOS2026Treatment;
  readonly englishMeaning: string | null;
  readonly baseRewrites?: readonly SalahOS2026BaseRewrite[];
  readonly coverageCategories?: readonly string[];
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

export function getSalahOS2026EditorialEntry(verseKey: string): SalahOS2026EditorialEntry | null {
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
  if (!override) return pickthall1930;
  if (override.englishMeaning?.trim()) return override.englishMeaning;

  const rewrites = override.baseRewrites ?? [];
  if (rewrites.length === 0) {
    throw new Error(`SalahOS 2026 editorial entry ${verseKey} has no English meaning or base rewrite.`);
  }

  let meaning = pickthall1930;
  for (const rewrite of rewrites) {
    if (!meaning.includes(rewrite.from)) {
      throw new Error(
        `SalahOS 2026 rewrite for ${verseKey} no longer matches the pinned Pickthall baseline: ${rewrite.from}`,
      );
    }
    meaning = meaning.replace(rewrite.from, rewrite.to);
  }
  return meaning;
}

export function isSalahOS2026MutashabihVerse(verseKey: string): boolean {
  return getSalahOS2026EditorialEntry(verseKey)?.classification === 'mutashabih';
}

export const salahos2026EditorialVerseKeys = Object.freeze([...entries.keys()].sort());
