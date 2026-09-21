import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const readText = (path) => readFile(resolve(root, path), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [
  manifest,
  overrides,
  register,
  triggers,
  fullAudit,
  pack,
  reader,
  preferences,
  css,
  surahIndex,
] = await Promise.all([
  readJson('src/data/quran-offline-manifest.json'),
  readJson('src/data/quran-salahos-2026-overrides.json'),
  readJson('src/data/quran-mutashabih-review-register.json'),
  readJson('src/data/quran-mutashabih-policy-triggers.json'),
  readJson('src/data/quran-mutashabih-full-audit.json'),
  readJson('public/data/quran/quran-offline-pack.json'),
  readText('src/ui/QuranOfflineReader.tsx'),
  readText('src/platform/quranReadingPreferences.ts'),
  readText('src/quran-offline-reader.css'),
  readText('src/ui/QuranSurahIndex.tsx'),
]);

assert(overrides.translationId === 'salahos-2026', 'SalahOS 2026 translation ID changed.');
assert(
  overrides.displayName === 'SalahOS 2026 (English meaning)',
  'SalahOS 2026 display name changed.',
);
assert(
  overrides.baseTranslationId === 'pickthall-1930',
  'SalahOS 2026 baseline must remain explicit.',
);
assert(
  overrides.status === 'provisional-pending-whole-corpus-scholar-review',
  'SalahOS 2026 must remain explicitly provisional until qualified scholarly sign-off.',
);

const verseSort = (a, b) => {
  const [aSurah, aAyah] = a.split(':').map(Number);
  const [bSurah, bAyah] = b.split(':').map(Number);
  return aSurah - bSurah || aAyah - bAyah;
};
const requiredFoundations = [...new Set(triggers.foundations ?? [])].sort(verseSort);
const requiredMutashabih = [...new Set(Object.values(triggers.groups ?? {}).flat())].sort(
  verseSort,
);

assert(requiredFoundations.length === 4, 'Muhkam/tanzih foundation count changed.');
assert(
  requiredMutashabih.length === 143,
  `Comprehensive Mutashabih trigger inventory must contain 143 verses, found ${String(requiredMutashabih.length)}.`,
);

assert(
  fullAudit?.status === 'expanded-owner-guide-audit-pending-qualified-scholar-review',
  'Expanded Muhkam/Mutashabih audit status changed unexpectedly.',
);
assert(
  fullAudit?.scope?.screenedVerseCount === 143 &&
    fullAudit?.scope?.overrideVerseCount === 143 &&
    fullAudit?.scope?.baselineSafeVerseCount === 0,
  'Expanded Muhkam/Mutashabih audit coverage changed unexpectedly.',
);
assert(
  JSON.stringify([...(fullAudit.screenedVerseKeys ?? [])].sort(verseSort)) ===
    JSON.stringify(requiredMutashabih),
  'Full audit and trigger registry are out of sync.',
);
assert(
  JSON.stringify([...(fullAudit.overrideVerseKeys ?? [])].sort(verseSort)) ===
    JSON.stringify(requiredMutashabih),
  'Every policy-triggered verse must have an explicit override.',
);

const overrideKeys = overrides.entries.map((entry) => entry.verseKey);
assert(
  new Set(overrideKeys).size === overrideKeys.length,
  'SalahOS 2026 contains duplicate verse overrides.',
);
const overrideByKey = new Map(overrides.entries.map((entry) => [entry.verseKey, entry]));

for (const key of requiredFoundations) {
  const entry = overrideByKey.get(key);
  assert(entry, `SalahOS 2026 is missing required foundation ${key}.`);
  assert(
    entry.classification === 'muhkam-foundation',
    `${key} must be marked as a Muhkam/tanzih foundation.`,
  );
  assert(
    typeof entry.englishMeaning === 'string' && entry.englishMeaning.trim().length > 0,
    `${key} has no English meaning.`,
  );
}

for (const key of requiredMutashabih) {
  const entry = overrideByKey.get(key);
  assert(entry, `SalahOS 2026 is missing policy-triggered Mutashabih verse ${key}.`);
  assert(entry.classification === 'mutashabih', `${key} must be marked Mutashabih.`);
  assert(
    typeof entry.englishMeaning === 'string' && entry.englishMeaning.trim().length > 0,
    `${key} has no English meaning.`,
  );
  assert(
    typeof entry.editorialNote === 'string' && entry.editorialNote.trim().length > 0,
    `${key} has no editorial note.`,
  );
  assert(
    typeof entry.salafReading === 'string' && entry.salafReading.trim().length > 0,
    `${key} has no Salaf/tanzih treatment.`,
  );
  assert(
    typeof entry.khalafReading === 'string' && entry.khalafReading.trim().length > 0,
    `${key} has no contextual ta'wil treatment.`,
  );
  assert(
    register.requiredSeedVerses.includes(key),
    `Editorial review register no longer requires policy-triggered verse ${key}.`,
  );
  assert(
    register.entries.some((candidate) => candidate.verseKey === key),
    `Editorial review register has no row for policy-triggered verse ${key}.`,
  );
}

assert(
  register.entries.length === 147,
  'Editorial register must contain 143 triggers + 4 foundations.',
);
assert(
  register.entries.every(
    (entry) => entry.status === 'pending-scholar-review' && entry.reviewer === null,
  ),
  'Automated editorial data must not fabricate scholarly approval.',
);

const corpusByKey = new Map();
for (const surah of pack.surahs ?? []) {
  for (const ayah of surah.ayahs ?? []) corpusByKey.set(ayah.key, ayah);
}
assert(corpusByKey.size === 6236, 'Expanded audit requires the complete 6,236-ayah pack.');
for (const key of requiredMutashabih) {
  assert(corpusByKey.has(key), `Expanded audit references unknown verse ${key}.`);
}

const istiwaOverThroneKeys = ['7:54', '10:3', '13:2', '20:5', '25:59', '32:4', '57:4'];
for (const key of istiwaOverThroneKeys) {
  const meaning = overrideByKey.get(key)?.englishMeaning ?? '';
  assert(
    meaning.includes('absolute dominion') && meaning.includes('subjugates the Throne'),
    `${key} must use the direct contextual ta'wil of istiwa as dominion/subjugation.`,
  );
  assert(
    !/mounted.*Throne|established (?:Himself )?(?:on|upon) the Throne|has an istiwa over/iu.test(
      meaning,
    ),
    `${key} reintroduced bodily-sounding istiwa wording.`,
  );
}

const ruyah6103 = overrideByKey.get('6:103')?.englishMeaning ?? '';
assert(
  /does not encompass/iu.test(ruyah6103),
  "6:103 must negate encompassing/comprehending Allah rather than deny ru'yah.",
);
assert(
  !/cannot see|not see|never see/iu.test(ruyah6103),
  '6:103 must not be rendered as a denial of seeing Allah.',
);
const ruyah7523 = overrideByKey.get('75:23')?.englishMeaning ?? '';
assert(
  /beholding their Lord/iu.test(ruyah7523) && /without direction or modality/iu.test(ruyah7523),
  "75:23 must affirm ru'yah while explicitly denying direction and modality.",
);

const maiyyah2662 = overrideByKey.get('26:62')?.englishMeaning ?? '';
assert(
  /supports me/iu.test(maiyyah2662),
  "26:62 must render divine ma'iyyah as support rather than physical co-location.",
);
const encompassing7228 = overrideByKey.get('72:28')?.englishMeaning ?? '';
assert(
  /knowledge encompasses/iu.test(encompassing7228),
  '72:28 must render divine encompassing through knowledge rather than spatial surrounding.',
);

const divineNeedAndTransactionKeys = [
  '2:245',
  '3:52',
  '5:12',
  '9:111',
  '47:7',
  '57:11',
  '57:18',
  '59:8',
  '61:14',
  '64:17',
  '73:20',
];
for (const key of divineNeedAndTransactionKeys) {
  const meaning = overrideByKey.get(key)?.englishMeaning ?? '';
  assert(
    !/lend unto Allah|lend to Allah|help Allah\b|Allah's helpers|Allah hath bought|Allah has bought/iu.test(
      meaning,
    ),
    `${key} reintroduced wording that can imply need, dependency or a created transaction.`,
  );
}

const forbiddenLiteralPhrases = new Map([
  ['7:54', ['mounted He the Throne', 'established Himself upon the Throne']],
  ['10:3', ['mounted He the Throne', 'established Himself upon the Throne']],
  ['13:2', ['mounted the Throne', 'established Himself upon the Throne']],
  ['20:5', ['established on the Throne', 'sits on the Throne']],
  ['25:59', ['mounted the Throne']],
  ['32:4', ['mounted the Throne']],
  ['57:4', ['mounted the Throne', 'He is with you wheresoever']],
  ['5:64', ['both His hands are spread out']],
  ['38:75', ['both My hands']],
  ['48:10', ['The Hand of Allah']],
  ['39:67', ['His handful', 'His right hand']],
  ['24:35', ['Allah is the Light of the heavens and the earth']],
  ['67:16', ['Him Who is in the heaven']],
  ['67:17', ['Him Who is in the heaven']],
  ['89:22', ['thy Lord shall come']],
  ['2:115', ["Allah's Countenance"]],
  ['28:88', ['His countenance']],
  ['41:54', ['He surrounding all things']],
  ['2:255', ['His throne includeth']],
  ['4:158', ['unto Himself']],
  ['11:61', ['my Lord is Nigh']],
  ['34:50', ['Hearer, Nigh']],
  ['35:41', ['Allah graspeth', 'could grasp them']],
  ['85:20', ['surroundeth them']],
]);
for (const [key, phrases] of forbiddenLiteralPhrases) {
  const meaning = overrideByKey.get(key)?.englishMeaning ?? '';
  for (const phrase of phrases) {
    assert(
      !meaning.toLowerCase().includes(phrase.toLowerCase()),
      `${key} reintroduced prohibited literal-risk wording: ${phrase}`,
    );
  }
}

assert(
  manifest.surahs === 114 && manifest.ayahs === 6236,
  'Complete Qur’an corpus declaration changed.',
);
assert(manifest.arabicSource?.script === 'Uthmani', 'Arabic Qur’an script must be Uthmani.');
assert(manifest.arabicSource?.reading === 'Hafs', 'Arabic Qur’an reading must remain Hafs.');
assert(
  manifest.arabicSource?.edition === 'Medina Mushaf',
  'Arabic Qur’an edition must remain Medina Mushaf.',
);
assert(manifest.textPresentation?.arabic?.dir === 'rtl', 'Arabic Qur’an direction must be RTL.');
assert(manifest.textPresentation?.arabic?.lang === 'ar', 'Arabic Qur’an language must be Arabic.');

assert(
  preferences.includes("translationMode: 'salahos-2026'"),
  'SalahOS 2026 must remain the default reader English meaning.',
);
assert(reader.includes('<option value="salahos-2026">'), 'Reader must expose SalahOS 2026.');
assert(
  reader.includes('data-quran-salahos-2026-note'),
  'Reader must expose guide-driven Mutashabih notes.',
);
assert(
  reader.includes('data-quran-script="uthmani-hafs"'),
  'Reader ayat must declare Uthmani Hafs rendering.',
);
assert(
  reader.includes('className="knowledge-card__arabic quran-uthmani-script"'),
  'Ayat must use the explicit Uthmani RTL class.',
);
assert(
  surahIndex.includes('className="quran-uthmani-script"'),
  'Arabic surah names must use the explicit Uthmani RTL class.',
);
assert(
  css.includes(".quran-uthmani-script[lang='ar'][dir='rtl']") &&
    css.includes('direction: rtl;') &&
    css.includes('text-align: right;') &&
    css.includes('unicode-bidi: isolate;'),
  'Uthmani Arabic CSS must explicitly enforce RTL, right alignment and bidi isolation.',
);
assert(
  !/quran-offline-reader__ayat--page[^}]*knowledge-card__arabic[^}]*text-align:\s*justify/su.test(
    css,
  ),
  'Qur’an page mode must not justify Arabic instead of right-aligning it.',
);

console.log(
  `SalahOS 2026 Qur’an contract passed: ${String(requiredMutashabih.length)} policy-triggered Mutashabih verses + ${String(requiredFoundations.length)} foundations, all with explicit overrides; Uthmani/Hafs/Medina Arabic and RTL safeguards intact.`,
);
// temporary formatter trigger
