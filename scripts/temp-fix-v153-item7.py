from pathlib import Path

path = Path('src/ui/KnowledgeScreen.tsx')
text = path.read_text(encoding='utf-8')
old = """    if (!bookmarksOnly) return surfaceScoped;\n    return surfaceScoped.filter(\n      (entry) => entry.module === 'quran' && quranPreferences.bookmarkedAyahIds.includes(entry.id),\n    );\n  }, [bookmarksOnly, module, query, quranPreferences.bookmarkedAyahIds, scope]);\n"""
new = """    return surfaceScoped;\n  }, [module, query, scope]);\n"""
if old not in text:
    raise SystemExit('expected scoped bookmark block not found')
text = text.replace(old, new, 1)
text = text.replace(
    "}: Readonly<{ scope?: 'library' | 'hadith' }>) {",
    "}: Readonly<{ scope?: 'library' | 'quran' | 'hadith' }>) {",
    1,
)
text = text.replace(
    "    scope === 'hadith' ? 'hadith' : 'all',",
    "    scope === 'hadith' ? 'hadith' : scope === 'quran' ? 'quran' : 'all',",
    1,
)
text = text.replace(
    "    const surfaceScoped =\n      scope === 'hadith'\n        ? scoped.filter((entry) => entry.module === 'hadith')\n        : scoped.filter((entry) => entry.module !== 'quran' && entry.module !== 'hadith');",
    "    const surfaceScoped =\n      scope === 'hadith'\n        ? scoped.filter((entry) => entry.module === 'hadith')\n        : scope === 'quran'\n          ? scoped.filter((entry) => entry.module === 'quran')\n          : scoped.filter((entry) => entry.module !== 'quran' && entry.module !== 'hadith');",
    1,
)
text = text.replace(
    "    scope === 'hadith'\n      ? []",
    "    scope === 'hadith' || scope === 'quran'\n      ? []",
    1,
)
path.write_text(text, encoding='utf-8')

reader = Path('src/ui/QuranOfflineReader.tsx')
reader_text = reader.read_text(encoding='utf-8')
reader_text = reader_text.replace('  type QuranReadingMode,\n', '', 1)
reader_text = reader_text.replace(
    '<p>\n                {labels.provenance}',
    '<p data-knowledge-source-metadata lang={locale} dir={locale === \'ar\' ? \'rtl\' : \'ltr\'}>\n                {labels.provenance}',
    1,
)
reader.write_text(reader_text, encoding='utf-8')

test = Path('src/ui/KnowledgeTextDirection.test.tsx')
test_text = test.read_text(encoding='utf-8')
test_text = test_text.replace(
    'const markup = renderToStaticMarkup(<KnowledgeScreen />);',
    'const markup = renderToStaticMarkup(<KnowledgeScreen scope="quran" />);',
    1,
)
test.write_text(test_text, encoding='utf-8')
