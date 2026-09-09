import { describe, expect, it } from 'vitest';

import register from '../data/quran-mutashabih-review-register.json';
import { validateQuranEditorialRegister } from './quranEditorialPolicy';

const expectedFoundations = ['3:7', '42:11', '112:4', '19:65'] as const;
const expectedSeeds = [
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

describe('V1.6.0 Qur’an editorial register', () => {
  it('contains every required foundation and supplied-guide seed', () => {
    expect(register.requiredFoundations).toEqual(expectedFoundations);
    expect(register.requiredSeedVerses).toEqual(expectedSeeds);

    const keys = new Set(register.entries.map((entry) => entry.verseKey));
    for (const verseKey of [...expectedFoundations, ...expectedSeeds]) {
      expect(keys.has(verseKey), `${verseKey} is absent from the editorial register`).toBe(true);
    }
  });

  it('keeps unresolved seed work explicitly pending rather than auto-approving it', () => {
    const entries = validateQuranEditorialRegister(register.entries);
    expect(entries).toHaveLength(expectedFoundations.length + expectedSeeds.length);
    for (const entry of entries) {
      expect(entry.status).toBe('pending-scholar-review');
      expect(entry.reviewer).toBeNull();
      expect(entry.treatment).toBe('unassigned');
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
