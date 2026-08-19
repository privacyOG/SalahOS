import { describe, expect, it } from 'vitest';

import {
  buildPublicEmbedPath,
  buildPublicEmbedSnippet,
  createPublicEmbedConfig,
  publicEmbedDirection,
  publicEmbedSecurityPolicy,
} from './publicEmbed';

describe('public embeds', () => {
  it('builds deterministic daily, monthly and next-prayer paths', () => {
    expect(
      buildPublicEmbedPath({
        mosqueId: 'masjid.one',
        kind: 'daily',
        theme: 'light',
        locale: 'en',
      }),
    ).toBe('/embed/daily/masjid.one?theme=light&lang=en');

    expect(
      buildPublicEmbedPath({
        mosqueId: 'masjid.one',
        kind: 'monthly',
        theme: 'dark',
        locale: 'ar',
      }),
    ).toBe('/embed/monthly/masjid.one?theme=dark&lang=ar');

    expect(
      buildPublicEmbedPath({
        mosqueId: 'masjid.one',
        kind: 'next-prayer',
        theme: 'light',
        locale: 'ar',
      }),
    ).toBe('/embed/next-prayer/masjid.one?theme=light&lang=ar');
  });

  it('normalizes stable mosque identifiers and exposes RTL for Arabic', () => {
    const config = createPublicEmbedConfig({
      mosqueId: '  Masjid.One  ',
      kind: 'daily',
      theme: 'light',
      locale: 'ar',
    });

    expect(config.mosqueId).toBe('masjid.one');
    expect(publicEmbedDirection(config.locale)).toBe('rtl');
  });

  it('generates a copy-paste iframe with a constrained sandbox', () => {
    const snippet = buildPublicEmbedSnippet(
      'https://salahos.example',
      {
        mosqueId: 'masjid.one',
        kind: 'next-prayer',
        theme: 'dark',
        locale: 'en',
      },
      'Masjid One next prayer',
    );

    expect(snippet).toContain('https://salahos.example/embed/next-prayer/masjid.one?theme=dark&lang=en');
    expect(snippet).toContain('sandbox="allow-same-origin"');
    expect(snippet).toContain('referrerpolicy="no-referrer"');
  });

  it('creates strict framing and content policies from approved origins', () => {
    const policy = publicEmbedSecurityPolicy([
      'https://example.org',
      'https://www.example.org/path',
      'https://example.org',
    ]);

    expect(policy.frameAncestors).toEqual(['https://example.org', 'https://www.example.org']);
    expect(policy.contentSecurityPolicy).toContain(
      'frame-ancestors https://example.org https://www.example.org',
    );
    expect(policy.contentSecurityPolicy).toContain("default-src 'none'");
  });

  it('rejects unsafe origins and invalid mosque identifiers', () => {
    expect(() =>
      buildPublicEmbedSnippet(
        'http://example.org',
        { mosqueId: 'masjid.one', kind: 'daily', theme: 'light', locale: 'en' },
        'Prayer times',
      ),
    ).toThrow(/HTTPS/u);

    expect(() =>
      createPublicEmbedConfig({ mosqueId: 'bad id', kind: 'daily', theme: 'light', locale: 'en' }),
    ).toThrow(/identifier/u);
  });
});
