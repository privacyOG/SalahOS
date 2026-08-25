import { describe, expect, it } from 'vitest';
import {
  filterIslamicKnowledge,
  getIslamicKnowledgeEntryById,
  islamicKnowledgeEntries,
} from './islamicKnowledge';

describe('Islamic knowledge catalogue', () => {
  it('contains offline Qur’an, Hadith and Q&A entries with source metadata', () => {
    expect(islamicKnowledgeEntries.filter((entry) => entry.module === 'quran')).toHaveLength(3);
    expect(islamicKnowledgeEntries.filter((entry) => entry.module === 'hadith')).toHaveLength(3);
    expect(islamicKnowledgeEntries.filter((entry) => entry.module === 'qa')).toHaveLength(3);

    for (const entry of islamicKnowledgeEntries) {
      expect(entry.sourceIds.length).toBeGreaterThan(0);
      if (entry.module === 'quran') {
        expect(entry.reference).toMatch(/^Qur’an \d+:\d+$/u);
        expect(entry.source.length).toBeGreaterThan(10);
        expect(entry.translationSourceId).toBe('quran-pickthall-1930');
        expect(entry.tafsirSourceId).toBe('quran-tafsir-jalalayn');
        expect(entry.tafsirSummary.length).toBeGreaterThan(40);
        expect(entry.topics.length).toBeGreaterThan(0);
        expect(entry.relatedAyahIds.length).toBeGreaterThan(0);
      } else if (entry.module === 'hadith') {
        expect(entry.collection.length).toBeGreaterThan(5);
        expect(entry.grade).toBe('Sahih');
        expect(entry.grader.length).toBeGreaterThan(5);
        expect(entry.gradingAuthoritySourceId).toMatch(/^hadith-/u);
      } else {
        expect(entry.scholar.length).toBeGreaterThan(5);
        expect(entry.sourceTitle.length).toBeGreaterThan(10);
        expect(entry.sourceNote.length).toBeGreaterThan(20);
        expect(entry.contentType).toBe('fiqh');
      }
    }
  });

  it('filters by module and searches ayah, source-aware text and topics', () => {
    expect(filterIslamicKnowledge('quran', '')).toHaveLength(3);
    expect(filterIslamicKnowledge('hadith', 'congregation').map((entry) => entry.id)).toEqual([
      'hadith-congregation',
    ]);
    expect(filterIslamicKnowledge('qa', 'madhhab').map((entry) => entry.id)).toEqual([
      'qa-intention',
      'qa-prayer-doubt',
      'qa-travel-prayer',
    ]);
    expect(filterIslamicKnowledge('all', '20:14').map((entry) => entry.id)).toEqual([
      'quran-prayer-remembrance',
    ]);
    expect(filterIslamicKnowledge('quran', 'humility').map((entry) => entry.id)).toEqual([
      'quran-patience-prayer',
    ]);
    expect(filterIslamicKnowledge('quran', 'Jalalayn')).toHaveLength(3);
  });

  it('resolves related ayat by stable offline identifiers', () => {
    const entry = getIslamicKnowledgeEntryById('quran-prayer-remembrance');
    expect(entry?.module).toBe('quran');
    if (entry?.module !== 'quran') throw new Error('Missing Qur’an fixture');

    expect(
      entry.relatedAyahIds.map((id) => getIslamicKnowledgeEntryById(id)?.module),
    ).toEqual(['quran', 'quran']);
    expect(getIslamicKnowledgeEntryById('missing')).toBeNull();
  });
});
