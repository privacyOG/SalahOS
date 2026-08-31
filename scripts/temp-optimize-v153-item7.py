from pathlib import Path
import re

path = Path('src/ui/KnowledgeScreen.tsx')
text = path.read_text(encoding='utf-8')

text = text.replace('  type QuranKnowledgeEntry,\n', '')
text = text.replace("import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';\n", '')
text = text.replace("import { BidiText } from './BidiText';\n", '')
text = re.sub(
    r"import \{\n  loadQuranReadingPreferences,[\s\S]*?\} from '../platform/quranReadingPreferences';\n",
    '',
    text,
    count=1,
)

remove_fields = [
    'quran', 'source', 'collection', 'grade', 'gradedBy', 'scholar',
    'quranReader', 'translation', 'pickthall', 'arabicOnly', 'arabicFont',
    'fontAmiri', 'fontSystem', 'fontSize', 'sizeCompact', 'sizeComfortable',
    'sizeLarge', 'sizeXLarge', 'bookmarks', 'bookmarksOnly', 'allAyat', 'resume',
    'markLastRead', 'bookmarked', 'bookmark', 'removeBookmark', 'share', 'shared',
    'shareFailed', 'tafsir', 'tafsirSummary', 'relatedAyat', 'topics',
]
for key in remove_fields:
    text = re.sub(rf"^  {re.escape(key)}: string;\n", '', text, flags=re.MULTILINE)
    text = re.sub(
        rf"^    {re.escape(key)}: (?:'[^']*'|\"[^\"]*\"),\n",
        '',
        text,
        flags=re.MULTILINE,
    )

start = text.find('function shareTextForAyah(')
end = text.find('function KnowledgeEntryCard(', start)
if start < 0 or end < 0:
    raise SystemExit('retired Qur\'an helper block not found')
text = text[:start] + text[end:]

card_start = text.find('function KnowledgeEntryCard(')
card_end = text.find('\nexport function KnowledgeScreen', card_start)
if card_start < 0 or card_end < 0:
    raise SystemExit('KnowledgeEntryCard block not found')
card = r'''function KnowledgeEntryCard({
  entry,
  labels,
  locale,
  onSearchHadithTopic,
  onNavigateHadith,
}: Readonly<{
  entry: Exclude<IslamicKnowledgeEntry, { readonly module: 'quran' }>;
  labels: KnowledgeCopy;
  locale: Locale;
  onSearchHadithTopic: (topic: string) => void;
  onNavigateHadith: (entryId: string) => void;
}>) {
  if (entry.module === 'hadith') {
    return (
      <article className="knowledge-card knowledge-card--hadith" data-knowledge-module="hadith">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.hadith}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <HadithStage7Details
          entry={entry}
          locale={locale}
          onSearchTopic={onSearchHadithTopic}
          onNavigateHadith={onNavigateHadith}
        />
      </article>
    );
  }

  return (
    <article
      className="knowledge-card knowledge-card--fiqh"
      data-knowledge-module="qa"
      data-knowledge-content-type={entry.contentType}
    >
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">
          {entry.contentType === 'fiqh' ? labels.fiqh : labels.qa}
        </span>
        <span className="knowledge-offline">{labels.offline}</span>
      </div>
      <h3>{entry.question}</h3>
      {entry.contentType === 'fiqh' ? (
        <FiqhStage7Details entry={entry} locale={locale} />
      ) : (
        <p>{entry.answer}</p>
      )}
    </article>
  );
}
'''
text = text[:card_start] + card + text[card_end:]

text = text.replace(
    "}: Readonly<{ scope?: 'library' | 'quran' | 'hadith' }>) {",
    "}: Readonly<{ scope?: 'library' | 'hadith' }>) {",
    1,
)
text = text.replace(
    "    scope === 'hadith' ? 'hadith' : scope === 'quran' ? 'quran' : 'all',",
    "    scope === 'hadith' ? 'hadith' : 'all',",
    1,
)
text = text.replace("  const [bookmarksOnly, setBookmarksOnly] = useState(false);\n", '')
text = text.replace("  const [shareStatus, setShareStatus] = useState('');\n", '')
text = re.sub(
    r"  const \[quranPreferences, setQuranPreferences\][\s\S]*?\n  \);\n",
    '',
    text,
    count=1,
)

old_scope = """    const surfaceScoped =\n      scope === 'hadith'\n        ? scoped.filter((entry) => entry.module === 'hadith')\n        : scope === 'quran'\n          ? scoped.filter((entry) => entry.module === 'quran')\n          : scoped.filter((entry) => entry.module !== 'quran' && entry.module !== 'hadith');\n    return surfaceScoped;\n"""
new_scope = """    return scope === 'hadith'\n      ? scoped.filter((entry) => entry.module === 'hadith')\n      : scoped.filter(\n          (entry): entry is Exclude<IslamicKnowledgeEntry, { readonly module: 'quran' }> =>\n            entry.module !== 'quran' && entry.module !== 'hadith',\n        );\n"""
if old_scope not in text:
    raise SystemExit('scope block not found')
text = text.replace(old_scope, new_scope, 1)

text = re.sub(
    r"\n  const persistQuranPreferences = \(next: QuranReadingPreferences\): void => \{[\s\S]*?\n  const filters:",
    "\n  const filters:",
    text,
    count=1,
)
text = text.replace("    scope === 'hadith' || scope === 'quran'\n", "    scope === 'hadith'\n", 1)
text = re.sub(
    r"\n  const resumeEntry = quranPreferences\.lastReadAyahId[\s\S]*?\n    : null;\n",
    '\n',
    text,
    count=1,
)

text = re.sub(
    r"\n      \{module === 'quran' \? \([\s\S]*?\n      \) : null\}\n\n      \{shareStatus \? \([\s\S]*?\n      \) : null\}\n",
    '\n',
    text,
    count=1,
)
text = text.replace("                  if (filter.id !== 'quran') setBookmarksOnly(false);\n", '')

invoke_start = text.find('            <KnowledgeEntryCard')
invoke_end = text.find('            />', invoke_start)
if invoke_start < 0 or invoke_end < 0:
    raise SystemExit('KnowledgeEntryCard invocation not found')
invoke_end += len('            />')
invocation = r'''            <KnowledgeEntryCard
              key={entry.id}
              entry={entry}
              labels={labels}
              locale={locale}
              onSearchHadithTopic={(topic) => {
                setModule('hadith');
                setQuery(topic);
              }}
              onNavigateHadith={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'hadith') return;
                setModule('hadith');
                setQuery(related.reference);
              }}
            />'''
text = text[:invoke_start] + invocation + text[invoke_end:]

path.write_text(text, encoding='utf-8')

test_path = Path('src/ui/KnowledgeTextDirection.test.tsx')
test = test_path.read_text(encoding='utf-8')
test = test.replace("import { renderToStaticMarkup } from 'react-dom/server';\n", '')
test = test.replace("import { beforeAll, describe, expect, it } from 'vitest';\n", "import { describe, expect, it } from 'vitest';\n")
imports_start = test.find("\nimport { initializeApplicationStorage }")
imports_end = test.find("\n\nclass MemoryStorage", imports_start)
if imports_start >= 0 and imports_end >= 0:
    test = test[:imports_start] + test[imports_end:]
class_start = test.find('class MemoryStorage')
helper_start = test.find('function openingTagsContaining', class_start)
if class_start >= 0 and helper_start >= 0:
    test = test[:class_start] + test[helper_start:]
before_start = test.find('  beforeAll(')
first_test = test.find("  it('keeps source-language content", before_start)
if before_start >= 0 and first_test >= 0:
    test = test[:before_start] + test[first_test:]
old_first_start = test.find("  it('keeps source-language content")
second_test = test.find("  it('prevents translation", old_first_start)
if old_first_start < 0 or second_test < 0:
    raise SystemExit('directionality test blocks not found')
new_first = r'''  it('keeps source-language content independent of the Arabic UI direction in the production Qur’an reader', () => {
    const source = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');
    const translationTags = openingTagsContaining(source, 'data-quran-offline-translation');
    const arabicTags = openingTagsContaining(source, 'data-quran-font');

    expect(translationTags.length).toBeGreaterThan(0);
    expect(translationTags.every((tag) => tag.includes('lang=') && tag.includes('dir='))).toBe(true);
    expect(arabicTags.length).toBeGreaterThan(0);
    expect(
      arabicTags.every((tag) => tag.includes('lang="ar"') && tag.includes('dir="rtl"')),
    ).toBe(true);
    expect(source).toContain('<BidiText>{result.ayah.key}</BidiText>');
  });

'''
test = test[:old_first_start] + new_first + test[second_test:]
knowledge_check_start = test.find("      [\n        'KnowledgeScreen.tsx',")
knowledge_check_end = test.find("      ],\n", knowledge_check_start)
if knowledge_check_start >= 0 and knowledge_check_end >= 0:
    knowledge_check_end += len("      ],\n")
    test = test[:knowledge_check_start] + test[knowledge_check_end:]
test_path.write_text(test, encoding='utf-8')
