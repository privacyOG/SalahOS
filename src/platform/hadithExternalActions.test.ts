import { describe, expect, it } from 'vitest';

import { hadithFullTextUrl } from './hadithExternalActions';

describe('hadith full-text navigation', () => {
  it('builds only reviewed Bukhari and Muslim links', () => {
    expect(hadithFullTextUrl('hadith-bukhari', 1)).toBe('https://sunnah.com/bukhari:1');
    expect(hadithFullTextUrl('hadith-muslim', 223)).toBe('https://sunnah.com/muslim:223');
    expect(() => hadithFullTextUrl('other', 1)).toThrow();
    expect(() => hadithFullTextUrl('hadith-bukhari', 0)).toThrow();
  });
});
