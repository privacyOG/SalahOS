import { describe, expect, it } from 'vitest';
import { filterIslamicKnowledge, islamicKnowledgeEntries } from './islamicKnowledge';

describe('Islamic knowledge catalogue', () => {
  it('contains offline Qur’an, Hadith and Q&A entries with source metadata', () => {
    expect(islamicKnowledgeEntries.filter((entry) => entry.module === 'quran')).toHaveLength(3);
    expect(islamicKnowledgeEntries.filter((entry) => entry.module === 'hadith')).toHaveLength(3);
    expect(islamicKnowledgeEntries.filter((entry) => entry.module === 'qa')).toHaveLength(3);

    for (const entry of islamicKnowledgeEntries) {
      if (entry.module === 'quran') {
        expect(entry.reference).toMatch(/^Qur’an \d+:\d+$/u);
        expect(entry.source.length).toBeGreaterThan(10);
      } else if (entry.module === 'hadith') {
        expect(entry.collection.length).toBeGreaterThan(5);
        expect(entry.grade).toBe('Sahih');
        expect(entry.grader.length).toBeGreaterThan(5);
      } else {
        expect(entry.scholar.length).toBeGreaterThan(5);
        expect(entry.sourceTitle.length).toBeGreaterThan(10);
        expect(entry.sourceNote.length).toBeGreaterThan(20);
      }
    }
  });

  it('filters by module and searches source-aware text', () => {
    expect(filterIslamicKnowledge('quran', '')).toHaveLength(3);
    expect(filterIslamicKnowledge('hadith', 'congregation').map((entry) => entry.id)).toEqual([
      'hadith-congregation',
    ]);
    expect(filterIslamicKnowledge('qa', 'madhhab').map((entry) => entry.id)).toEqual([
      'qa-prayer-doubt',
      'qa-travel-prayer',
    ]);
    expect(filterIslamicKnowledge('all', '20:14').map((entry) => entry.id)).toEqual([
      'quran-prayer-remembrance',
    ]);
  });
});
