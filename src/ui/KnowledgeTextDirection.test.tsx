import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import { initializeApplicationStorage } from '../platform/applicationStorage';
import {
  defaultPersistedSettings,
  SETTINGS_STORAGE_KEY,
  type KeyValueStorage,
} from '../platform/settingsStorage';
import { KnowledgeScreen } from './KnowledgeScreen';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

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
  beforeAll(async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...defaultPersistedSettings, locale: 'ar' }),
    );
    await initializeApplicationStorage(storage);
  });

  it('keeps source-language content independent of the Arabic UI direction', () => {
    const markup = renderToStaticMarkup(<KnowledgeScreen scope="quran" />);

    expect(markup).toMatch(
      /<p(?=[^>]*data-quran-translation)(?=[^>]*lang="en")(?=[^>]*dir="ltr")[^>]*>/u,
    );
    expect(markup).toMatch(
      /<p(?=[^>]*class="knowledge-card__arabic")(?=[^>]*lang="ar")(?=[^>]*dir="rtl")[^>]*>/u,
    );
    expect(markup).toContain('<bdi dir="auto">Qur’an 2:45</bdi>');
  });

  it('prevents translation, tafsir, source metadata and related-reference elements from inheriting direction implicitly', () => {
    const checks = [
      [
        'KnowledgeScreen.tsx',
        [
          'data-quran-translation',
          'data-quran-tafsir-summary',
          'data-knowledge-source-metadata',
          'data-quran-related-reference',
        ],
      ],
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
