export const quranEditorialTreatments = [
  'unassigned',
  'tafwid',
  'contextual-tawil',
  'muhkam-foundation',
] as const;

export const quranEditorialStatuses = [
  'pending-scholar-review',
  'needs-revision',
  'approved',
] as const;

export type QuranEditorialTreatment = (typeof quranEditorialTreatments)[number];
export type QuranEditorialStatus = (typeof quranEditorialStatuses)[number];

export type QuranEditorialRegisterEntry = Readonly<{
  verseKey: string;
  arabicExpression: string | null;
  context: string | null;
  originalEnglish: string | null;
  proposedMeaning: string | null;
  treatment: QuranEditorialTreatment;
  sourceReferences: readonly string[];
  reviewer: string | null;
  status: QuranEditorialStatus;
  disagreements: readonly string[];
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertPolicy(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validateQuranEditorialEntry(value: unknown): QuranEditorialRegisterEntry {
  assertPolicy(typeof value === 'object' && value !== null, 'Editorial register entry is invalid.');
  const entry = value as Partial<QuranEditorialRegisterEntry>;
  assertPolicy(isNonEmptyString(entry.verseKey), 'Editorial register verse key is missing.');
  assertPolicy(
    quranEditorialTreatments.includes(entry.treatment as QuranEditorialTreatment),
    `Editorial treatment is invalid for ${entry.verseKey}.`,
  );
  assertPolicy(
    quranEditorialStatuses.includes(entry.status as QuranEditorialStatus),
    `Editorial status is invalid for ${entry.verseKey}.`,
  );
  assertPolicy(Array.isArray(entry.sourceReferences), `Source references are missing for ${entry.verseKey}.`);
  assertPolicy(Array.isArray(entry.disagreements), `Disagreement field is missing for ${entry.verseKey}.`);

  if (entry.status === 'approved') {
    assertPolicy(isNonEmptyString(entry.reviewer), `Approved entry ${entry.verseKey} has no named reviewer.`);
    assertPolicy(
      entry.treatment !== 'unassigned',
      `Approved entry ${entry.verseKey} has no selected treatment.`,
    );
    assertPolicy(
      entry.sourceReferences.length > 0,
      `Approved entry ${entry.verseKey} has no source reference.`,
    );
    assertPolicy(
      isNonEmptyString(entry.originalEnglish),
      `Approved entry ${entry.verseKey} has no original English wording.`,
    );
    assertPolicy(
      isNonEmptyString(entry.arabicExpression),
      `Approved entry ${entry.verseKey} has no Arabic expression.`,
    );
    if (entry.treatment === 'contextual-tawil') {
      assertPolicy(
        isNonEmptyString(entry.proposedMeaning),
        `Approved contextual ta’wil ${entry.verseKey} has no proposed meaning.`,
      );
      assertPolicy(
        isNonEmptyString(entry.context),
        `Approved contextual ta’wil ${entry.verseKey} has no contextual evidence.`,
      );
    }
  }

  return value as QuranEditorialRegisterEntry;
}

export function validateQuranEditorialRegister(
  entries: readonly unknown[],
): readonly QuranEditorialRegisterEntry[] {
  const validated = entries.map(validateQuranEditorialEntry);
  const keys = new Set<string>();
  for (const entry of validated) {
    assertPolicy(!keys.has(entry.verseKey), `Editorial register duplicates ${entry.verseKey}.`);
    keys.add(entry.verseKey);
  }
  return Object.freeze(validated);
}
