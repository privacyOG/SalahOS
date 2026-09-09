import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const readText = (path) => readFile(resolve(root, path), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

const [manifest, overrides, register, reader, preferences, css, surahIndex] = await Promise.all([
  readJson('src/data/quran-offline-manifest.json'),
  readJson('src/data/quran-salahos-2026-overrides.json'),
  readJson('src/data/quran-mutashabih-review-register.json'),
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
assert(overrides.baseTranslationId === 'pickthall-1930', 'SalahOS 2026 baseline must remain explicit.');
assert(
  overrides.status === 'provisional-pending-whole-corpus-scholar-review',
  'SalahOS 2026 must remain explicitly provisional until scholarly sign-off.',
);

const overrideKeys = overrides.entries.map((entry) => entry.verseKey);
assert(new Set(overrideKeys).size === overrideKeys.length, 'SalahOS 2026 contains duplicate verse overrides.');
for (const key of requiredSeeds) {
  const entry = overrides.entries.find((candidate) => candidate.verseKey === key);
  assert(entry, `SalahOS 2026 is missing required Mutashabih seed ${key}.`);
  assert(entry.classification === 'mutashabih', `${key} must be marked Mutashabih.`);
  assert(typeof entry.englishMeaning === 'string' && entry.englishMeaning.trim().length > 0, `${key} has no English meaning.`);
  assert(typeof entry.editorialNote === 'string' && entry.editorialNote.trim().length > 0, `${key} has no editorial note.`);
  assert(typeof entry.salafReading === 'string' && entry.salafReading.trim().length > 0, `${key} has no Salaf treatment.`);
  assert(typeof entry.khalafReading === 'string' && entry.khalafReading.trim().length > 0, `${key} has no Khalaf treatment.`);
}

for (const key of requiredSeeds) {
  assert(
    register.requiredSeedVerses.includes(key),
    `Editorial review register no longer requires guide seed ${key}.`,
  );
}

assert(manifest.counts?.surahs === 114 && manifest.counts?.ayahs === 6236, 'Complete Qur’an corpus declaration changed.');
assert(manifest.arabicText?.script === 'Uthmani', 'Arabic Qur’an script must be Uthmani.');
assert(manifest.arabicText?.reading === 'Hafs', 'Arabic Qur’an reading must remain Hafs.');
assert(manifest.arabicText?.edition === 'Medina Mushaf', 'Arabic Qur’an edition must remain Medina Mushaf.');
assert(manifest.textPresentation?.arabic?.dir === 'rtl', 'Arabic Qur’an manifest direction must be RTL.');
assert(manifest.textPresentation?.arabic?.lang === 'ar', 'Arabic Qur’an manifest language must be Arabic.');

assert(
  preferences.includes("translationMode: 'salahos-2026'"),
  'SalahOS 2026 must remain the default reader English meaning.',
);
assert(reader.includes('<option value="salahos-2026">'), 'Reader must expose SalahOS 2026 selection.');
assert(reader.includes('data-quran-salahos-2026-note'), 'Reader must expose guide-driven Mutashabih notes.');
assert(reader.includes('data-quran-script="uthmani-hafs"'), 'Reader ayat must declare Uthmani Hafs rendering.');
assert(reader.includes('className="knowledge-card__arabic quran-uthmani-script"'), 'Ayat must use the explicit Uthmani RTL class.');
assert(surahIndex.includes('className="quran-uthmani-script"'), 'Arabic surah names must use the explicit Uthmani RTL class.');
assert(
  css.includes(".quran-uthmani-script[lang='ar'][dir='rtl']") &&
    css.includes('direction: rtl;') &&
    css.includes('text-align: right;') &&
    css.includes('unicode-bidi: isolate;'),
  'Uthmani Arabic CSS must explicitly enforce RTL, right alignment and bidi isolation.',
);
assert(
  !/quran-offline-reader__ayat--page[^}]*knowledge-card__arabic[^}]*text-align:\s*justify/usu.test(css),
  'Qur’an page mode must not justify Arabic instead of right-aligning it.',
);

console.log(
  `SalahOS 2026 Qur’an contract passed: ${String(requiredSeeds.length)} Mutashabih seeds, Uthmani/Hafs/Medina Arabic, explicit RTL/right alignment.`,
);
