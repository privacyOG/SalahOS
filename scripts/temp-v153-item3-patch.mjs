import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function replaceExact(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${String(count)}`);
  return source.replace(before, after);
}

function replaceCount(source, before, after, expected, label) {
  const count = source.split(before).length - 1;
  if (count !== expected)
    throw new Error(`${label}: expected ${String(expected)} matches, found ${String(count)}`);
  return source.split(before).join(after);
}

async function read(relative) {
  return readFile(path.join(root, relative), 'utf8');
}

async function write(relative, content) {
  await writeFile(path.join(root, relative), content, 'utf8');
}

await write(
  'src/domain/textPresentation.ts',
  `export type TextDirection = 'ltr' | 'rtl';\n\nexport interface TextPresentationMetadata {\n  readonly lang: string;\n  readonly dir: TextDirection;\n}\n\nexport const englishTextPresentation = Object.freeze({\n  lang: 'en',\n  dir: 'ltr',\n}) satisfies TextPresentationMetadata;\n\nexport const arabicTextPresentation = Object.freeze({\n  lang: 'ar',\n  dir: 'rtl',\n}) satisfies TextPresentationMetadata;\n\nexport const latinTransliterationPresentation = Object.freeze({\n  lang: 'en-Latn',\n  dir: 'ltr',\n}) satisfies TextPresentationMetadata;\n\nexport function textPresentationMetadata(\n  lang: string,\n  dir: TextDirection,\n): TextPresentationMetadata {\n  if (lang.trim().length === 0) throw new TypeError('Text language tag cannot be empty');\n  return Object.freeze({ lang, dir });\n}\n`,
);

let knowledge = await read('src/domain/islamicKnowledge.ts');
knowledge = replaceExact(
  knowledge,
  "import { stage7SearchText } from './islamicKnowledgeStage7';\n",
  "import { stage7SearchText } from './islamicKnowledgeStage7';\nimport { englishTextPresentation, type TextPresentationMetadata } from './textPresentation';\n",
  'islamicKnowledge import',
);
knowledge = replaceExact(
  knowledge,
  "  readonly translation: string;\n  readonly reference: string;\n",
  "  readonly translation: string;\n  readonly translationPresentation: TextPresentationMetadata;\n  readonly reference: string;\n  readonly referencePresentation: TextPresentationMetadata;\n",
  'Quran interface translation metadata',
);
knowledge = replaceExact(
  knowledge,
  "  readonly tafsirSummary: string;\n  readonly relatedAyahIds: readonly string[];\n",
  "  readonly tafsirSummary: string;\n  readonly tafsirSummaryPresentation: TextPresentationMetadata;\n  readonly relatedAyahIds: readonly string[];\n",
  'Quran interface tafsir metadata',
);
knowledge = replaceExact(
  knowledge,
  "  readonly text: string;\n  readonly collection: string;\n  readonly reference: string;\n",
  "  readonly text: string;\n  readonly translationPresentation: TextPresentationMetadata;\n  readonly collection: string;\n  readonly reference: string;\n  readonly referencePresentation: TextPresentationMetadata;\n  readonly metadataPresentation: TextPresentationMetadata;\n",
  'Hadith interface metadata',
);
knowledge = replaceExact(
  knowledge,
  "  readonly answer: string;\n  readonly scholar: string;\n",
  "  readonly answer: string;\n  readonly metadataPresentation: TextPresentationMetadata;\n  readonly scholar: string;\n",
  'QA interface metadata',
);
knowledge = replaceCount(
  knowledge,
  "    translationSourceId: 'quran-pickthall-1930',\n",
  "    translationSourceId: 'quran-pickthall-1930',\n    translationPresentation: englishTextPresentation,\n    referencePresentation: englishTextPresentation,\n    tafsirSummaryPresentation: englishTextPresentation,\n",
  3,
  'Quran entry presentation metadata',
);
knowledge = knowledge.replace(
  /(    gradingAuthoritySourceId: 'hadith-(?:bukhari|muslim)',\n)/gu,
  "$1    translationPresentation: englishTextPresentation,\n    referencePresentation: englishTextPresentation,\n    metadataPresentation: englishTextPresentation,\n",
);
if ((knowledge.match(/translationPresentation: englishTextPresentation/gu) ?? []).length !== 6)
  throw new Error('Hadith presentation metadata insertion failed');
knowledge = replaceCount(
  knowledge,
  "    answer:\n",
  "    metadataPresentation: englishTextPresentation,\n    answer:\n",
  3,
  'QA entry presentation metadata',
);
await write('src/domain/islamicKnowledge.ts', knowledge);

let stage7 = await read('src/domain/islamicKnowledgeStage7.ts');
stage7 = replaceExact(
  stage7,
  "import type { Madhhab } from './islamicKnowledge';\n",
  "import type { Madhhab } from './islamicKnowledge';\nimport { englishTextPresentation, type TextPresentationMetadata } from './textPresentation';\n",
  'stage7 import',
);
stage7 = replaceExact(
  stage7,
  "  readonly sourceId: string;\n  readonly bookNumber: number;\n",
  "  readonly sourceId: string;\n  readonly displayPresentation: TextPresentationMetadata;\n  readonly bookNumber: number;\n",
  'stage7 interface metadata',
);
stage7 = stage7.replace(
  /(    sourceId: 'hadith-(?:bukhari|muslim)',\n)/gu,
  "$1    displayPresentation: englishTextPresentation,\n",
);
if ((stage7.match(/displayPresentation: englishTextPresentation/gu) ?? []).length !== 3)
  throw new Error('Hadith stage7 display metadata insertion failed');
await write('src/domain/islamicKnowledgeStage7.ts', stage7);

let governance = await read('src/domain/islamicKnowledgeGovernance.ts');
governance = replaceExact(
  governance,
  "import type { IslamicKnowledgeEntry, Madhhab } from './islamicKnowledge';\n",
  "import type { IslamicKnowledgeEntry, Madhhab } from './islamicKnowledge';\nimport type { TextPresentationMetadata } from './textPresentation';\n",
  'governance import',
);
governance = replaceExact(
  governance,
  "  readonly provenance: string;\n  readonly reviewStatus: ScholarlySourceReviewStatus;\n",
  "  readonly provenance: string;\n  readonly displayPresentation: TextPresentationMetadata;\n  readonly reviewStatus: ScholarlySourceReviewStatus;\n",
  'source display metadata interface',
);
governance = replaceExact(
  governance,
  "    if (source.edition.trim().length === 0 || source.citation.trim().length === 0) {\n",
  "    if (\n      source.displayPresentation.lang.trim().length === 0 ||\n      (source.displayPresentation.dir !== 'ltr' && source.displayPresentation.dir !== 'rtl')\n    ) {\n      pushIssue(\n        issues,\n        source.id,\n        'source-display-presentation-invalid',\n        \`Source \${source.id} must define valid display language and direction metadata.\`,\n      );\n    }\n    if (source.edition.trim().length === 0 || source.citation.trim().length === 0) {\n",
  'source display metadata validation',
);
await write('src/domain/islamicKnowledgeGovernance.ts', governance);

const registryPath = 'src/data/islamic-knowledge-source-registry.json';
const registry = JSON.parse(await read(registryPath));
for (const source of registry.sources) {
  source.displayPresentation = { lang: 'en', dir: 'ltr' };
}
await write(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

const manifestPath = 'src/data/quran-offline-manifest.json';
const manifest = JSON.parse(await read(manifestPath));
manifest.textPresentation = {
  arabic: { lang: 'ar', dir: 'rtl' },
  reference: { lang: 'en', dir: 'ltr' },
  transliteration: { lang: 'en-Latn', dir: 'ltr' },
  translations: { 'pickthall-1930': { lang: 'en', dir: 'ltr' } },
};
await write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

let offlineDomain = await read('src/domain/quranOfflineLibrary.ts');
offlineDomain = replaceExact(
  offlineDomain,
  "import manifest from '../data/quran-offline-manifest.json';\n",
  "import manifest from '../data/quran-offline-manifest.json';\nimport { textPresentationMetadata, type TextPresentationMetadata } from './textPresentation';\n",
  'offline domain import',
);
offlineDomain = replaceExact(
  offlineDomain,
  "export type QuranOfflineTranslationId = 'pickthall-1930';\n",
  "export type QuranOfflineTranslationId = 'pickthall-1930';\n\nfunction presentationMetadata(value: Readonly<{ lang: string; dir: string }>): TextPresentationMetadata {\n  if (value.dir !== 'ltr' && value.dir !== 'rtl') {\n    throw new TypeError(\`Unsupported text direction: \${value.dir}\`);\n  }\n  return textPresentationMetadata(value.lang, value.dir);\n}\n\nexport const quranOfflineArabicPresentation = presentationMetadata(\n  manifest.textPresentation.arabic,\n);\nexport const quranOfflineReferencePresentation = presentationMetadata(\n  manifest.textPresentation.reference,\n);\nexport const quranOfflineTransliterationPresentation = presentationMetadata(\n  manifest.textPresentation.transliteration,\n);\n\nexport function getQuranOfflineTranslationPresentation(\n  translationId: QuranOfflineTranslationId,\n): TextPresentationMetadata {\n  return presentationMetadata(manifest.textPresentation.translations[translationId]);\n}\n",
  'offline presentation metadata',
);
await write('src/domain/quranOfflineLibrary.ts', offlineDomain);

let screen = await read('src/ui/KnowledgeScreen.tsx');
screen = replaceExact(
  screen,
  "import { FiqhStage7Details, HadithStage7Details } from './KnowledgeStage7Details';\n",
  "import { FiqhStage7Details, HadithStage7Details } from './KnowledgeStage7Details';\nimport { BidiText } from './BidiText';\n",
  'KnowledgeScreen Bidi import',
);
screen = replaceExact(
  screen,
  "  const tafsirSource = getIslamicKnowledgeSource(entry.tafsirSourceId);\n",
  "  const arabicSource = getIslamicKnowledgeSource(entry.arabicSourceId);\n  const translationSource = getIslamicKnowledgeSource(entry.translationSourceId);\n  const tafsirSource = getIslamicKnowledgeSource(entry.tafsirSourceId);\n",
  'KnowledgeScreen source metadata',
);
screen = replaceExact(
  screen,
  "      {showTranslation ? <p data-quran-translation>{entry.translation}</p> : null}\n",
  "      {showTranslation ? (\n        <p\n          data-quran-translation\n          lang={entry.translationPresentation.lang}\n          dir={entry.translationPresentation.dir}\n        >\n          {entry.translation}\n        </p>\n      ) : null}\n",
  'KnowledgeScreen translation direction',
);
screen = replaceExact(
  screen,
  `        <div>\n          <dt>{labels.source}</dt>\n          <dd>\n            {entry.reference} · Arabic Uthmani text\n            {showTranslation ? \` · \${labels.pickthall}\` : ''}\n          </dd>\n        </div>\n        <div>\n          <dt>{labels.tafsir}</dt>\n          <dd>{tafsirSource?.title ?? entry.tafsirSourceId}</dd>\n        </div>\n`,
  `        <div>\n          <dt>{labels.source}</dt>\n          <dd\n            data-knowledge-source-metadata\n            lang={entry.referencePresentation.lang}\n            dir={entry.referencePresentation.dir}\n          >\n            <BidiText>{entry.reference}</BidiText> ·{' '}\n            <span\n              lang={arabicSource?.displayPresentation.lang ?? entry.referencePresentation.lang}\n              dir={arabicSource?.displayPresentation.dir ?? entry.referencePresentation.dir}\n            >\n              {arabicSource?.title ?? entry.arabicSourceId}\n            </span>\n            {showTranslation ? (\n              <>\n                {' · '}\n                <span\n                  lang={\n                    translationSource?.displayPresentation.lang ?? entry.translationPresentation.lang\n                  }\n                  dir={\n                    translationSource?.displayPresentation.dir ?? entry.translationPresentation.dir\n                  }\n                >\n                  {translationSource?.title ?? entry.translationSourceId}\n                </span>\n              </>\n            ) : null}\n          </dd>\n        </div>\n        <div>\n          <dt>{labels.tafsir}</dt>\n          <dd\n            data-knowledge-source-metadata\n            lang={tafsirSource?.displayPresentation.lang ?? entry.tafsirSummaryPresentation.lang}\n            dir={tafsirSource?.displayPresentation.dir ?? entry.tafsirSummaryPresentation.dir}\n          >\n            {tafsirSource?.title ?? entry.tafsirSourceId}\n          </dd>\n        </div>\n`,
  'KnowledgeScreen source metadata direction',
);
screen = replaceExact(
  screen,
  "        <p>{entry.tafsirSummary}</p>\n",
  "        <p\n          data-quran-tafsir-summary\n          lang={entry.tafsirSummaryPresentation.lang}\n          dir={entry.tafsirSummaryPresentation.dir}\n        >\n          {entry.tafsirSummary}\n        </p>\n",
  'KnowledgeScreen tafsir direction',
);
screen = replaceExact(
  screen,
  `            >\n              {relatedEntry.reference}\n            </button>\n`,
  `              data-quran-related-reference\n              lang={relatedEntry.referencePresentation.lang}\n              dir={relatedEntry.referencePresentation.dir}\n            >\n              <BidiText>{relatedEntry.reference}</BidiText>\n            </button>\n`,
  'KnowledgeScreen related reference',
);
screen = replaceExact(
  screen,
  "                  {labels.resume}: {resumeEntry.reference}\n",
  "                  {labels.resume}: <BidiText>{resumeEntry.reference}</BidiText>\n",
  'KnowledgeScreen resume bidi',
);
await write('src/ui/KnowledgeScreen.tsx', screen);

let details = await read('src/ui/KnowledgeStage7Details.tsx');
details = replaceExact(
  details,
  "import type { Locale } from '../i18n/translations';\n",
  "import type { Locale } from '../i18n/translations';\nimport { BidiText } from './BidiText';\n",
  'KnowledgeStage7 Bidi import',
);
details = replaceExact(
  details,
  "  if (!metadata) return <p>{entry.text}</p>;\n",
  "  if (!metadata)\n    return (\n      <p lang={entry.translationPresentation.lang} dir={entry.translationPresentation.dir}>\n        {entry.text}\n      </p>\n    );\n",
  'Hadith fallback direction',
);
details = replaceExact(
  details,
  "      <p data-hadith-translation>{entry.text}</p>\n",
  "      <p\n        data-hadith-translation\n        lang={entry.translationPresentation.lang}\n        dir={entry.translationPresentation.dir}\n      >\n        {entry.text}\n      </p>\n",
  'Hadith translation direction',
);
details = replaceExact(
  details,
  "          <dd data-hadith-book>\n",
  "          <dd\n            data-hadith-book\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n",
  'Hadith book metadata',
);
details = replaceExact(
  details,
  "          <dd data-hadith-chapter>\n",
  "          <dd\n            data-hadith-chapter\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n",
  'Hadith chapter metadata',
);
details = replaceExact(
  details,
  `          <dd>\n            {entry.collection} · {entry.reference} · {metadata.inBookReference}\n          </dd>\n`,
  `          <dd\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n            {entry.collection} · <BidiText>{entry.reference}</BidiText> ·{' '}\n            {metadata.inBookReference}\n          </dd>\n`,
  'Hadith reference metadata',
);
details = replaceCount(
  details,
  "          <dd>{entry.grade}</dd>\n",
  "          <dd\n            data-knowledge-source-metadata\n            lang={entry.metadataPresentation.lang}\n            dir={entry.metadataPresentation.dir}\n          >\n            {entry.grade}\n          </dd>\n",
  1,
  'Hadith grade metadata',
);
details = replaceCount(
  details,
  "          <dd>{entry.grader}</dd>\n",
  "          <dd\n            data-knowledge-source-metadata\n            lang={entry.metadataPresentation.lang}\n            dir={entry.metadataPresentation.dir}\n          >\n            {entry.grader}\n          </dd>\n",
  1,
  'Hadith grader metadata',
);
details = replaceExact(
  details,
  `            >\n              {relatedEntry.reference}\n            </button>\n`,
  `              data-hadith-related-reference\n              lang={relatedEntry.referencePresentation.lang}\n              dir={relatedEntry.referencePresentation.dir}\n            >\n              <BidiText>{relatedEntry.reference}</BidiText>\n            </button>\n`,
  'Hadith related reference',
);
details = replaceExact(
  details,
  "      <p className=\"knowledge-card__source-note\">{entry.sourceNote}</p>\n",
  "      <p\n        className=\"knowledge-card__source-note\"\n        lang={entry.metadataPresentation.lang}\n        dir={entry.metadataPresentation.dir}\n      >\n        {entry.sourceNote}\n      </p>\n",
  'Hadith source note direction',
);
details = replaceExact(
  details,
  "  if (!metadata) return <p>{entry.answer}</p>;\n",
  "  if (!metadata)\n    return (\n      <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n        {entry.answer}\n      </p>\n    );\n",
  'Fiqh fallback direction',
);
details = replaceExact(
  details,
  "      <p>{entry.answer}</p>\n",
  "      <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n        {entry.answer}\n      </p>\n",
  'Fiqh answer direction',
);
for (const [before, after, label] of [
  ["          <dd>{entry.scholar}</dd>\n", "          <dd data-knowledge-source-metadata lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n            {entry.scholar}\n          </dd>\n", 'Fiqh scholar'],
  ["          <dd>{entry.sourceTitle}</dd>\n", "          <dd data-knowledge-source-metadata lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n            {entry.sourceTitle}\n          </dd>\n", 'Fiqh sources'],
  ["          <dd data-fiqh-topic>{metadata.topic}</dd>\n", "          <dd data-fiqh-topic data-knowledge-source-metadata lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n            {metadata.topic}\n          </dd>\n", 'Fiqh topic'],
  ["          <dd>{metadata.reviewedAt}</dd>\n", "          <dd data-knowledge-source-metadata lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n            {metadata.reviewedAt}\n          </dd>\n", 'Fiqh reviewed'],
  ["          <dd data-fiqh-supporting>{metadata.supportingReferences.join(' · ')}</dd>\n", "          <dd data-fiqh-supporting data-knowledge-source-metadata lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n            {metadata.supportingReferences.join(' · ')}\n          </dd>\n", 'Fiqh supporting'],
]) {
  details = replaceExact(details, before, after, label);
}
details = replaceExact(
  details,
  "                <p>{position.summary}</p>\n                <small>{source?.title ?? position.sourceId}</small>\n",
  "                <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n                  {position.summary}\n                </p>\n                <small\n                  lang={source?.displayPresentation.lang ?? entry.metadataPresentation.lang}\n                  dir={source?.displayPresentation.dir ?? entry.metadataPresentation.dir}\n                >\n                  {source?.title ?? position.sourceId}\n                </small>\n",
  'Fiqh source title direction',
);
details = replaceExact(
  details,
  "          <p>{entry.disagreementNote}</p>\n",
  "          <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>\n            {entry.disagreementNote}\n          </p>\n",
  'Fiqh disagreement direction',
);
details = replaceExact(
  details,
  "      <p className=\"knowledge-card__source-note\">{entry.sourceNote}</p>\n",
  "      <p\n        className=\"knowledge-card__source-note\"\n        lang={entry.metadataPresentation.lang}\n        dir={entry.metadataPresentation.dir}\n      >\n        {entry.sourceNote}\n      </p>\n",
  'Fiqh source note direction',
);
await write('src/ui/KnowledgeStage7Details.tsx', details);

let reader = await read('src/ui/QuranOfflineReader.tsx');
reader = replaceExact(
  reader,
  "  getQuranOfflineAyah,\n",
  "  getQuranOfflineAyah,\n  getQuranOfflineTranslationPresentation,\n",
  'Offline reader translation metadata import',
);
reader = replaceExact(
  reader,
  "  parseQuranVerseKey,\n",
  "  parseQuranVerseKey,\n  quranOfflineArabicPresentation,\n  quranOfflineReferencePresentation,\n  quranOfflineTransliterationPresentation,\n",
  'Offline reader presentation imports',
);
reader = replaceExact(
  reader,
  "import type { Locale } from '../i18n/translations';\n",
  "import type { Locale } from '../i18n/translations';\nimport { BidiText } from './BidiText';\n",
  'Offline reader Bidi import',
);
reader = replaceExact(
  reader,
  "const copy: Readonly<Record<Locale, QuranReaderCopy>> = {\n",
  "const pickthallPresentation = getQuranOfflineTranslationPresentation('pickthall-1930');\n\nconst copy: Readonly<Record<Locale, QuranReaderCopy>> = {\n",
  'Pickthall presentation metadata',
);
reader = replaceExact(
  reader,
  "              {labels.resume}: {String(lastRead.surah)}:{String(lastRead.ayah)}\n",
  "              {labels.resume}:{' '}\n              <BidiText>\n                {String(lastRead.surah)}:{String(lastRead.ayah)}\n              </BidiText>\n",
  'Offline resume reference isolation',
);
reader = replaceExact(
  reader,
  `                  <option key={surah.surah} value={surah.surah}>\n                    {String(surah.surah)}. {surah.nameTransliteration} · {surah.nameArabic}\n                  </option>\n`,
  `                  <option\n                    key={surah.surah}\n                    value={surah.surah}\n                    lang={\n                      locale === 'ar'\n                        ? quranOfflineArabicPresentation.lang\n                        : quranOfflineTransliterationPresentation.lang\n                    }\n                    dir={\n                      locale === 'ar'\n                        ? quranOfflineArabicPresentation.dir\n                        : quranOfflineTransliterationPresentation.dir\n                    }\n                  >\n                    {String(surah.surah)}.{' '}\n                    {locale === 'ar' ? surah.nameArabic : surah.nameTransliteration}\n                  </option>\n`,
  'Surah option direction',
);
reader = replaceExact(
  reader,
  `                      <span className="knowledge-badge">\n                        {result.surah.nameTransliteration} · {result.ayah.key}\n                      </span>\n                      <span className="knowledge-offline">Juz {String(result.ayah.juz)}</span>\n`,
  `                      <span\n                        className="knowledge-badge"\n                        lang={quranOfflineTransliterationPresentation.lang}\n                        dir={quranOfflineTransliterationPresentation.dir}\n                      >\n                        {result.surah.nameTransliteration} · <BidiText>{result.ayah.key}</BidiText>\n                      </span>\n                      <span\n                        className="knowledge-offline"\n                        lang={quranOfflineReferencePresentation.lang}\n                        dir={quranOfflineReferencePresentation.dir}\n                      >\n                        Juz {String(result.ayah.juz)}\n                      </span>\n`,
  'Offline ayah metadata direction',
);
reader = replaceExact(
  reader,
  `                      <p className="quran-offline-ayah__translation">\n                        {result.ayah.translations['pickthall-1930']}\n                      </p>\n`,
  `                      <p\n                        className="quran-offline-ayah__translation"\n                        data-quran-offline-translation\n                        lang={pickthallPresentation.lang}\n                        dir={pickthallPresentation.dir}\n                      >\n                        {result.ayah.translations['pickthall-1930']}\n                      </p>\n`,
  'Offline translation direction',
);
reader = replaceExact(
  reader,
  `                        <dd>\n                          Qur’an {result.ayah.key} · Uthmani Arabic · M. M. Pickthall (1930) · Page{' '}\n                          {String(result.ayah.page)}\n                        </dd>\n`,
  `                        <dd\n                          data-knowledge-source-metadata\n                          lang={pickthallPresentation.lang}\n                          dir={pickthallPresentation.dir}\n                        >\n                          Qur’an <BidiText>{result.ayah.key}</BidiText> · Uthmani Arabic · M. M.\n                          Pickthall (1930) · Page {String(result.ayah.page)}\n                        </dd>\n`,
  'Offline source metadata direction',
);
reader = replaceExact(
  reader,
  `                        <p>{curated.tafsirSummary}</p>\n                        <small>{tafsirSource.title}</small>\n`,
  `                        <p\n                          data-quran-tafsir-summary\n                          lang={curated.tafsirSummaryPresentation.lang}\n                          dir={curated.tafsirSummaryPresentation.dir}\n                        >\n                          {curated.tafsirSummary}\n                        </p>\n                        <small\n                          lang={tafsirSource.displayPresentation.lang}\n                          dir={tafsirSource.displayPresentation.dir}\n                        >\n                          {tafsirSource.title}\n                        </small>\n`,
  'Offline tafsir direction',
);
reader = replaceExact(
  reader,
  `                            >\n                              Qur’an {verseKey}\n                            </button>\n`,
  `                              data-quran-related-reference\n                              lang={quranOfflineReferencePresentation.lang}\n                              dir={quranOfflineReferencePresentation.dir}\n                            >\n                              Qur’an <BidiText>{verseKey}</BidiText>\n                            </button>\n`,
  'Offline related reference direction',
);
await write('src/ui/QuranOfflineReader.tsx', reader);

await write(
  'src/ui/KnowledgeTextDirection.test.tsx',
  `import { readFileSync } from 'node:fs';\nimport { renderToStaticMarkup } from 'react-dom/server';\nimport { beforeAll, describe, expect, it } from 'vitest';\n\nimport { initializeApplicationStorage } from '../platform/applicationStorage';\nimport {\n  defaultPersistedSettings,\n  SETTINGS_STORAGE_KEY,\n  type KeyValueStorage,\n} from '../platform/settingsStorage';\nimport { KnowledgeScreen } from './KnowledgeScreen';\n\nclass MemoryStorage implements KeyValueStorage {\n  private readonly values = new Map<string, string>();\n\n  getItem(key: string): string | null {\n    return this.values.get(key) ?? null;\n  }\n\n  setItem(key: string, value: string): void {\n    this.values.set(key, value);\n  }\n\n  removeItem(key: string): void {\n    this.values.delete(key);\n  }\n}\n\nfunction openingTagsContaining(source: string, marker: string): readonly string[] {\n  return [...source.matchAll(/<[^>]+>/gu)]\n    .map((match) => match[0])\n    .filter((tag) => tag.includes(marker));\n}\n\ndescribe('Knowledge text direction', () => {\n  beforeAll(async () => {\n    const storage = new MemoryStorage();\n    storage.setItem(\n      SETTINGS_STORAGE_KEY,\n      JSON.stringify({ ...defaultPersistedSettings, locale: 'ar' }),\n    );\n    await initializeApplicationStorage(storage);\n  });\n\n  it('keeps source-language content independent of the Arabic UI direction', () => {\n    const markup = renderToStaticMarkup(<KnowledgeScreen />);\n\n    expect(markup).toMatch(\n      /<p(?=[^>]*data-quran-translation)(?=[^>]*lang="en")(?=[^>]*dir="ltr")[^>]*>/u,\n    );\n    expect(markup).toMatch(\n      /<p(?=[^>]*class="knowledge-card__arabic")(?=[^>]*lang="ar")(?=[^>]*dir="rtl")[^>]*>/u,\n    );\n    expect(markup).toContain('<bdi dir="auto">Qur’an 2:45</bdi>');\n  });\n\n  it('prevents translation, tafsir, source metadata and related-reference elements from inheriting direction implicitly', () => {\n    const checks = [\n      ['KnowledgeScreen.tsx', ['data-quran-translation', 'data-quran-tafsir-summary', 'data-knowledge-source-metadata', 'data-quran-related-reference']],\n      ['KnowledgeStage7Details.tsx', ['data-hadith-translation', 'data-knowledge-source-metadata', 'data-hadith-related-reference']],\n      ['QuranOfflineReader.tsx', ['data-quran-offline-translation', 'data-quran-tafsir-summary', 'data-knowledge-source-metadata', 'data-quran-related-reference']],\n    ] as const;\n\n    for (const [file, markers] of checks) {\n      const source = readFileSync(new URL(\`./\${file}\`, import.meta.url), 'utf8');\n      for (const marker of markers) {\n        const tags = openingTagsContaining(source, marker);\n        expect(tags.length, \`\${file} must render \${marker}\`).toBeGreaterThan(0);\n        for (const tag of tags) {\n          expect(tag, \`\${file} \${marker} needs lang\`).toContain('lang=');\n          expect(tag, \`\${file} \${marker} needs dir\`).toContain('dir=');\n        }\n      }\n    }\n  });\n});\n`,
);

console.log('Applied v1.5.3 Work Item 3 text-direction patch.');
