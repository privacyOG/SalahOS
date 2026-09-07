from pathlib import Path

reader_path = Path('src/ui/QuranOfflineReader.tsx')
reader = reader_path.read_text()

old_import = "import { Fragment, useEffect, useMemo, useState } from 'react';"
new_import = "import { Fragment, useEffect, useMemo, useRef, useState } from 'react';"
if old_import not in reader:
    raise SystemExit('React import marker drifted')
reader = reader.replace(old_import, new_import, 1)

state_marker = "  const [searchReturnQuery, setSearchReturnQuery] = useState<string | null>(null);\n"
ref_state = """  const [searchReturnQuery, setSearchReturnQuery] = useState<string | null>(null);
  const preservedSearchNavigationRef = useRef<{ verseKey: string; query: string } | null>(null);
"""
if state_marker not in reader:
    raise SystemExit('search return state marker drifted')
reader = reader.replace(state_marker, ref_state, 1)

effect_marker = """    setBookmarksOnly(false);
    setSearch('');
    setSearchReturnQuery(null);
    setSelectedSurah(target.surah.surah);
"""
effect_replacement = """    const preservedNavigation = preservedSearchNavigationRef.current;
    const preserveSearchReturn = preservedNavigation?.verseKey === initialVerseKey;
    preservedSearchNavigationRef.current = null;
    setBookmarksOnly(false);
    setSearch('');
    if (preserveSearchReturn) {
      setSearchReturnQuery(preservedNavigation.query);
    } else {
      setSearchReturnQuery(null);
    }
    setSelectedSurah(target.surah.surah);
"""
if effect_marker not in reader:
    raise SystemExit('initialVerseKey reset marker drifted')
reader = reader.replace(effect_marker, effect_replacement, 1)

jump_marker = """    if (preserveSearchContext && search.trim().length > 0) {
      setSearchReturnQuery(search);
    } else {
      setSearchReturnQuery(null);
    }
"""
jump_replacement = """    if (preserveSearchContext && search.trim().length > 0) {
      setSearchReturnQuery(search);
      preservedSearchNavigationRef.current = onVerseNavigate ? { verseKey, query: search } : null;
    } else {
      setSearchReturnQuery(null);
      preservedSearchNavigationRef.current = null;
    }
"""
if jump_marker not in reader:
    raise SystemExit('jump search context marker drifted')
reader = reader.replace(jump_marker, jump_replacement, 1)
reader_path.write_text(reader)

test_path = Path('src/ui/QuranReaderUxV160.test.ts')
test = test_path.read_text()
test_marker = """    expect(reader).toContain('setSearchReturnQuery(search)');
    expect(reader.match(/jumpToVerse\\(verseKey, true\\)/gu)).toHaveLength(2);
"""
test_replacement = """    expect(reader).toContain('setSearchReturnQuery(search)');
    expect(reader).toContain('preservedSearchNavigationRef');
    expect(reader).toContain('preservedNavigation?.verseKey === initialVerseKey');
    expect(reader).toContain('setSearchReturnQuery(preservedNavigation.query)');
    expect(reader.match(/jumpToVerse\\(verseKey, true\\)/gu)).toHaveLength(2);
"""
if test_marker not in test:
    raise SystemExit('Quran UX regression marker drifted')
test_path.write_text(test.replace(test_marker, test_replacement, 1))
