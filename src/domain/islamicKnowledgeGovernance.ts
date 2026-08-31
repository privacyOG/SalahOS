import sourceRegistryJson from '../data/islamic-knowledge-source-registry.json';
import type { IslamicKnowledgeEntry, Madhhab } from './islamicKnowledge';
import type { TextPresentationMetadata } from './textPresentation';

export type ScholarlySourceKind =
  'quran-text' | 'quran-translation' | 'quran-tafsir' | 'hadith-collection' | 'fiqh' | 'creed';
export type ScholarlySourceReviewStatus = 'approved' | 'pending' | 'rejected';
export type CreedTradition = 'ashari' | 'maturidi';

export interface ScholarlySourceRecord {
  readonly id: string;
  readonly kind: ScholarlySourceKind;
  readonly title: string;
  readonly authors: readonly string[];
  readonly edition: string;
  readonly translator: string | null;
  readonly citation: string;
  readonly provenance: string;
  readonly displayPresentation: TextPresentationMetadata;
  readonly reviewStatus: ScholarlySourceReviewStatus;
  readonly trustTier: string;
  readonly reviewedAt: string;
  readonly madhhabs: readonly Madhhab[];
  readonly creedTraditions: readonly CreedTradition[];
  readonly approvedModules: readonly ('quran' | 'hadith' | 'qa')[];
}

export interface IslamicKnowledgeGovernanceIssue {
  readonly entryId: string;
  readonly code: string;
  readonly message: string;
}

const requiredMadhhabs = Object.freeze(['hanafi', 'maliki', 'shafii', 'hanbali'] as const);
const approvedCreedTraditions = new Set<CreedTradition>(['ashari', 'maturidi']);

export const approvedIslamicKnowledgeSources = Object.freeze(
  sourceRegistryJson.sources as readonly ScholarlySourceRecord[],
);

export const islamicKnowledgeSourceRegistryMetadata = Object.freeze({
  schemaVersion: sourceRegistryJson.schemaVersion,
  reviewedAt: sourceRegistryJson.reviewedAt,
  reviewPolicy: sourceRegistryJson.reviewPolicy,
});

const sourceById = new Map(approvedIslamicKnowledgeSources.map((source) => [source.id, source]));

export function getIslamicKnowledgeSource(sourceId: string): ScholarlySourceRecord | null {
  return sourceById.get(sourceId) ?? null;
}

export function getEntryApprovedSources(
  entry: IslamicKnowledgeEntry,
): readonly ScholarlySourceRecord[] {
  return entry.sourceIds
    .map((sourceId) => getIslamicKnowledgeSource(sourceId))
    .filter((source): source is ScholarlySourceRecord => source?.reviewStatus === 'approved');
}

function pushIssue(
  issues: IslamicKnowledgeGovernanceIssue[],
  entryId: string,
  code: string,
  message: string,
): void {
  issues.push({ entryId, code, message });
}

function validateSourceRegistry(issues: IslamicKnowledgeGovernanceIssue[]): void {
  const ids = new Set<string>();
  for (const source of approvedIslamicKnowledgeSources) {
    if (ids.has(source.id)) {
      pushIssue(issues, source.id, 'duplicate-source-id', `Duplicate source ID: ${source.id}`);
    }
    ids.add(source.id);

    if (source.reviewStatus !== 'approved') {
      pushIssue(
        issues,
        source.id,
        'source-not-approved',
        `Source ${source.id} is present in the approved registry without approved review status.`,
      );
    }
    if (source.title.trim().length === 0 || source.authors.length === 0) {
      pushIssue(
        issues,
        source.id,
        'source-provenance-missing',
        `Source ${source.id} must retain title and author/provenance metadata.`,
      );
    }
    if (source.displayPresentation.lang.trim().length === 0) {
      pushIssue(
        issues,
        source.id,
        'source-display-presentation-invalid',
        `Source ${source.id} must define valid display language and direction metadata.`,
      );
    }
    if (source.edition.trim().length === 0 || source.citation.trim().length === 0) {
      pushIssue(
        issues,
        source.id,
        'source-edition-citation-missing',
        `Source ${source.id} must define edition and citation metadata.`,
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(source.reviewedAt)) {
      pushIssue(
        issues,
        source.id,
        'source-review-date-invalid',
        `Source ${source.id} must have an ISO review date.`,
      );
    }
    if (source.kind === 'quran-translation' && !source.translator) {
      pushIssue(
        issues,
        source.id,
        'quran-translator-missing',
        `Qur'an translation source ${source.id} must name its translator.`,
      );
    }
    if (source.kind === 'creed') {
      if (
        source.creedTraditions.length === 0 ||
        source.creedTraditions.some((tradition) => !approvedCreedTraditions.has(tradition))
      ) {
        pushIssue(
          issues,
          source.id,
          'creed-source-outside-policy',
          `Creed source ${source.id} must be explicitly Ash'ari and/or Maturidi.`,
        );
      }
    }
  }
}

function validateEntrySources(
  entry: IslamicKnowledgeEntry,
  issues: IslamicKnowledgeGovernanceIssue[],
): readonly ScholarlySourceRecord[] {
  if (entry.sourceIds.length === 0) {
    pushIssue(
      issues,
      entry.id,
      'unattributed-content',
      `Knowledge entry ${entry.id} has no approved source attribution.`,
    );
    return [];
  }

  const sources: ScholarlySourceRecord[] = [];
  for (const sourceId of entry.sourceIds) {
    const source = getIslamicKnowledgeSource(sourceId);
    if (!source) {
      pushIssue(
        issues,
        entry.id,
        'unknown-source',
        `Knowledge entry ${entry.id} references unregistered source ${sourceId}.`,
      );
      continue;
    }
    if (source.reviewStatus !== 'approved') {
      pushIssue(
        issues,
        entry.id,
        'unapproved-source',
        `Knowledge entry ${entry.id} references source ${sourceId} before approval.`,
      );
    }
    if (!source.approvedModules.includes(entry.module)) {
      pushIssue(
        issues,
        entry.id,
        'source-scope-mismatch',
        `Source ${sourceId} is not approved for the ${entry.module} module.`,
      );
    }
    sources.push(source);
  }
  return sources;
}

export function validateIslamicKnowledgeGovernance(
  entries: readonly IslamicKnowledgeEntry[],
): readonly IslamicKnowledgeGovernanceIssue[] {
  const issues: IslamicKnowledgeGovernanceIssue[] = [];
  validateSourceRegistry(issues);

  const entryIds = new Set<string>();
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of entries) {
    if (entryIds.has(entry.id)) {
      pushIssue(
        issues,
        entry.id,
        'duplicate-entry-id',
        `Duplicate knowledge entry ID: ${entry.id}`,
      );
    }
    entryIds.add(entry.id);

    const sources = validateEntrySources(entry, issues);

    if (entry.module === 'quran') {
      if (!/^Qur’an \d{1,3}:\d{1,3}$/u.test(entry.reference)) {
        pushIssue(
          issues,
          entry.id,
          'quran-reference-invalid',
          `Qur'an entry ${entry.id} must use an explicit surah:ayah reference.`,
        );
      }
      const arabicSource = getIslamicKnowledgeSource(entry.arabicSourceId);
      const translationSource = getIslamicKnowledgeSource(entry.translationSourceId);
      const tafsirSource = getIslamicKnowledgeSource(entry.tafsirSourceId);
      if (!entry.sourceIds.includes(entry.arabicSourceId) || arabicSource?.kind !== 'quran-text') {
        pushIssue(
          issues,
          entry.id,
          'quran-arabic-source-invalid',
          `Qur'an entry ${entry.id} must cite an approved Qur'an text source.`,
        );
      }
      if (
        !entry.sourceIds.includes(entry.translationSourceId) ||
        translationSource?.kind !== 'quran-translation' ||
        !translationSource.translator
      ) {
        pushIssue(
          issues,
          entry.id,
          'quran-translation-source-invalid',
          `Qur'an entry ${entry.id} must cite an approved named translation source.`,
        );
      }
      if (
        !entry.sourceIds.includes(entry.tafsirSourceId) ||
        tafsirSource?.kind !== 'quran-tafsir' ||
        entry.tafsirSummary.trim().length < 40
      ) {
        pushIssue(
          issues,
          entry.id,
          'quran-tafsir-source-invalid',
          `Qur'an entry ${entry.id} must retain an approved tafsir source and an attributed summary.`,
        );
      }
      if (entry.topics.length === 0) {
        pushIssue(
          issues,
          entry.id,
          'quran-topic-missing',
          `Qur'an entry ${entry.id} must retain at least one searchable topic.`,
        );
      }
      for (const relatedId of entry.relatedAyahIds) {
        const related = entryById.get(relatedId);
        if (related?.module !== 'quran' || relatedId === entry.id) {
          pushIssue(
            issues,
            entry.id,
            'quran-related-ayah-invalid',
            `Qur'an entry ${entry.id} references invalid related ayah ${relatedId}.`,
          );
        }
      }
      continue;
    }

    if (entry.module === 'hadith') {
      if (entry.collection.trim().length === 0 || !/^Hadith \d+/u.test(entry.reference)) {
        pushIssue(
          issues,
          entry.id,
          'hadith-reference-invalid',
          `Hadith entry ${entry.id} must preserve collection and hadith-number attribution.`,
        );
      }
      if (entry.grade.trim().length === 0 || entry.grader.trim().length === 0) {
        pushIssue(
          issues,
          entry.id,
          'hadith-grading-unattributed',
          `Hadith entry ${entry.id} must preserve grade and grading authority.`,
        );
      }
      const gradingSource = getIslamicKnowledgeSource(entry.gradingAuthoritySourceId);
      if (
        !entry.sourceIds.includes(entry.gradingAuthoritySourceId) ||
        gradingSource?.kind !== 'hadith-collection'
      ) {
        pushIssue(
          issues,
          entry.id,
          'hadith-grading-source-invalid',
          `Hadith entry ${entry.id} must tie grading attribution to an approved hadith source.`,
        );
      }
      continue;
    }

    if (entry.scholar.trim().length === 0 || entry.sourceTitle.trim().length === 0) {
      pushIssue(
        issues,
        entry.id,
        'religious-ruling-unattributed',
        `Q&A entry ${entry.id} must retain scholar/source attribution.`,
      );
    }

    if (entry.contentType === 'fiqh') {
      const coveredMadhhabs = new Set(
        sources.flatMap((source) => (source.kind === 'fiqh' ? source.madhhabs : [])),
      );
      for (const madhhab of requiredMadhhabs) {
        if (!entry.madhhabs.includes(madhhab) || !coveredMadhhabs.has(madhhab)) {
          pushIssue(
            issues,
            entry.id,
            'fiqh-four-madhhab-coverage-missing',
            `Fiqh entry ${entry.id} must include approved ${madhhab} sourcing.`,
          );
        }
      }
      if (entry.recognisedDisagreement && (entry.disagreementNote?.trim().length ?? 0) < 20) {
        pushIssue(
          issues,
          entry.id,
          'fiqh-disagreement-unexplained',
          `Fiqh entry ${entry.id} marks recognised disagreement without explaining it.`,
        );
      }
    }

    if (entry.contentType === 'creed') {
      const creedSources = sources.filter((source) => source.kind === 'creed');
      if (
        creedSources.length === 0 ||
        creedSources.some(
          (source) =>
            source.creedTraditions.length === 0 ||
            source.creedTraditions.some((tradition) => !approvedCreedTraditions.has(tradition)),
        )
      ) {
        pushIssue(
          issues,
          entry.id,
          'creed-content-outside-policy',
          `Creed entry ${entry.id} must use only approved Ash'ari/Maturidi Sunni creed sources.`,
        );
      }
    }
  }

  return Object.freeze(issues);
}
