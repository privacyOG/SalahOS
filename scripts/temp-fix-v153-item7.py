from pathlib import Path

path = Path('src/ui/KnowledgeScreen.tsx')
text = path.read_text(encoding='utf-8')
old = """    if (!bookmarksOnly) return surfaceScoped;\n    return surfaceScoped.filter(\n      (entry) => entry.module === 'quran' && quranPreferences.bookmarkedAyahIds.includes(entry.id),\n    );\n  }, [bookmarksOnly, module, query, quranPreferences.bookmarkedAyahIds, scope]);\n"""
new = """    return surfaceScoped;\n  }, [module, query, scope]);\n"""
if old not in text:
    raise SystemExit('expected scoped bookmark block not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')

reader = Path('src/ui/QuranOfflineReader.tsx')
reader_text = reader.read_text(encoding='utf-8')
reader_text = reader_text.replace('  type QuranReadingMode,\n', '', 1)
reader.write_text(reader_text, encoding='utf-8')
