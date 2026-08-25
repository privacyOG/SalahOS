import { describe, expect, it } from 'vitest';
import {
  islamicKnowledgeEntries,
  type IslamicKnowledgeEntry,
  type QaKnowledgeEntry,
  type QuranKnowledgeEntry,
} from './islamicKnowledge';
import {
  approvedIslamicKnowledgeSources,
  getEntryApprovedSources,
  validateIslamicKnowledgeGovernance,
} from './islamicKnowledgeGovernance';

const catalogue: readonly IslamicKnowledgeEntry[] = islamicKnowledgeEntries;

describe('Islamic knowledge source governance', () => {
  it('keeps the complete shipped catalogue on approved, attributed sources', () => {
    expect(validateIslamicKnowledgeGovernance(catalogue)).toEqual([]);
    expect(approvedIslamicKnowledgeSources.length).toBeGreaterThanOrEqual(11);

    for (const entry of catalogue) {
      expect(getEntryApprovedSources(entry)).toHaveLength(entry.sourceIds.length);
    }
  });

  it('requires named translation and approved tafsir provenance for every Qur’an entry', () => {
    const quranEntries = catalogue.filter(
      (entry): entry is QuranKnowledgeEntry => entry.module === 'quran',
    );
    for (const entry of quranEntries) {
      const sources = getEntryApprovedSources(entry);
      const translation = sources.find((source) => source.id === entry.translationSourceId);
      const tafsir = sources.find((source) => source.id === entry.tafsirSourceId);
      expect(entry.reference).toMatch(/^Qur’an \d{1,3}:\d{1,3}$/u);
      expect(translation?.kind).toBe('quran-translation');
      expect(translation?.translator).toBeTruthy();
      expect(translation?.edition).toContain('1930');
      expect(tafsir?.kind).toBe('quran-tafsir');
      expect(entry.tafsirSummary).toContain('summary');
      expect(entry.topics.length).toBeGreaterThan(0);
      expect(entry.relatedAyahIds.length).toBeGreaterThan(0);
    }
  });

  it('keeps every related ayah inside the governed Qur’an catalogue', () => {
    const quranEntries = catalogue.filter(
      (entry): entry is QuranKnowledgeEntry => entry.module === 'quran',
    );
    const quranIds = new Set(quranEntries.map((entry) => entry.id));
    for (const entry of quranEntries) {
      expect(entry.relatedAyahIds.every((relatedId) => quranIds.has(relatedId))).toBe(true);
      expect(entry.relatedAyahIds).not.toContain(entry.id);
    }
  });

  it('keeps hadith collection, number, grade and grading authority attributable', () => {
    const hadithEntries = catalogue.filter((entry) => entry.module === 'hadith');
    for (const entry of hadithEntries) {
      expect(entry.collection).toMatch(/^Sahih /u);
      expect(entry.reference).toMatch(/^Hadith \d+/u);
      expect(entry.grade).toBe('Sahih');
      expect(entry.grader.length).toBeGreaterThan(5);
      expect(
        getEntryApprovedSources(entry).some(
          (source) =>
            source.id === entry.gradingAuthoritySourceId && source.kind === 'hadith-collection',
        ),
      ).toBe(true);
    }
  });

  it('requires all four Sunni madhhab source lanes for current fiqh guidance', () => {
    const fiqhEntries = catalogue.filter(
      (entry): entry is QaKnowledgeEntry => entry.module === 'qa' && entry.contentType === 'fiqh',
    );
    expect(fiqhEntries).toHaveLength(3);

    for (const entry of fiqhEntries) {
      expect(entry.madhhabs).toEqual(['hanafi', 'maliki', 'shafii', 'hanbali']);
      expect(entry.recognisedDisagreement).toBe(true);
      expect(entry.disagreementNote).not.toBeNull();
      const covered = new Set(getEntryApprovedSources(entry).flatMap((source) => source.madhhabs));
      expect(covered).toEqual(new Set(['hanafi', 'maliki', 'shafii', 'hanbali']));
    }
  });

  it('rejects an unattributed fiqh ruling and incomplete madhhab coverage', () => {
    const baseline = catalogue.find((entry) => entry.id === 'qa-travel-prayer');
    expect(baseline?.module).toBe('qa');
    if (baseline?.module !== 'qa') throw new Error('Missing fiqh fixture');

    const invalid = {
      ...baseline,
      id: 'invalid-fiqh-fixture',
      scholar: '',
      sourceIds: ['fiqh-shafii-majmu'],
      madhhabs: ['shafii'],
    } as unknown as IslamicKnowledgeEntry;
    const issues = validateIslamicKnowledgeGovernance([invalid]);
    expect(issues.some((issue) => issue.code === 'religious-ruling-unattributed')).toBe(true);
    expect(issues.some((issue) => issue.code === 'fiqh-four-madhhab-coverage-missing')).toBe(true);
  });

  it('rejects a Qur’an entry that loses tafsir attribution', () => {
    const baseline = catalogue.find((entry) => entry.id === 'quran-prayer-remembrance');
    expect(baseline?.module).toBe('quran');
    if (baseline?.module !== 'quran') throw new Error('Missing Qur’an fixture');

    const invalid: QuranKnowledgeEntry = {
      ...baseline,
      tafsirSourceId: 'missing-tafsir',
      tafsirSummary: '',
    };
    const issues = validateIslamicKnowledgeGovernance([invalid]);
    expect(issues.some((issue) => issue.code === 'quran-tafsir-source-invalid')).toBe(true);
  });

  it('defines creed approval only through Ash’ari and Maturidi registry lanes', () => {
    const creedSources = approvedIslamicKnowledgeSources.filter(
      (source) => source.kind === 'creed',
    );
    expect(creedSources.map((source) => source.creedTraditions).flat()).toEqual([
      'ashari',
      'maturidi',
    ]);
    expect(creedSources.every((source) => source.reviewStatus === 'approved')).toBe(true);
  });
});
