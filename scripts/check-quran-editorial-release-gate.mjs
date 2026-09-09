import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const packPath = resolve(root, 'public/data/quran/quran-offline-pack.json');
const registerPath = resolve(root, 'src/data/quran-mutashabih-review-register.json');
const signoffPath = resolve(root, 'src/data/quran-scholarly-signoff.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isReleaseRef() {
  const refType = process.env.GITHUB_REF_TYPE ?? '';
  const refName = process.env.GITHUB_REF_NAME ?? '';
  return (
    (refType === 'tag' && /^v\d+\.\d+\.\d+(?:[-+].*)?$/u.test(refName)) ||
    (refType === 'branch' && /^release\/v\d+\.\d+\.\d+(?:[-+].*)?$/u.test(refName))
  );
}

const [pack, register, signoff] = await Promise.all(
  [packPath, registerPath, signoffPath].map(async (path) =>
    JSON.parse(await readFile(path, 'utf8')),
  ),
);

assert(pack?.counts?.surahs === 114, 'Editorial gate requires the complete 114-surah corpus.');
assert(pack?.counts?.ayahs === 6236, 'Editorial gate requires the complete 6,236-ayah corpus.');
assert(
  Array.isArray(pack.surahs) && pack.surahs.length === 114,
  'Offline Qur’an pack is incomplete.',
);
assert(Array.isArray(register?.entries), 'Editorial review register entries are missing.');

const corpusKeys = new Set();
for (const surah of pack.surahs) {
  for (const ayah of surah.ayahs ?? []) {
    const key = `${String(surah.surah)}:${String(ayah.ayah)}`;
    assert(ayah.key === key, `Offline Qur’an key mismatch at ${key}.`);
    assert(!corpusKeys.has(key), `Offline Qur’an duplicates ${key}.`);
    corpusKeys.add(key);
  }
}
assert(corpusKeys.size === 6236, `Offline Qur’an exposes ${String(corpusKeys.size)} unique ayat.`);

const entriesByKey = new Map();
for (const entry of register.entries) {
  assert(
    isNonEmptyString(entry?.verseKey),
    'Editorial register contains an entry without a verse key.',
  );
  assert(
    corpusKeys.has(entry.verseKey),
    `Editorial register contains unknown verse ${entry.verseKey}.`,
  );
  assert(!entriesByKey.has(entry.verseKey), `Editorial register duplicates ${entry.verseKey}.`);
  entriesByKey.set(entry.verseKey, entry);

  if (entry.status === 'approved') {
    assert(
      isNonEmptyString(entry.reviewer),
      `Approved entry ${entry.verseKey} has no named reviewer.`,
    );
    assert(
      entry.treatment !== 'unassigned',
      `Approved entry ${entry.verseKey} has no selected treatment.`,
    );
    assert(
      Array.isArray(entry.sourceReferences) && entry.sourceReferences.length > 0,
      `Approved entry ${entry.verseKey} has no source reference.`,
    );
    assert(
      isNonEmptyString(entry.originalEnglish),
      `Approved entry ${entry.verseKey} has no original English wording.`,
    );
    assert(
      isNonEmptyString(entry.arabicExpression),
      `Approved entry ${entry.verseKey} has no Arabic expression.`,
    );
    if (entry.treatment === 'contextual-tawil') {
      assert(
        isNonEmptyString(entry.proposedMeaning),
        `Approved contextual ta’wil ${entry.verseKey} has no proposed meaning.`,
      );
      assert(
        isNonEmptyString(entry.context),
        `Approved contextual ta’wil ${entry.verseKey} has no context/evidence.`,
      );
    }
  }
}

const missingKeys = [...corpusKeys].filter((key) => !entriesByKey.has(key));
const approved = [...entriesByKey.values()].filter((entry) => entry.status === 'approved');
const unresolved = [...entriesByKey.values()].filter((entry) => entry.status !== 'approved');
const namedReviewers = [
  ...new Set(approved.map((entry) => entry.reviewer).filter(isNonEmptyString)),
].sort();

const report = {
  corpusAyat: corpusKeys.size,
  registeredAyat: entriesByKey.size,
  approvedAyat: approved.length,
  unresolvedRegisteredAyat: unresolved.length,
  missingAyat: missingKeys.length,
  namedReviewers,
  scholarlySignoffStatus: signoff?.status ?? null,
  releaseRef: isReleaseRef(),
};

console.log(`Qur’an editorial coverage: ${JSON.stringify(report)}`);

if (!isReleaseRef()) {
  if (missingKeys.length > 0 || unresolved.length > 0 || signoff?.status !== 'approved') {
    console.log('Qur’an scholarly release gate remains intentionally OPEN for development builds.');
  }
  process.exit(0);
}

assert(
  entriesByKey.size === 6236,
  `Release blocked: ${String(missingKeys.length)} ayat are absent from the editorial review register.`,
);
assert(
  approved.length === 6236,
  `Release blocked: ${String(6236 - approved.length)} ayat are not approved in the editorial review register.`,
);
assert(
  unresolved.length === 0,
  `Release blocked: ${String(unresolved.length)} registered ayat remain unresolved.`,
);
assert(
  signoff?.status === 'approved',
  'Release blocked: whole-corpus scholarly sign-off is not approved.',
);
assert(
  isNonEmptyString(signoff.reviewerName),
  'Release blocked: scholarly sign-off has no named reviewer.',
);
assert(
  isNonEmptyString(signoff.qualification),
  'Release blocked: scholarly sign-off has no qualification record.',
);
assert(
  signoff.scope === 'whole-corpus-6236',
  'Release blocked: scholarly sign-off does not cover all 6,236 ayat.',
);
assert(
  isNonEmptyString(signoff.reviewedAt),
  'Release blocked: scholarly sign-off has no review date.',
);

console.log('Qur’an editorial release gate passed for the complete 6,236-ayah corpus.');
