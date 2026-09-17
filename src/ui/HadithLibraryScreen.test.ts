import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  NAWAWI_COLLECTION_AUTHOR,
  NAWAWI_COLLECTION_TITLE,
  nawawiHadithEntries,
} from '../domain/nawawiHadithCollection';

const screen = readFileSync(new URL('./HadithLibraryScreen.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../hadith-library.css', import.meta.url), 'utf8');

describe('Hadith scholar and collection library', () => {
  it('preserves every numbered entry in the supplied Nawawi document', () => {
    expect(NAWAWI_COLLECTION_AUTHOR).toBe('Imam al-Nawawi');
    expect(NAWAWI_COLLECTION_TITLE).toBe('The Forty Nawawi Hadiths');
    expect(nawawiHadithEntries).toHaveLength(42);
    expect(nawawiHadithEntries[0]?.title).toBe('The First Hadith');
    expect(nawawiHadithEntries[41]?.title).toBe('The Forty Second Hadith');
  });

  it('keeps Arabic passages as explicit RTL blocks', () => {
    const arabicBlocks = nawawiHadithEntries.flatMap((entry) =>
      entry.blocks.filter((block) => block.kind === 'arabic'),
    );
    expect(arabicBlocks.length).toBeGreaterThanOrEqual(4);
    expect(screen).toContain('data-hadith-library-arabic');
    expect(screen).toContain('lang="ar"');
    expect(screen).toContain('dir="rtl"');
    expect(css).toMatch(
      /\.hadith-library__arabic\[lang='ar'\]\[dir='rtl'\][^{]*\{[^}]*direction:\s*rtl;[^}]*text-align:\s*right;[^}]*text-align-last:\s*right;/su,
    );
  });

  it('supports scholar, collection and free-text discovery', () => {
    expect(screen).toContain('data-hadith-library-search');
    expect(screen).toContain('data-hadith-scholar-select');
    expect(screen).toContain('data-hadith-collection-select');
    expect(screen).toContain('record.author');
    expect(screen).toContain('record.collection');
    expect(screen).toContain('record.blocks.map((block) => block.text)');
    expect(screen).toContain("name: 'Imam al-Bukhari'");
    expect(screen).toContain("name: 'Imam Muslim'");
  });

  it('uses responsive, accessible controls without hard-coded colours', () => {
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('@media (max-width: 760px)');
    expect(css).toContain('var(--salah-focus-ring)');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/iu);
  });
});
