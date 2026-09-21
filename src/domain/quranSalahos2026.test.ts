import { describe, expect, it } from 'vitest';

import fullAudit from '../data/quran-mutashabih-full-audit.json';
import triggers from '../data/quran-mutashabih-policy-triggers.json';
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

const policyTriggeredVerseKeys = [...new Set(Object.values(triggers.groups).flat())].sort(
  (a, b) => {
    const [aSurah = 0, aAyah = 0] = a.split(':').map(Number);
    const [bSurah = 0, bAyah = 0] = b.split(':').map(Number);
    return aSurah - bSurah || aAyah - bAyah;
  },
);

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
      expect(entry?.englishMeaning.trim().length).toBeGreaterThan(15);
      expect(entry?.editorialNote.trim().length).toBeGreaterThan(40);
      expect(entry?.salafReading?.trim().length ?? 0).toBeGreaterThan(30);
      expect(entry?.khalafReading?.trim().length ?? 0).toBeGreaterThan(30);
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
    expect(salahos2026EnglishMeaning('20:5', 'baseline')).toContain('absolute dominion');
    expect(salahos2026EnglishMeaning('20:5', 'baseline')).toContain('subjugates the Throne');
    expect(salahos2026EnglishMeaning('20:5', 'baseline')).toContain('without beginning');
    expect(salahos2026EnglishMeaning('20:39', 'baseline')).toContain('under My care');
    expect(salahos2026EnglishMeaning('36:71', 'baseline')).toContain('by Our power');
  });

  it('covers all maintained translation-risk triggers with explicit verse-specific wording', () => {
    expect(policyTriggeredVerseKeys).toHaveLength(126);
    expect(fullAudit.scope.screenedVerseCount).toBe(126);
    expect(fullAudit.scope.overrideVerseCount).toBe(126);
    expect(fullAudit.scope.baselineSafeVerseCount).toBe(0);
    expect(fullAudit.screenedVerseKeys).toEqual(policyTriggeredVerseKeys);
    expect(fullAudit.overrideVerseKeys).toEqual(policyTriggeredVerseKeys);

    for (const verseKey of policyTriggeredVerseKeys) {
      const entry = getSalahOS2026EditorialEntry(verseKey);
      expect(entry, `Missing audit override for ${verseKey}`).not.toBeNull();
      expect(entry?.classification).toBe('mutashabih');
      expect(entry?.englishMeaning.trim().length ?? 0).toBeGreaterThan(15);
      expect(entry?.editorialNote.trim().length ?? 0).toBeGreaterThan(20);
      expect(entry?.salafReading?.trim().length ?? 0).toBeGreaterThan(30);
      expect(entry?.khalafReading?.trim().length ?? 0).toBeGreaterThan(30);
    }

    for (const verseKey of ['7:54', '10:3', '13:2', '20:5', '25:59', '32:4', '57:4']) {
      expect(salahos2026EnglishMeaning(verseKey, 'baseline')).toContain('absolute dominion');
      expect(salahos2026EnglishMeaning(verseKey, 'baseline')).toContain('subjugates the Throne');
      expect(salahos2026EnglishMeaning(verseKey, 'baseline')).not.toMatch(
        /mounted.*Throne|established (?:Himself )?(?:on|upon) the Throne|has an istiwa over/iu,
      );
    }
    expect(salahos2026EnglishMeaning('5:64', 'baseline')).not.toContain('both His hands');
    expect(salahos2026EnglishMeaning('55:27', 'baseline')).not.toContain('Countenance');
    expect(salahos2026EnglishMeaning('67:16', 'baseline')).not.toContain('in the heaven');
    expect(salahos2026EnglishMeaning('7:51', 'baseline')).not.toContain('forgotten');
    expect(salahos2026EnglishMeaning('2:255', 'baseline')).toContain('His Kursi');
    expect(salahos2026EnglishMeaning('4:158', 'baseline')).not.toContain('unto Himself');
    expect(salahos2026EnglishMeaning('35:41', 'baseline')).not.toContain('graspeth');
    expect(salahos2026EnglishMeaning('85:20', 'baseline')).toContain(
      "Allah's knowledge and power encompass",
    );
    expect(salahos2026EnglishMeaning('6:103', 'baseline')).toContain(
      'Vision does not encompass Him',
    );
    expect(salahos2026EnglishMeaning('6:103', 'baseline')).not.toMatch(/cannot see|not see/iu);
    expect(salahos2026EnglishMeaning('75:23', 'baseline')).toContain(
      'Beholding their Lord, without direction or modality',
    );
    expect(salahos2026EnglishMeaning('26:62', 'baseline')).toContain('My Lord supports me');
    expect(salahos2026EnglishMeaning('72:28', 'baseline')).toContain(
      'His knowledge encompasses',
    );
  });

  it('keeps override keys unique and explicitly provisional', () => {
    expect(new Set(salahos2026EditorialVerseKeys).size).toBe(salahos2026EditorialVerseKeys.length);
    expect(overrides.status).toBe('provisional-pending-whole-corpus-scholar-review');
  });
});
