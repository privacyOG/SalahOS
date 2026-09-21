import { describe, expect, it } from 'vitest';

import triggers from '../data/quran-mutashabih-policy-triggers.json';
import register from '../data/quran-mutashabih-review-register.json';
import { validateQuranEditorialRegister } from './quranEditorialPolicy';

const expectedFoundations = ['3:7', '42:11', '112:4', '19:65'] as const;
const expectedTriggered = [...new Set(Object.values(triggers.groups).flat())].sort((a, b) => {
  const [aSurah = 0, aAyah = 0] = a.split(':').map(Number);
  const [bSurah = 0, bAyah = 0] = b.split(':').map(Number);
  return aSurah - bSurah || aAyah - bAyah;
});

describe('Qur’an Muhkam/Mutashabih editorial register', () => {
  it('contains all four foundations and all 122 maintained translation-risk verses', () => {
    expect(register.requiredFoundations).toEqual(expectedFoundations);
    expect(register.requiredSeedVerses).toEqual(expectedTriggered);
    expect(expectedTriggered).toHaveLength(122);
    expect(register.entries).toHaveLength(126);

    const keys = new Set(register.entries.map((entry) => entry.verseKey));
    for (const verseKey of [...expectedFoundations, ...expectedTriggered]) {
      expect(keys.has(verseKey), `${verseKey} is absent from the editorial register`).toBe(true);
    }
  });

  it('keeps every generated review row pending without fabricating a scholar', () => {
    const entries = validateQuranEditorialRegister(register.entries);
    expect(entries).toHaveLength(126);
    for (const entry of entries) {
      expect(entry.status).toBe('pending-scholar-review');
      expect(entry.reviewer).toBeNull();
      expect(entry.treatment).not.toBe('unassigned');
      expect(entry.sourceReferences.length).toBeGreaterThan(0);
      expect(entry.arabicExpression?.trim().length ?? 0).toBeGreaterThan(0);
      expect(entry.originalEnglish?.trim().length ?? 0).toBeGreaterThan(0);
      expect(entry.proposedMeaning?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('rejects an approval without named review evidence', () => {
    expect(() =>
      validateQuranEditorialRegister([
        {
          ...register.entries[0],
          status: 'approved',
        },
      ]),
    ).toThrow('named reviewer');
  });
});
