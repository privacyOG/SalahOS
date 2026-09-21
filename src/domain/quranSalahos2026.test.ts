import { describe, expect, it } from 'vitest';

import overrides from '../data/quran-salahos-2026-overrides.json';
import triggers from '../data/quran-mutashabih-policy-triggers.json';
import {
  SALAHOS_2026_BASE_TRANSLATION_ID,
  SALAHOS_2026_DISPLAY_NAME,
  getSalahOS2026EditorialEntry,
  salahos2026EditorialVerseKeys,
  salahos2026EnglishMeaning,
} from './quranSalahos2026';

const requiredMutashabihSeeds = [
  ...new Set(Object.values(triggers.groups).flat()),
].sort((a, b) => {
  const [aSurah, aAyah] = a.split(':').map(Number);
  const [bSurah, bAyah] = b.split(':').map(Number);
  return aSurah - bSurah || aAyah - bAyah;
});

describe('SalahOS 2026 English meaning', () => {
  it('is transparently derived from the pinned Pickthall baseline', () => {
    expect(SALAHOS_2026_DISPLAY_NAME).toBe('SalahOS 2026 (English meaning)');
    expect(SALAHOS_2026_BASE_TRANSLATION_ID).toBe('pickthall-1930');
    expect(salahos2026EnglishMeaning('20:14', 'baseline wording')).toBe('baseline wording');
  });

  it('covers every policy-triggered mutashabih verse with detailed Salaf/Khalaf metadata', () => {
    for (const verseKey of requiredMutashabihSeeds) {
      const entry = getSalahOS2026EditorialEntry(verseKey);
      expect(entry, `Missing SalahOS 2026 override for ${verseKey}`).not.toBeNull();
      expect(entry?.classification).toBe('mutashabih');
      expect(entry?.englishMeaning.trim().length).toBeGreaterThan(15);
      expect(entry?.editorialNote.trim().length).toBeGreaterThan(40);
      expect(entry?.salafReading?.trim().length ?? 0).toBeGreaterThan(30);
      expect(entry?.khalafReading?.trim().length ?? 0).toBeGreaterThan(30);
    }
  });

  it('keeps the comprehensive trigger inventory covered and blocks literal-risk regressions', () => {
    expect(requiredMutashabihSeeds.length).toBeGreaterThanOrEqual(80);
    for (const verseKey of triggers.foundations) {
      expect(getSalahOS2026EditorialEntry(verseKey)?.classification).toBe('muhkam-foundation');
    }

    const risky: Readonly<Record<string, readonly string[]>> = {
      '7:54': ['mounted He the Throne', 'established Himself upon the Throne'],
      '10:3': ['mounted He the Throne', 'established Himself upon the Throne'],
      '20:5': ['established on the Throne', 'sits on the Throne'],
      '57:4': ['mounted the Throne', 'He is with you wheresoever'],
      '5:64': ['both His hands are spread out'],
      '38:75': ['both My hands'],
      '48:10': ['The Hand of Allah'],
      '39:67': ['His handful', 'His right hand'],
      '24:35': ['Allah is the Light of the heavens and the earth'],
      '67:16': ['Him Who is in the heaven'],
      '67:17': ['Him Who is in the heaven'],
      '89:22': ['thy Lord shall come'],
    };

    for (const [verseKey, phrases] of Object.entries(risky)) {
      const meaning = salahos2026EnglishMeaning(verseKey, 'baseline');
      for (const phrase of phrases) {
        expect(meaning.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
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
  });

  it('keeps override keys unique and explicitly provisional', () => {
    expect(new Set(salahos2026EditorialVerseKeys).size).toBe(salahos2026EditorialVerseKeys.length);
    expect(overrides.status).toBe('provisional-pending-whole-corpus-scholar-review');
  });
});
