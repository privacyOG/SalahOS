import { describe, expect, it } from 'vitest';
import { islamicKnowledgeEntries, type IslamicKnowledgeEntry } from './islamicKnowledge';
import {
  approvedIslamicKnowledgeSources,
  getEntryApprovedSources,
  validateIslamicKnowledgeGovernance,
} from './islamicKnowledgeGovernance';

const catalogue: readonly IslamicKnowledgeEntry[] = islamicKnowledgeEntries;

describe('Islamic knowledge source governance', () => {
  it('keeps the complete shipped catalogue on approved, attributed sources', () => {
    expect(validateIslamicKnowledgeGovernance(catalogue)).toEqual([]);
    expect(approvedIslamicKnowledgeSources.length).toBeGreaterThanOrEqual(10);

    for (const entry of catalogue) {
      expect(getEntryApprovedSources(entry)).toHaveLength(entry.sourceIds.length);
    }
  });

  it('requires named translation provenance for every Qur’an entry', () => {
    const quranEntries = catalogue.filter((entry) => entry.module === 'quran');
    for (const entry of quranEntries) {
      const sources = getEntryApprovedSources(entry);
      const translation = sources.find((source) => source.id === entry.translationSourceId);
      expect(entry.reference).toMatch(/^Qur’an \d{1,3}:\d{1,3}$/u);
      expect(translation?.kind).toBe('quran-translation');
      expect(translation?.translator).toBeTruthy();
      expect(translation?.edition).toContain('1930');
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
      (entry) => entry.module === 'qa' && entry.contentType === 'fiqh',
    );
    expect(fiqhEntries).toHaveLength(3);

    for (const entry of fiqhEntries) {
      expect(entry.madhhabs).toEqual(['hanafi', 'maliki', 'shafii', 'hanbali']);
      expect(entry.recognisedDisagreement).toBe(true);
      expect(entry.disagreementNote?.length ?? 0).toBeGreaterThan(20);
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
