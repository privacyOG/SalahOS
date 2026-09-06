import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  formatQuranAyahNumber,
  formatQuranResultsStatus,
  formatQuranUiNumber,
  formatQuranVerseReference,
} from './QuranOfflineReader';

const experienceSource = readFileSync(
  new URL('./KnowledgeExperience.tsx', import.meta.url),
  'utf8',
);
const readerSource = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const manifestSource = readFileSync(
  new URL('../../public/manifest.webmanifest', import.meta.url),
  'utf8',
);

describe('v1.5.3 Qur’an reader architecture', () => {
  it('renders Library, Qur’an and Hadith as mutually exclusive Knowledge views', () => {
    expect(experienceSource).toContain(
      'view === \'library\' ? <KnowledgeScreen scope="library" /> : null',
    );
    expect(experienceSource).toContain(
      'view === \'hadith\' ? <KnowledgeScreen scope="hadith" /> : null',
    );
    expect(experienceSource).toContain("view === 'quran' ? (");
    expect(experienceSource).toContain('data-knowledge-view-select');
  });

  it('uses Arabic-Indic numbers for end-of-ayah markers', () => {
    expect(formatQuranAyahNumber(255)).toBe('٢٥٥');
    expect(readerSource).toContain('quran-offline-ayah__marker');
  });

  it('keeps ayah actions outside the individual reading article and exposes page mode', () => {
    expect(readerSource).toContain('className="quran-ayah-utility"');
    expect(readerSource).toContain("['page', labels.pageMode]");
    expect(readerSource).toContain('data-quran-reader-provenance');
    expect(readerSource).toContain('data-quran-surah-header');
    expect(readerSource).toContain('data-quran-basmala');
  });

  it('announces concise result status instead of making the ayah content list live', () => {
    const ayahListOpeningTag = /<div\s+className=\{`quran-offline-reader__ayat[\s\S]*?\}>/u.exec(
      readerSource,
    )?.[0];

    expect(ayahListOpeningTag).toBeDefined();
    expect(ayahListOpeningTag).not.toContain('aria-live');
    expect(readerSource).toContain('data-quran-results-status');
    expect(formatQuranResultsStatus(12, 'en')).toBe('Showing 12 ayat');
  });

  it('localizes dynamic Qur’an metadata numbers and verse references with Intl.NumberFormat', () => {
    expect(formatQuranUiNumber(604, 'tr')).toBe(
      new Intl.NumberFormat('tr', { useGrouping: false }).format(604),
    );
    expect(formatQuranVerseReference('2:255', 'id')).toBe(
      `${formatQuranUiNumber(2, 'id')}:${formatQuranUiNumber(255, 'id')}`,
    );
    expect(readerSource).not.toContain('· Juz {String(result.ayah.juz)}');
    expect(readerSource).toContain('{labels.juz} {formatQuranUiNumber(result.ayah.juz, locale)}');
    expect(readerSource).toContain('data-quran-related-label');
  });

  it('shows Tanzil attribution and routes its in-app link through the reviewed platform boundary', () => {
    expect(readerSource).toContain('data-quran-tanzil-attribution');
    expect(readerSource).toContain('href={quranTanzilSourceUrl()}');
    expect(readerSource).toContain('tanzilSource:');
  });

  it('aligns browser and install theme colors with the design-system canvas', () => {
    expect(indexSource).toContain('<meta name="theme-color" content="#0a100c" />');
    expect(indexSource).toContain(
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f7f3" />',
    );
    const manifest = JSON.parse(manifestSource) as {
      background_color: string;
      theme_color: string;
    };
    expect(manifest.background_color).toBe('#0a100c');
    expect(manifest.theme_color).toBe('#0a100c');
  });
});
