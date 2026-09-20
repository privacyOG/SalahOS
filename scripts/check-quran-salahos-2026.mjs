import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const readText = (path) => readFile(resolve(root, path), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderSalahosMeaning(entry, baseline) {
  if (typeof entry.englishMeaning === 'string' && entry.englishMeaning.trim().length > 0) {
    return entry.englishMeaning;
  }

  const rewrites = Array.isArray(entry.baseRewrites) ? entry.baseRewrites : [];
  assert(rewrites.length > 0, `${entry.verseKey} has no English meaning or base rewrite.`);
  let rendered = baseline;
  for (const rewrite of rewrites) {
    assert(
      typeof rewrite?.from === 'string' && rewrite.from.length > 0,
      `${entry.verseKey} has an invalid rewrite source.`,
    );
    assert(
      typeof rewrite?.to === 'string' && rewrite.to.length > 0,
      `${entry.verseKey} has an invalid rewrite target.`,
    );
    assert(
      rendered.includes(rewrite.from),
      `${entry.verseKey} rewrite no longer matches pinned Pickthall text: ${rewrite.from}`,
    );
    rendered = rendered.replace(rewrite.from, rewrite.to);
    assert(
      !rendered.includes(rewrite.from),
      `${entry.verseKey} still exposes the rejected baseline phrase: ${rewrite.from}`,
    );
  }
  return rendered;
}

const requiredSeeds = [
  '20:5',
  '35:10',
  '28:88',
  '68:42',
  '2:115',
  '66:12',
  '38:75',
  '24:35',
  '89:22',
  '57:4',
  '41:54',
  '37:99',
  '2:125',
  '6:61',
  '16:128',
];

const [manifest, overrides, coverage, register, pack, reader, preferences, css, surahIndex] =
  await Promise.all([
    readJson('src/data/quran-offline-manifest.json'),
    readJson('src/data/quran-salahos-2026-overrides.json'),
    readJson('src/data/quran-mutashabih-attribute-coverage.json'),
    readJson('src/data/quran-mutashabih-review-register.json'),
    readJson('public/data/quran/quran-offline-pack.json'),
    readText('src/ui/QuranOfflineReader.tsx'),
    readText('src/platform/quranReadingPreferences.ts'),
    readText('src/quran-offline-reader.css'),
    readText('src/ui/QuranSurahIndex.tsx'),
  ]);

assert(overrides.schemaVersion === 2, 'SalahOS 2026 override schema version changed.');
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
  'SalahOS 2026 must remain explicitly provisional until scholarly sign-off.',
);
assert(
  Array.isArray(coverage.creedTraditions) &&
    coverage.creedTraditions.includes('ashari') &&
    coverage.creedTraditions.includes('maturidi'),
  'Mutashabih coverage must retain both Ashari and Maturidi governance.',
);

const overrideKeys = overrides.entries.map((entry) => entry.verseKey);
assert(
  new Set(overrideKeys).size === overrideKeys.length,
  'SalahOS 2026 contains duplicate verse overrides.',
);
const overridesByKey = new Map(overrides.entries.map((entry) => [entry.verseKey, entry]));

for (const key of requiredSeeds) {
  const entry = overridesByKey.get(key);
  assert(entry, `SalahOS 2026 is missing required Mutashabih seed ${key}.`);
  assert(entry.classification === 'mutashabih', `${key} must be marked Mutashabih.`);
  assert(
    (typeof entry.englishMeaning === 'string' && entry.englishMeaning.trim().length > 0) ||
      (Array.isArray(entry.baseRewrites) && entry.baseRewrites.length > 0),
    `${key} has no display treatment.`,
  );
  assert(
    typeof entry.editorialNote === 'string' && entry.editorialNote.trim().length > 0,
    `${key} has no editorial note.`,
  );
  assert(
    typeof entry.salafReading === 'string' && entry.salafReading.trim().length > 0,
    `${key} has no Salaf treatment.`,
  );
  assert(
    typeof entry.khalafReading === 'string' && entry.khalafReading.trim().length > 0,
    `${key} has no Khalaf treatment.`,
  );
}

for (const key of requiredSeeds) {
  assert(
    register.requiredSeedVerses.includes(key),
    `Editorial review register no longer requires guide seed ${key}.`,
  );
}

const coverageKeys = coverage.categories.flatMap((category) => category.verseKeys);
const uniqueCoverageKeys = [...new Set(coverageKeys)];
assert(uniqueCoverageKeys.length === 88, 'Expected 88 unique creed-sensitive coverage verses.');
assert(
  overrides.coverage?.reviewedAttributeRiskVerses === uniqueCoverageKeys.length,
  'SalahOS 2026 coverage metadata is out of sync.',
);

const baselineByKey = new Map();
for (const surah of pack.surahs ?? []) {
  for (const ayah of surah.ayahs ?? []) {
    baselineByKey.set(ayah.key, ayah.translations?.['pickthall-1930']);
  }
}
assert(baselineByKey.size === 6236, 'Pinned Pickthall pack must expose all 6,236 ayat.');

const renderedByKey = new Map();
for (const key of uniqueCoverageKeys) {
  const entry = overridesByKey.get(key);
  assert(entry, `Missing SalahOS 2026 full-corpus treatment for ${key}.`);
  assert(entry.classification === 'mutashabih', `${key} must be classified Mutashabih.`);
  assert(
    typeof entry.editorialNote === 'string' && entry.editorialNote.trim().length > 40,
    `${key} requires a substantive editorial note.`,
  );
  assert(
    typeof entry.salafReading === 'string' && entry.salafReading.trim().length > 30,
    `${key} requires a Salaf/tanzih treatment.`,
  );
  assert(
    typeof entry.khalafReading === 'string' && entry.khalafReading.trim().length > 30,
    `${key} requires a contextual ta'wil treatment.`,
  );
  const baseline = baselineByKey.get(key);
  assert(typeof baseline === 'string' && baseline.length > 0, `Missing pinned baseline for ${key}.`);
  const rendered = renderSalahosMeaning(entry, baseline);
  assert(rendered.trim().length > 0, `${key} rendered an empty English meaning.`);
  renderedByKey.set(key, rendered);
}

for (const key of coverage.categories.find((category) => category.id === 'istiwa-throne').verseKeys) {
  const rendered = renderedByKey.get(key).toLowerCase();
  assert(rendered.includes('subjugat'), `${key} must apply the guide's istiwa/subjugation ta'wil.`);
  assert(!rendered.includes('mounted the throne'), `${key} still implies mounting the Throne.`);
  assert(
    !rendered.includes('established himself upon the throne'),
    `${key} still implies bodily establishment on the Throne.`,
  );
}
for (const key of coverage.categories.find((category) => category.id === 'fi-sama-location').verseKeys) {
  assert(
    !renderedByKey.get(key).toLowerCase().includes('who is in the heaven'),
    `${key} still assigns Allah a location in the heaven.`,
  );
}

assert(
  renderedByKey.get('20:5').includes('without beginning'),
  '20:5 must preserve the guide’s beginningless subjugation explanation.',
);
assert(
  renderedByKey.get('28:88').includes('His Dominion'),
  '28:88 must preserve the supplied guide’s Dominion ta’wil.',
);
assert(
  renderedByKey.get('68:42').includes('anguish and hardship'),
  '68:42 must preserve the supplied guide’s hardship ta’wil.',
);
assert(
  renderedByKey.get('24:35').includes('Creator of guidance'),
  '24:35 must preserve the supplied guide’s guidance ta’wil.',
);
assert(
  renderedByKey.get('57:4').includes('He knows you wherever you are'),
  '57:4 must preserve the supplied guide’s knowledge ta’wil for ma’iyyah.',
);

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
assert(
  manifest.textPresentation?.arabic?.dir === 'rtl',
  'Arabic Qur’an manifest direction must be RTL.',
);
assert(
  manifest.textPresentation?.arabic?.lang === 'ar',
  'Arabic Qur’an manifest language must be Arabic.',
);

assert(
  preferences.includes("translationMode: 'salahos-2026'"),
  'SalahOS 2026 must remain the default reader English meaning.',
);
assert(
  reader.includes('<option value="salahos-2026">'),
  'Reader must expose SalahOS 2026 selection.',
);
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
  `SalahOS 2026 Qur’an contract passed: ${String(uniqueCoverageKeys.length)} full-corpus Mutashabih attribute-risk verses, ${String(requiredSeeds.length)} guide seeds, Uthmani/Hafs/Medina Arabic, explicit RTL/right alignment.`,
);
