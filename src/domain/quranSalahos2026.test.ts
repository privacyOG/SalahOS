import { describe, expect, it } from 'vitest';

import coverage from '../data/quran-mutashabih-attribute-coverage.json';
import overrides from '../data/quran-salahos-2026-overrides.json';
import {
  SALAHOS_2026_BASE_TRANSLATION_ID,
  SALAHOS_2026_DISPLAY_NAME,
  getSalahOS2026EditorialEntry,
  salahos2026EditorialVerseKeys,
  salahos2026EnglishMeaning,
} from './quranSalahos2026';

const requiredMutashabihSeeds = [
  '20:5',
  '35:10',
  '28:88',
  '68:42',
  '2:115',
  '66:12',
  '38:75',
  '24:35',
  '89:22',
  '57:4',
  '41:54',
  '37:99',
  '2:125',
  '6:61',
  '16:128',
] as const;

describe('SalahOS 2026 English meaning', () => {
  it('is transparently derived from the pinned Pickthall baseline', () => {
    expect(SALAHOS_2026_DISPLAY_NAME).toBe('SalahOS 2026 (English meaning)');
    expect(SALAHOS_2026_BASE_TRANSLATION_ID).toBe('pickthall-1930');
    expect(salahos2026EnglishMeaning('20:14', 'baseline wording')).toBe('baseline wording');
  });

  it('covers every owner-guide mutashabih seed with detailed Salaf/Khalaf metadata', () => {
    for (const verseKey of requiredMutashabihSeeds) {
      const entry = getSalahOS2026EditorialEntry(verseKey);
      expect(entry, `Missing SalahOS 2026 override for ${verseKey}`).not.toBeNull();
      expect(entry?.classification).toBe('mutashabih');
      expect(entry?.englishMeaning?.trim().length ?? 0).toBeGreaterThan(15);
      expect(entry?.editorialNote.trim().length).toBeGreaterThan(40);
      expect(entry?.salafReading?.trim().length ?? 0).toBeGreaterThan(30);
      expect(entry?.khalafReading?.trim().length ?? 0).toBeGreaterThan(30);
    }
  });

  it('covers every full-corpus divine-attribute risk verse with an explicit treatment', () => {
    const covered = coverage.categories.flatMap((category) => category.verseKeys);
    const unique = [...new Set(covered)];

    expect(unique.length).toBe(88);
    for (const verseKey of unique) {
      const entry = getSalahOS2026EditorialEntry(verseKey);
      expect(entry, `Missing full-corpus treatment for ${verseKey}`).not.toBeNull();
      expect(entry?.classification).toBe('mutashabih');
      const hasFullMeaning = (entry?.englishMeaning?.trim().length ?? 0) > 0;
      const hasRewrites = (entry?.baseRewrites?.length ?? 0) > 0;
      expect(hasFullMeaning || hasRewrites, `${verseKey} has no display treatment`).toBe(true);
      expect(entry?.editorialNote.trim().length ?? 0).toBeGreaterThan(40);
      expect(entry?.salafReading?.trim().length ?? 0).toBeGreaterThan(30);
      expect(entry?.khalafReading?.trim().length ?? 0).toBeGreaterThan(30);
    }
  });

  it('applies phrase-level ta’wil without rewriting the rest of the pinned baseline', () => {
    expect(salahos2026EnglishMeaning('7:54', 'Before; then mounted He the Throne. After.')).toBe(
      'Before; then He subjugated the Throne. After.',
    );
    expect(
      salahos2026EnglishMeaning(
        '67:16',
        'Have ye taken security from Him Who is in the heaven that He will not cause the earth to swallow you?',
      ),
    ).toContain('from the One of supreme status and dominion');
    expect(() => salahos2026EnglishMeaning('7:54', 'baseline wording changed upstream')).toThrow(
      /no longer matches the pinned Pickthall baseline/u,
    );
  });

  it('preserves the supplied guide’s concrete non-corporeal examples', () => {
    expect(salahos2026EnglishMeaning('28:88', 'baseline')).toContain('His Dominion');
    expect(salahos2026EnglishMeaning('68:42', 'baseline')).toContain('anguish and hardship');
    expect(salahos2026EnglishMeaning('24:35', 'baseline')).toContain('Creator of guidance');
    expect(salahos2026EnglishMeaning('57:4', 'baseline')).toContain(
      'He knows you wherever you are',
    );
    expect(salahos2026EnglishMeaning('16:128', 'baseline')).toContain('Allah supports');
    expect(salahos2026EnglishMeaning('20:5', 'baseline')).toContain('subjugates the Throne');
    expect(salahos2026EnglishMeaning('20:5', 'baseline')).toContain(
      'without sitting, place, direction',
    );
  });

  it('keeps override keys unique and explicitly provisional', () => {
    expect(new Set(salahos2026EditorialVerseKeys).size).toBe(salahos2026EditorialVerseKeys.length);
    expect(overrides.status).toBe('provisional-pending-whole-corpus-scholar-review');
  });
});
