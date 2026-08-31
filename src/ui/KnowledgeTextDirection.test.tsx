import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function openingTagsContaining(source: string, marker: string): readonly string[] {
  const pattern = new RegExp(`\\b${marker}(?:\\s|=|>)`, 'gu');
  return [...source.matchAll(pattern)]
    .map((match) => {
      const markerOffset = match.index;
      const start = source.lastIndexOf('<', markerOffset);
      const end = source.indexOf('>', markerOffset);
      return start >= 0 && end > start ? source.slice(start, end + 1) : '';
    })
    .filter(Boolean);
}

describe('Knowledge text direction', () => {
  it('keeps source-language content independent of the Arabic UI direction in the production Qur’an reader', () => {
    const source = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');
    const translationTags = openingTagsContaining(source, 'data-quran-offline-translation');
    const arabicTags = openingTagsContaining(source, 'data-quran-font');

    expect(translationTags.length).toBeGreaterThan(0);
    expect(translationTags.every((tag) => tag.includes('lang=') && tag.includes('dir='))).toBe(
      true,
    );
    expect(arabicTags.length).toBeGreaterThan(0);
    expect(arabicTags.every((tag) => tag.includes('lang="ar"') && tag.includes('dir="rtl"'))).toBe(
      true,
    );
    expect(source).toContain('<BidiText>{result.ayah.key}</BidiText>');
  });

  it('prevents translation, tafsir, source metadata and related-reference elements from inheriting direction implicitly', () => {
    const checks = [
      [
        'KnowledgeStage7Details.tsx',
        [
          'data-hadith-translation',
          'data-knowledge-source-metadata',
          'data-hadith-related-reference',
        ],
      ],
      [
        'QuranOfflineReader.tsx',
        [
          'data-quran-offline-translation',
          'data-quran-tafsir-summary',
          'data-knowledge-source-metadata',
          'data-quran-related-reference',
        ],
      ],
    ] as const;

    for (const [file, markers] of checks) {
      const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
      for (const marker of markers) {
        const tags = openingTagsContaining(source, marker);
        expect(tags.length, `${file} must render ${marker}`).toBeGreaterThan(0);
        for (const tag of tags) {
          expect(tag, `${file} ${marker} needs lang`).toContain('lang=');
          expect(tag, `${file} ${marker} needs dir`).toContain('dir=');
        }
      }
    }
  });
});
