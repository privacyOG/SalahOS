import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const readText = (path) => readFile(resolve(root, path), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [manifest, overrides, register, triggers, reader, preferences, css, surahIndex] =
  await Promise.all([
    readJson('src/data/quran-offline-manifest.json'),
    readJson('src/data/quran-salahos-2026-overrides.json'),
    readJson('src/data/quran-mutashabih-review-register.json'),
    readJson('src/data/quran-mutashabih-policy-triggers.json'),
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
  'SalahOS 2026 must remain explicitly provisional until scholarly sign-off.',
);

const overrideKeys = overrides.entries.map((entry) => entry.verseKey);
assert(
  new Set(overrideKeys).size === overrideKeys.length,
  'SalahOS 2026 contains duplicate verse overrides.',
);

const requiredFoundations = [...new Set(triggers.foundations ?? [])];
const requiredMutashabih = [...new Set(Object.values(triggers.groups ?? {}).flat())].sort(
  (a, b) => {
    const [aSurah, aAyah] = a.split(':').map(Number);
    const [bSurah, bAyah] = b.split(':').map(Number);
    return aSurah - bSurah || aAyah - bAyah;
  },
);

assert(requiredFoundations.length >= 4, 'Muhkam/tanzih foundations are incomplete.');
assert(
  requiredMutashabih.length >= 80,
  'Comprehensive Mutashabih trigger inventory unexpectedly shrank.',
);

for (const key of requiredFoundations) {
  const entry = overrides.entries.find((candidate) => candidate.verseKey === key);
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
  const entry = overrides.entries.find((candidate) => candidate.verseKey === key);
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

const meaningByKey = new Map(
  overrides.entries.map((entry) => [entry.verseKey, entry.englishMeaning]),
);
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
]);
for (const [key, phrases] of forbiddenLiteralPhrases) {
  const meaning = meaningByKey.get(key) ?? '';
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
  `SalahOS 2026 Qur’an contract passed: ${String(requiredMutashabih.length)} policy-triggered Mutashabih verses + ${String(requiredFoundations.length)} foundations, Uthmani/Hafs/Medina Arabic, explicit RTL/right alignment.`,
);
