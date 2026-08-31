import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Qur’an typography architecture', () => {
  it('uses one data-attribute state contract across both reader surfaces', () => {
    const knowledge = readFileSync(new URL('../islamic-knowledge.css', import.meta.url), 'utf8');
    const offlineCss = readFileSync(
      new URL('../quran-offline-reader.css', import.meta.url),
      'utf8',
    );
    const offlineReader = readFileSync(
      new URL('./QuranOfflineReader.tsx', import.meta.url),
      'utf8',
    );

    expect(knowledge).toContain("[data-quran-font='amiri-quran']");
    expect(knowledge).toContain("[data-quran-scale='compact']");
    expect(knowledge).not.toContain('!important');
    expect(offlineReader).toContain('data-quran-font={preferences.arabicFont}');
    expect(offlineReader).toContain('data-quran-scale={preferences.fontScale}');
    expect(offlineReader).not.toContain('knowledge-card__arabic--${preferences.');
    expect(offlineCss).not.toContain('.knowledge-card__arabic--');
  });

  it('keeps Arabic shaping and spacing explicit', () => {
    const knowledge = readFileSync(new URL('../islamic-knowledge.css', import.meta.url), 'utf8');
    expect(knowledge).toContain('letter-spacing: 0');
    expect(knowledge).toContain('font-feature-settings:');
    expect(knowledge).toContain("'rlig' 1");
    expect(knowledge).toContain("'calt' 1");
    expect(knowledge).toContain("'liga' 1");
    expect(knowledge).toContain("'kern' 1");
    expect(knowledge).toContain('text-align: justify');
    expect(knowledge).toContain('text-align-last: end');
  });
});
