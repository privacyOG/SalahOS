import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import { filterIslamicKnowledge } from '../domain/islamicKnowledge';
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

describe('v1.5.3 Hadith honesty', () => {
  beforeAll(async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...defaultPersistedSettings, locale: 'en' }),
    );
    await initializeApplicationStorage(storage);
  });

  it('labels partial matn, links full text and keeps isnad with existing grading metadata', () => {
    const markup = renderToStaticMarkup(<KnowledgeScreen scope="hadith" />);
    expect(markup.match(/data-hadith-arabic-scope="partial-matn"/gu)).toHaveLength(3);
    expect(markup.match(/data-hadith-full-text/gu)).toHaveLength(3);
    expect(markup.match(/data-hadith-isnad/gu)).toHaveLength(3);
    expect(markup).toContain('Grading authority');
    expect(markup).toContain('https://sunnah.com/bukhari:1');
    expect(markup).toContain('https://sunnah.com/muslim:223');
    expect(markup).toContain('https://sunnah.com/bukhari:645');
    expect(markup).toContain('data-scholar-disclaimer');
    expect(markup).toContain(
      `data-knowledge-curated-size="${String(filterIslamicKnowledge('all', '').length)}"`,
    );
  });

  it('keeps hadith Arabic visually distinct from Qur’anic typography', () => {
    const css = readFileSync(new URL('../islamic-knowledge.css', import.meta.url), 'utf8');
    expect(css).toMatch(
      /\.knowledge-card__arabic--hadith\s*\{[^}]*font-family:\s*system-ui[^}]*\}/su,
    );
    expect(css).toMatch(/\.knowledge-card__arabic--hadith\s*\{[^}]*text-align:\s*start[^}]*\}/su);
  });
});
