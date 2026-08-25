import { describe, expect, it } from 'vitest';

import {
  getIslamicKnowledgeEntryById,
  islamicKnowledgeEntries,
  type HadithKnowledgeEntry,
  type IslamicKnowledgeEntry,
  type QaKnowledgeEntry,
} from './islamicKnowledge';
import { getIslamicKnowledgeSource } from './islamicKnowledgeGovernance';
import { getFiqhStage7Metadata, getHadithStage7Metadata } from './islamicKnowledgeStage7';

const catalogue: readonly IslamicKnowledgeEntry[] = islamicKnowledgeEntries;
const requiredMadhhabs = ['hanafi', 'maliki', 'shafii', 'hanbali'] as const;

describe('Stage 7 Hadith and Fiqh knowledge metadata', () => {
  it('enriches every shipped Hadith with governed Arabic and collection navigation metadata', () => {
    const hadithEntries = catalogue.filter(
      (entry): entry is HadithKnowledgeEntry => entry.module === 'hadith',
    );
    expect(hadithEntries).toHaveLength(3);

    for (const entry of hadithEntries) {
      const metadata = getHadithStage7Metadata(entry.id);
      expect(metadata).not.toBeNull();
      if (!metadata) throw new Error(`Missing Stage 7 Hadith metadata for ${entry.id}`);
      expect(metadata.arabicExcerpt.trim().length).toBeGreaterThan(10);
      expect(metadata.bookNumber).toBeGreaterThan(0);
      expect(metadata.bookTitle.trim().length).toBeGreaterThan(3);
      expect(metadata.chapterNumber).toBeGreaterThan(0);
      expect(metadata.chapterTitle.trim().length).toBeGreaterThan(3);
      expect(entry.reference).toBe(`Hadith ${String(metadata.hadithNumber)}`);
      expect(metadata.topics.length).toBeGreaterThan(0);
      expect(entry.sourceIds).toContain(metadata.sourceId);
      expect(getIslamicKnowledgeSource(metadata.sourceId)?.kind).toBe('hadith-collection');
      for (const relatedId of metadata.relatedHadithIds) {
        expect(relatedId).not.toBe(entry.id);
        expect(getIslamicKnowledgeEntryById(relatedId)?.module).toBe('hadith');
      }
    }
  });

  it('gives every current Fiqh Q&A four source-backed madhhab positions and audit metadata', () => {
    const fiqhEntries = catalogue.filter(
      (entry): entry is QaKnowledgeEntry => entry.module === 'qa' && entry.contentType === 'fiqh',
    );
    expect(fiqhEntries).toHaveLength(3);

    for (const entry of fiqhEntries) {
      const metadata = getFiqhStage7Metadata(entry.id);
      expect(metadata).not.toBeNull();
      if (!metadata) throw new Error(`Missing Stage 7 Fiqh metadata for ${entry.id}`);
      expect(metadata.topic.trim().length).toBeGreaterThan(3);
      expect(metadata.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(metadata.supportingReferences.length).toBeGreaterThan(0);
      expect(metadata.madhhabPositions.map((position) => position.madhhab)).toEqual(
        requiredMadhhabs,
      );
      for (const position of metadata.madhhabPositions) {
        expect(position.summary.trim().length).toBeGreaterThan(60);
        expect(entry.sourceIds).toContain(position.sourceId);
        const source = getIslamicKnowledgeSource(position.sourceId);
        expect(source?.kind).toBe('fiqh');
        expect(source?.madhhabs).toContain(position.madhhab);
      }
    }
  });
});
