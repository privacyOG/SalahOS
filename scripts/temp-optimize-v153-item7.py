from pathlib import Path
import re

path = Path('src/ui/KnowledgeScreen.tsx')
text = path.read_text(encoding='utf-8')

# Remove Qur'an-only imports now superseded by QuranOfflineReader.
text = text.replace('  type QuranKnowledgeEntry,\n', '')
text = text.replace("import { BidiText } from './BidiText';\n", '')
text = re.sub(
    r"import \{\n  loadQuranReadingPreferences,[\s\S]*?\} from '../platform/quranReadingPreferences';\n",
    '',
    text,
    count=1,
)

# Remove Qur'an-only copy fields.
quran_fields = [
    '  quran: string;\n',
    '  quranReader: string;\n',
    '  translation: string;\n',
    '  pickthall: string;\n',
    '  arabicOnly: string;\n',
    '  arabicFont: string;\n',
    '  fontAmiri: string;\n',
    '  fontSystem: string;\n',
    '  fontSize: string;\n',
    '  sizeCompact: string;\n',
    '  sizeComfortable: string;\n',
    '  sizeLarge: string;\n',
    '  sizeXLarge: string;\n',
    '  bookmarks: string;\n',
    '  bookmarksOnly: string;\n',
    '  allAyat: string;\n',
    '  resume: string;\n',
    '  markLastRead: string;\n',
    '  bookmarked: string;\n',
    '  bookmark: string;\n',
    '  removeBookmark: string;\n',
    '  share: string;\n',
    '  shared: string;\n',
    '  shareFailed: string;\n',
    '  tafsir: string;\n',
    '  tafsirSummary: string;\n',
    '  relatedAyat: string;\n',
    '  topics: string;\n',
]
for field in quran_fields:
    text = text.replace(field, '')

# Remove Qur'an-only localized values from each locale block.
quran_keys = [
    'quran', 'quranReader', 'translation', 'pickthall', 'arabicOnly', 'arabicFont',
    'fontAmiri', 'fontSystem', 'fontSize', 'sizeCompact', 'sizeComfortable', 'sizeLarge',
    'sizeXLarge', 'bookmarks', 'bookmarksOnly', 'allAyat', 'resume', 'markLastRead',
    'bookmarked', 'bookmark', 'removeBookmark', 'share', 'shared', 'shareFailed', 'tafsir',
    'tafsirSummary', 'relatedAyat', 'topics',
]
for key in quran_keys:
    text = re.sub(rf"^    {re.escape(key)}: (?:'[^']*'|\"[^\"]*\"),\n", '', text, flags=re.MULTILINE)

# Remove retired curated Qur'an helper/card implementation.
start = text.find('function shareTextForAyah(')
end = text.find('function KnowledgeEntryCard(', start)
if start < 0 or end < 0:
    raise SystemExit('retired Qur\'an helper block not found')
text = text[:start] + text[end:]

# Simplify KnowledgeEntryCard to non-Qur'an entries only.
text = re.sub(
    r"function KnowledgeEntryCard\(\{[\s\S]*?\n\}\) \{\n  if \(entry\.module === 'quran'\) \{[\s\S]*?\n  \}\n\n  if \(entry\.module === 'hadith'\)",
    "function KnowledgeEntryCard({\n  entry,\n  labels,\n  locale,\n  onSearchHadithTopic,\n  onNavigateHadith,\n}: Readonly<{\n  entry: Exclude<IslamicKnowledgeEntry, { readonly module: 'quran' }>;\n  labels: KnowledgeCopy;\n  locale: Locale;\n  onSearchHadithTopic: (topic: string) => void;\n  onNavigateHadith: (entryId: string) => void;\n}>) {\n  if (entry.module === 'hadith')",
    text,
    count=1,
)

# Scope no longer exposes a hidden Qur'an renderer.
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

# Remove preference mutation helpers and resume state.
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

# Remove retired Qur'an controls and share status from rendered screen.
text = re.sub(
    r"\n      \{module === 'quran' \? \([\s\S]*?\n      \) : null\}\n\n      \{shareStatus \? \([\s\S]*?\n      \) : null\}\n",
    '\n',
    text,
    count=1,
)
text = text.replace("                  if (filter.id !== 'quran') setBookmarksOnly(false);\n", '')

# Remove retired Qur'an props/callbacks from card call; keep Hadith navigation.
text = re.sub(r"\n              quranPreferences=\{quranPreferences\}", '', text, count=1)
text = re.sub(
    r"\n              onToggleBookmark=\{\(entryId\) => \{[\s\S]*?\n              \}\}\n              onMarkLastRead=\{\(entryId\) => \{[\s\S]*?\n              \}\}\n              onOpenRelated=\{\(entryId\) => \{[\s\S]*?\n              \}\}",
    '',
    text,
    count=1,
)
text = text.replace("                setBookmarksOnly(false);\n", '')
text = text.replace("              onShareStatus={setShareStatus}\n", '')

path.write_text(text, encoding='utf-8')

# Retarget the Item 3 directionality acceptance to the actual production Qur'an reader.
test_path = Path('src/ui/KnowledgeTextDirection.test.tsx')
test = test_path.read_text(encoding='utf-8')
test = re.sub(r"import \{ renderToStaticMarkup \} from 'react-dom/server';\n", '', test)
test = re.sub(r"import \{ beforeAll, describe, expect, it \} from 'vitest';\n", "import { describe, expect, it } from 'vitest';\n", test)
test = re.sub(r"\nimport \{ initializeApplicationStorage \}[\s\S]*?import \{ KnowledgeScreen \} from './KnowledgeScreen';\n", '\n', test, count=1)
test = re.sub(r"\nclass MemoryStorage[\s\S]*?\n\}\n\n", '\n', test, count=1)
test = re.sub(r"\n  beforeAll\([\s\S]*?\n  \}\);\n", '\n', test, count=1)
old_first = """  it('keeps source-language content independent of the Arabic UI direction', () => {\n    const markup = renderToStaticMarkup(<KnowledgeScreen scope=\"quran\" />);\n\n    expect(markup).toMatch(\n      /<p(?=[^>]*data-quran-translation)(?=[^>]*lang=\"en\")(?=[^>]*dir=\"ltr\")[^>]*>/u,\n    );\n    expect(markup).toMatch(\n      /<p(?=[^>]*class=\"knowledge-card__arabic\")(?=[^>]*lang=\"ar\")(?=[^>]*dir=\"rtl\")[^>]*>/u,\n    );\n    expect(markup).toContain('<bdi dir=\"auto\">Qur’an 2:45</bdi>');\n  });\n"""
new_first = """  it('keeps source-language content independent of the Arabic UI direction in the production Qur’an reader', () => {\n    const source = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');\n    const translationTags = openingTagsContaining(source, 'data-quran-offline-translation');\n    const arabicTags = openingTagsContaining(source, 'data-quran-font');\n\n    expect(translationTags.length).toBeGreaterThan(0);\n    expect(translationTags.every((tag) => tag.includes('lang=') && tag.includes('dir='))).toBe(true);\n    expect(arabicTags.length).toBeGreaterThan(0);\n    expect(arabicTags.every((tag) => tag.includes('lang=\"ar\"') && tag.includes('dir=\"rtl\"'))).toBe(true);\n    expect(source).toContain('<BidiText>{result.ayah.key}</BidiText>');\n  });\n"""
if old_first not in test:
    raise SystemExit('directionality render test block not found')
test = test.replace(old_first, new_first, 1)
# KnowledgeScreen no longer renders Qur'an; enforce markers only where Qur'an/Hadith are actually rendered.
test = re.sub(
    r"      \[\n        'KnowledgeScreen\.tsx',[\s\S]*?\n      \],\n",
    '',
    test,
    count=1,
)
test_path.write_text(test, encoding='utf-8')
