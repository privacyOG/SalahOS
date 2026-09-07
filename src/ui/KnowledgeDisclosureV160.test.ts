import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const details = readFileSync(new URL('./KnowledgeStage7Details.tsx', import.meta.url), 'utf8');
const screen = readFileSync(new URL('./KnowledgeScreen.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../knowledge-disclosures-v160.css', import.meta.url), 'utf8');

describe('V1.6.0 compact Knowledge reading', () => {
  it('keeps useful Hadith and Fiqh content ahead of source/review metadata', () => {
    expect(details).toContain('data-hadith-source-disclosure');
    expect(details).toContain('data-fiqh-source-disclosure');
    expect(details.indexOf('data-hadith-topics')).toBeLessThan(
      details.indexOf('data-hadith-source-disclosure'),
    );
    expect(details.indexOf('data-fiqh-four-madhhab')).toBeLessThan(
      details.indexOf('data-fiqh-source-disclosure'),
    );
    expect(details).toContain("sourceReview: 'Source & review'");
  });

  it('labels English renderings and answers visibly while retaining explicit direction metadata', () => {
    expect(details).toContain('data-knowledge-language-label="en"');
    expect(details).toContain("englishRendering: 'English rendering'");
    expect(details).toContain("englishAnswer: 'English answer'");
    expect(details).toContain('lang={entry.translationPresentation.lang}');
    expect(details).toContain('dir={entry.translationPresentation.dir}');
    expect(details).toContain('lang={entry.metadataPresentation.lang}');
    expect(details).toContain('dir={entry.metadataPresentation.dir}');
    expect(screen.match(/<h3 lang="en" dir="ltr">/gu)?.length).toBe(2);
    expect(screen).toContain('<p lang="en" dir="ltr">');
  });

  it('makes the heading compact and disclosures keyboard-visible with semantic tokens', () => {
    expect(css).toContain('.knowledge-screen .knowledge-hero h1');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('var(--salah-focus-ring)');
    expect(css).toContain('var(--salah-bg-muted)');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/iu);
  });
});
