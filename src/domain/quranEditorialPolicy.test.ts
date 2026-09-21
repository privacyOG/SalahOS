import { describe, expect, it } from 'vitest';

import register from '../data/quran-mutashabih-review-register.json';
import triggers from '../data/quran-mutashabih-policy-triggers.json';
import { validateQuranEditorialRegister } from './quranEditorialPolicy';

const expectedFoundations = triggers.foundations;

const expectedSeeds = [...new Set(Object.values(triggers.groups).flat())].sort((a, b) => {
  const [aSurah = '0', aAyah = '0'] = a.split(':');
  const [bSurah = '0', bAyah = '0'] = b.split(':');
  return Number(aSurah) - Number(bSurah) || Number(aAyah) - Number(bAyah);
});

describe('Qur’an editorial register', () => {
  it('contains every required foundation and policy-triggered Mutashabih verse', () => {
    expect(register.requiredFoundations).toEqual(expectedFoundations);
    expect(register.requiredSeedVerses).toEqual(expectedSeeds);

    const keys = new Set(register.entries.map((entry) => entry.verseKey));
    for (const verseKey of [...expectedFoundations, ...expectedSeeds]) {
      expect(keys.has(verseKey), `${verseKey} is absent from the editorial register`).toBe(true);
    }
  });

  it('keeps the comprehensive review pending without discarding completed editorial dispositions', () => {
    const entries = validateQuranEditorialRegister(register.entries);
    expect(entries).toHaveLength(expectedFoundations.length + expectedSeeds.length);
    for (const entry of entries) {
      expect(entry.status).toBe('pending-scholar-review');
      expect(entry.reviewer).toBeNull();
      expect(entry.treatment).not.toBe('unassigned');
      expect(entry.originalEnglish?.trim().length ?? 0).toBeGreaterThan(0);
      expect(entry.proposedMeaning?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('rejects an approval without named review, evidence and selected treatment', () => {
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
