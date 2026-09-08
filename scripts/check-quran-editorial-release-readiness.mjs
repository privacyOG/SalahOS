import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const releaseMode = process.argv.includes('--release');

const paths = {
  manifest: new URL('../src/data/quran-offline-manifest.json', import.meta.url),
  pack: new URL('../public/data/quran/quran-offline-pack.json', import.meta.url),
  register: new URL('../src/data/quran-mutashabih-review-register.json', import.meta.url),
  coverage: new URL('../src/data/quran-editorial-screening-coverage.json', import.meta.url),
  signoff: new URL('../src/data/quran-scholar-signoff-v1.6.0.json', import.meta.url),
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function readJson(url) {
  const raw = await readFile(url);
  return { raw, value: JSON.parse(raw.toString('utf8')) };
}

const [manifestFile, packFile, registerFile, coverageFile, signoffFile] = await Promise.all([
  readJson(paths.manifest),
  readJson(paths.pack),
  readJson(paths.register),
  readJson(paths.coverage),
  readJson(paths.signoff),
]);

const manifest = manifestFile.value;
const pack = packFile.value;
const register = registerFile.value;
const coverage = coverageFile.value;
const signoff = signoffFile.value;

assert(manifest.surahs === 114 && manifest.ayahs === 6236, 'Qur’an manifest scope must be 114 surahs / 6,236 ayat.');
assert(pack?.counts?.surahs === 114 && pack?.counts?.ayahs === 6236, 'Packaged Qur’an scope must be 114 surahs / 6,236 ayat.');
assert(sha256(packFile.raw) === manifest.sha256, 'Packaged Qur’an SHA-256 does not match the pinned manifest.');
assert(Array.isArray(pack.surahs) && pack.surahs.length === 114, 'Packaged Qur’an must contain 114 surah records.');

const corpusKeys = new Set();
const surahCounts = new Map();
for (const surah of pack.surahs) {
  assert(Number.isInteger(surah.surah), 'Packaged Qur’an contains an invalid surah number.');
  assert(Array.isArray(surah.ayahs) && surah.ayahs.length > 0, `Surah ${String(surah.surah)} has no ayat.`);
  surahCounts.set(surah.surah, surah.ayahs.length);
  for (const ayah of surah.ayahs) {
    const key = `${String(surah.surah)}:${String(ayah.ayah)}`;
    assert(ayah.key === key, `Packaged Qur’an has an invalid verse key: ${String(ayah.key)}.`);
    assert(!corpusKeys.has(key), `Packaged Qur’an duplicates verse key ${key}.`);
    corpusKeys.add(key);
  }
}
assert(corpusKeys.size === 6236, `Packaged Qur’an exposes ${String(corpusKeys.size)} unique ayat instead of 6,236.`);

assert(register?.schemaVersion === 1, 'Editorial review register schema version is invalid.');
assert(Array.isArray(register.entries), 'Editorial review register entries are missing.');
const registerKeys = new Set();
const unresolvedRegisterKeys = [];
for (const entry of register.entries) {
  assert(nonEmpty(entry.verseKey), 'Editorial review register contains an entry without a verse key.');
  assert(corpusKeys.has(entry.verseKey), `Editorial review register contains unknown verse ${entry.verseKey}.`);
  assert(!registerKeys.has(entry.verseKey), `Editorial review register duplicates ${entry.verseKey}.`);
  registerKeys.add(entry.verseKey);
  if (entry.status !== 'approved') unresolvedRegisterKeys.push(entry.verseKey);
  if (entry.status === 'approved') {
    assert(nonEmpty(entry.reviewer), `Approved editorial entry ${entry.verseKey} has no named reviewer.`);
    assert(entry.treatment !== 'unassigned', `Approved editorial entry ${entry.verseKey} has no selected treatment.`);
    assert(Array.isArray(entry.sourceReferences) && entry.sourceReferences.length > 0, `Approved editorial entry ${entry.verseKey} has no source references.`);
  }
}

assert(coverage?.schemaVersion === 1, 'Qur’an screening coverage schema version is invalid.');
assert(coverage?.scope?.surahs === 114 && coverage?.scope?.ayahs === 6236, 'Qur’an screening coverage scope must be 114 surahs / 6,236 ayat.');
assert(Array.isArray(coverage.reviewedSurahs), 'Qur’an screening reviewedSurahs must be an array.');

const reviewedSurahs = new Set();
const coveredKeys = new Set();
for (const item of coverage.reviewedSurahs) {
  assert(Number.isInteger(item.surah) && surahCounts.has(item.surah), `Screening coverage contains invalid surah ${String(item.surah)}.`);
  assert(!reviewedSurahs.has(item.surah), `Screening coverage duplicates surah ${String(item.surah)}.`);
  assert(item.status === 'screened-complete', `Surah ${String(item.surah)} is not marked screened-complete.`);
  assert(nonEmpty(item.reviewer), `Surah ${String(item.surah)} has no named scholarly reviewer.`);
  assert(/^\d{4}-\d{2}-\d{2}$/u.test(String(item.reviewedOn ?? '')), `Surah ${String(item.surah)} has no valid review date.`);
  assert(item.ayahs === surahCounts.get(item.surah), `Surah ${String(item.surah)} screening ayah count does not match the packaged corpus.`);
  assert(Array.isArray(item.reviewRequiredVerseKeys), `Surah ${String(item.surah)} is missing reviewRequiredVerseKeys.`);
  for (const key of item.reviewRequiredVerseKeys) {
    assert(corpusKeys.has(key), `Screening coverage references unknown verse ${String(key)}.`);
    assert(String(key).startsWith(`${String(item.surah)}:`), `Screening coverage places ${String(key)} under the wrong surah.`);
    assert(registerKeys.has(key), `Review-required verse ${String(key)} is not represented in the editorial register.`);
  }
  reviewedSurahs.add(item.surah);
  for (let ayah = 1; ayah <= item.ayahs; ayah += 1) coveredKeys.add(`${String(item.surah)}:${String(ayah)}`);
}

const missingSurahs = [...surahCounts.keys()].filter((surah) => !reviewedSurahs.has(surah));
const missingAyat = [...corpusKeys].filter((key) => !coveredKeys.has(key));
const registerDigest = sha256(registerFile.raw);

const signoffBindingsValid =
  signoff?.schemaVersion === 1 &&
  signoff.status === 'approved' &&
  nonEmpty(signoff.scholarName) &&
  nonEmpty(signoff.qualifications) &&
  /^\d{4}-\d{2}-\d{2}$/u.test(String(signoff.reviewDate ?? '')) &&
  nonEmpty(signoff.reviewScope) &&
  signoff.quranPackSha256 === manifest.sha256 &&
  signoff.reviewRegisterSha256 === registerDigest &&
  nonEmpty(signoff.approvedEnglishContentId) &&
  nonEmpty(signoff.statement);

const releaseReady =
  coverage.status === 'complete' &&
  reviewedSurahs.size === 114 &&
  coveredKeys.size === 6236 &&
  missingSurahs.length === 0 &&
  missingAyat.length === 0 &&
  unresolvedRegisterKeys.length === 0 &&
  signoffBindingsValid;

const report = {
  mode: releaseMode ? 'release' : 'report',
  repositoryRoot,
  corpus: {
    surahs: surahCounts.size,
    ayahs: corpusKeys.size,
    sha256: manifest.sha256,
  },
  screening: {
    status: coverage.status,
    reviewedSurahs: reviewedSurahs.size,
    reviewedAyat: coveredKeys.size,
    missingSurahs: missingSurahs.length,
    missingAyat: missingAyat.length,
  },
  editorialRegister: {
    entries: registerKeys.size,
    unresolved: unresolvedRegisterKeys.length,
    sha256: registerDigest,
  },
  scholarSignoff: {
    status: signoff.status,
    namedScholar: nonEmpty(signoff.scholarName),
    bindingsValid: signoffBindingsValid,
  },
  releaseReady,
};

console.log(JSON.stringify(report, null, 2));

if (releaseMode && !releaseReady) {
  const reasons = [];
  if (coverage.status !== 'complete') reasons.push('whole-corpus screening coverage is not marked complete');
  if (missingSurahs.length > 0) reasons.push(`${String(missingSurahs.length)} surahs remain without completed scholarly screening`);
  if (missingAyat.length > 0) reasons.push(`${String(missingAyat.length)} ayat remain outside completed scholarly screening`);
  if (unresolvedRegisterKeys.length > 0) reasons.push(`${String(unresolvedRegisterKeys.length)} editorial-register entries remain unresolved`);
  if (!signoffBindingsValid) reasons.push('named qualified scholar sign-off is absent, incomplete, or not bound to the exact corpus/register hashes');
  throw new Error(`Qur’an editorial release gate blocked: ${reasons.join('; ')}.`);
}
