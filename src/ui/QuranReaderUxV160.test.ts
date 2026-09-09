import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const reader = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../quran-reader-disclosures.css', import.meta.url), 'utf8');
const visual = readFileSync(
  new URL('../../scripts/visual-quran-offline-reader.mjs', import.meta.url),
  'utf8',
);

describe('V1.6.0 Qur’an reader UX', () => {
  it('puts secondary navigation and reading preferences behind explicit disclosures', () => {
    expect(reader).toContain('data-quran-navigation-disclosure');
    expect(reader).toContain('data-quran-preferences-disclosure');
    expect(reader).toContain('{labels.navigation}');
    expect(reader).toContain('{labels.readingPreferences}');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('var(--salah-focus-ring)');
  });

  it('preserves a search-return path when following a related ayah', () => {
    expect(reader).toContain('const [searchReturnQuery, setSearchReturnQuery]');
    expect(reader).toContain('setSearchReturnQuery(search)');
    expect(reader).toContain('preservedSearchNavigationRef');
    expect(reader).toContain('preservedNavigation?.verseKey === initialVerseKey');
    expect(reader).toContain(
      'setSearchReturnQuery(preserveSearchReturn ? preservedNavigation.query : null)',
    );
    expect(reader.match(/jumpToVerse\(verseKey, true\)/gu)).toHaveLength(1);
    expect(reader).toContain('data-quran-return-to-search');
    expect(reader).toContain('setSearch(searchReturnQuery)');
    expect(visual).toContain('data-quran-return-to-search');
  });

  it('describes page grouping without implying a facsimile and preserves core actions/RTL', () => {
    expect(reader).toContain('data-quran-page-grouping-note');
    expect(reader).toContain('this is not a facsimile page');
    expect(reader).toContain('data-quran-offline-bookmark');
    expect(reader).toContain('data-quran-offline-last-read');
    expect(reader).toContain('data-quran-offline-share');
    expect(reader).toContain('lang="ar"');
    expect(reader).toContain('dir="rtl"');
  });

  it('keeps the disclosure layer semantic rather than hard-coding palette colours', () => {
    expect(css).toContain('var(--salah-bg-muted)');
    expect(css).toContain('var(--salah-border-subtle)');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/iu);
  });
});
