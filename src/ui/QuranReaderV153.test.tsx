import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { formatQuranAyahNumber } from './QuranOfflineReader';

const experienceSource = readFileSync(
  new URL('./KnowledgeExperience.tsx', import.meta.url),
  'utf8',
);
const readerSource = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');

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
});
