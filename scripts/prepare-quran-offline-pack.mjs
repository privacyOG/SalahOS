import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import manifest from '../src/data/quran-offline-manifest.json' with { type: 'json' };

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const targetPath = resolve(repositoryRoot, `public${manifest.packPath}`);
const checkOnly = process.argv.includes('--check');

const arabicUrl = `https://raw.githubusercontent.com/${manifest.arabicSource.repository}/${manifest.arabicSource.commit}/${manifest.arabicSource.path}`;
const translationUrl = `https://raw.githubusercontent.com/${manifest.translationSource.repository}/${manifest.translationSource.commit}/${manifest.translationSource.path}`;

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validatePack(pack) {
  assert(pack?.schemaVersion === 1, 'Offline Qur’an pack schema version is invalid.');
  assert(pack?.counts?.surahs === manifest.surahs, 'Offline Qur’an surah count is invalid.');
  assert(pack?.counts?.ayahs === manifest.ayahs, 'Offline Qur’an ayah count is invalid.');
  assert(Array.isArray(pack?.surahs), 'Offline Qur’an surah collection is missing.');
  assert(pack.surahs.length === manifest.surahs, 'Offline Qur’an must contain 114 surahs.');

  const verseKeys = new Set();
  let ayahCount = 0;
  for (const surah of pack.surahs) {
    assert(Number.isInteger(surah.surah), 'Offline Qur’an surah number is invalid.');
    assert(Array.isArray(surah.ayahs), `Surah ${String(surah.surah)} has no ayah collection.`);
    for (const ayah of surah.ayahs) {
      const expectedKey = `${String(surah.surah)}:${String(ayah.ayah)}`;
      assert(ayah.key === expectedKey, `Unexpected verse key ${String(ayah.key)}.`);
      assert(!verseKeys.has(ayah.key), `Duplicate verse key ${String(ayah.key)}.`);
      assert(typeof ayah.arabic === 'string' && ayah.arabic.length > 0, `Missing Arabic for ${ayah.key}.`);
      assert(
        typeof ayah.translations?.['pickthall-1930'] === 'string' &&
          ayah.translations['pickthall-1930'].length > 0,
        `Missing Pickthall translation for ${ayah.key}.`,
      );
      verseKeys.add(ayah.key);
      ayahCount += 1;
    }
  }

  assert(ayahCount === manifest.ayahs, `Offline Qur’an ayah count ${String(ayahCount)} is invalid.`);
  assert(verseKeys.size === manifest.ayahs, 'Offline Qur’an verse keys are not unique.');
}

async function validateExistingPack() {
  const content = await readFile(targetPath);
  const digest = sha256(content);
  assert(digest === manifest.sha256, `Offline Qur’an pack hash ${digest} does not match the pinned manifest.`);
  const pack = JSON.parse(content.toString('utf8'));
  validatePack(pack);
  return digest;
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SalahOS-Quran-Packager/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`${label} download failed with HTTP ${String(response.status)}.`);
  }
  return response.json();
}

function buildPack(arabic, pickthall) {
  assert(Array.isArray(arabic?.surahs) && arabic.surahs.length === 114, 'Pinned Arabic source must contain 114 surahs.');
  assert(Array.isArray(pickthall) && pickthall.length === 114, 'Pinned Pickthall source must contain 114 surahs.');

  const translationBySurah = new Map(pickthall.map((surah) => [Number(surah.number), surah]));
  const surahs = arabic.surahs.map((surah) => {
    const surahNumber = Number(surah.number);
    const translationSurah = translationBySurah.get(surahNumber);
    assert(translationSurah, `Missing Pickthall surah ${String(surahNumber)}.`);
    const translations = new Map(
      translationSurah.verses.map((verse) => [Number(verse.number), verse.translation]),
    );

    const ayahs = surah.ayahs.map((ayah) => {
      const ayahNumber = Number(ayah.number);
      const key = String(ayah.verse_key);
      const expectedKey = `${String(surahNumber)}:${String(ayahNumber)}`;
      assert(key === expectedKey, `Unexpected source verse key ${key}; expected ${expectedKey}.`);
      const translation = translations.get(ayahNumber);
      assert(typeof translation === 'string' && translation.trim().length > 0, `Missing Pickthall translation for ${key}.`);
      return {
        ayah: ayahNumber,
        key,
        arabic: String(ayah.text),
        translations: { 'pickthall-1930': translation.trim() },
        juz: Number(ayah.juz),
        page: Number(ayah.page),
      };
    });

    assert(
      ayahs.length === Number(surah.counts.ayahs),
      `Surah ${String(surahNumber)} ayah count does not match source metadata.`,
    );

    return {
      surah: surahNumber,
      nameArabic: String(surah.name_arabic),
      nameTransliteration: String(surah.name_transliteration),
      nameEnglish: String(surah.name_english),
      ayahs,
    };
  });

  return {
    schemaVersion: 1,
    counts: { surahs: 114, ayahs: 6236 },
    sources: {
      arabic: {
        id: 'quran-uthmani-text',
        upstream: manifest.arabicSource.repository,
        commit: manifest.arabicSource.commit,
        license: manifest.arabicSource.license,
      },
      translations: {
        'pickthall-1930': {
          sourceId: 'quran-pickthall-1930',
          upstream: manifest.translationSource.repository,
          commit: manifest.translationSource.commit,
          translator: manifest.translationSource.translator,
        },
      },
    },
    surahs,
  };
}

try {
  const digest = await validateExistingPack();
  console.log(`Offline Qur’an pack verified: ${String(manifest.surahs)} surahs / ${String(manifest.ayahs)} ayat / sha256:${digest}`);
} catch (error) {
  if (checkOnly) throw error;

  const [arabic, pickthall] = await Promise.all([
    fetchJson(arabicUrl, 'Pinned Arabic Qur’an source'),
    fetchJson(translationUrl, 'Pinned Pickthall translation source'),
  ]);
  const pack = buildPack(arabic, pickthall);
  validatePack(pack);
  const content = Buffer.from(JSON.stringify(pack), 'utf8');
  const digest = sha256(content);
  assert(
    digest === manifest.sha256,
    `Generated offline Qur’an pack hash ${digest} does not match pinned ${manifest.sha256}.`,
  );
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
  console.log(`Generated offline Qur’an pack: ${String(manifest.surahs)} surahs / ${String(manifest.ayahs)} ayat / sha256:${digest}`);
}
