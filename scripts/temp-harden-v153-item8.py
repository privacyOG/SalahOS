from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Keep domain metadata network-agnostic: use provider references, not remote URL literals.
path = Path('src/domain/islamicKnowledgeStage7.ts')
text = path.read_text(encoding='utf-8')
text = replace_once(text, '  readonly fullTextUrl: string;', '  readonly fullTextReference: string;', 'metadata field')
text = text.replace("fullTextUrl: 'https://sunnah.com/bukhari:1'", "fullTextReference: 'bukhari:1'")
text = text.replace("fullTextUrl: 'https://sunnah.com/muslim:223'", "fullTextReference: 'muslim:223'")
text = text.replace("fullTextUrl: 'https://sunnah.com/bukhari:645'", "fullTextReference: 'bukhari:645'")
if 'https://sunnah.com/' in text or 'fullTextUrl' in text:
    raise SystemExit('Remote URL leaked into domain metadata')
path.write_text(text, encoding='utf-8')

# Narrow platform adapter for user-initiated external hadith navigation.
Path('src/platform/hadithExternalActions.ts').write_text("""const SUNNAH_HADITH_BASE_URL = 'https://sunnah.com/';

const SUNNAH_REFERENCE_PATTERN = /^(?:bukhari|muslim):\\d+$/u;

export function hadithFullTextUrl(reference: string): string {
  if (!SUNNAH_REFERENCE_PATTERN.test(reference)) {
    throw new Error(`Unsupported hadith full-text reference: ${reference}`);
  }
  return new URL(reference, SUNNAH_HADITH_BASE_URL).toString();
}
""", encoding='utf-8')

# Register only this explicit user-navigation adapter in the existing security policy.
path = Path('scripts/check-remote-network-policy.mjs')
text = path.read_text(encoding='utf-8')
needle = "  ['src/platform/qiblaGoogleMaps.ts', 'interactive Qiblah Google Maps provider'],\n"
addition = needle + "  [\n    'src/platform/hadithExternalActions.ts',\n    'user-initiated canonical hadith full-text external navigation',\n  ],\n"
text = replace_once(text, needle, addition, 'network allow-list insertion')
path.write_text(text, encoding='utf-8')

# UI resolves a domain reference through the reviewed platform adapter.
path = Path('src/ui/KnowledgeStage7Details.tsx')
text = path.read_text(encoding='utf-8')
import_anchor = "import { getFiqhStage7Metadata, getHadithStage7Metadata } from '../domain/islamicKnowledgeStage7';\n"
text = replace_once(text, import_anchor, import_anchor + "import { hadithFullTextUrl } from '../platform/hadithExternalActions';\n", 'adapter import')
text = replace_once(text, '          href={metadata.fullTextUrl}', '          href={hadithFullTextUrl(metadata.fullTextReference)}', 'full-text href')
path.write_text(text, encoding='utf-8')

# Domain test validates provider refs; UI test still checks rendered canonical URLs.
path = Path('src/domain/islamicKnowledgeStage7.test.ts')
text = path.read_text(encoding='utf-8')
pattern = re.compile(r"      expect\(metadata\.fullTextUrl\)\.toMatch\([^\n]+\);")
replacement = "      expect(metadata.fullTextReference).toMatch(/^(?:bukhari|muslim):\\d+$/u);"
text, count = pattern.subn(lambda _match: replacement, text, count=1)
if count != 1:
    raise SystemExit(f'Domain test URL assertion: expected one match, found {count}')
if 'fullTextUrl' in text:
    raise SystemExit('Domain test still refers to fullTextUrl')
path.write_text(text, encoding='utf-8')

# Add focused adapter tests: only Bukhari/Muslim numeric refs can become remote navigation URLs.
Path('src/platform/hadithExternalActions.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { hadithFullTextUrl } from './hadithExternalActions';

describe('hadith full-text external navigation', () => {
  it('builds canonical Sunnah.com URLs for reviewed collection references', () => {
    expect(hadithFullTextUrl('bukhari:1')).toBe('https://sunnah.com/bukhari:1');
    expect(hadithFullTextUrl('muslim:223')).toBe('https://sunnah.com/muslim:223');
  });

  it('rejects arbitrary hosts, paths, and unsupported collections', () => {
    expect(() => hadithFullTextUrl('https://example.com/')).toThrow();
    expect(() => hadithFullTextUrl('../bukhari:1')).toThrow();
    expect(() => hadithFullTextUrl('tirmidhi:1')).toThrow();
  });
});
""", encoding='utf-8')

# Right-size against the live catalogue rather than stale historical count text.
path = Path('src/ui/HadithHonestyV153.test.tsx')
text = path.read_text(encoding='utf-8')
anchor = "import { initializeApplicationStorage } from '../platform/applicationStorage';\n"
text = replace_once(text, anchor, "import { islamicKnowledgeEntries } from '../domain/islamicKnowledge';\n" + anchor, 'catalogue import')
text = replace_once(
    text,
    "    expect(markup).toContain('data-knowledge-curated-size=\"12\"');",
    "    expect(markup).toContain(`data-knowledge-curated-size=\"${String(islamicKnowledgeEntries.length)}\"`);",
    'dynamic catalogue assertion',
)
# Test the actual declaration semantics rather than whichever duplicate rule appears first.
old_css_test = """    const hadithRule = /\\.knowledge-card__arabic--hadith\\s*\\{[^}]+\\}/u.exec(css)?.[0] ?? '';
    expect(hadithRule).toContain('font-family: system-ui');
    expect(hadithRule).toContain('text-align: start');
    expect(hadithRule).toContain('border-inline-start');"""
new_css_test = """    expect(css).toMatch(/\\.knowledge-card__arabic--hadith\\s*\\{[^}]*font-family:\\s*system-ui[^}]*\\}/su);
    expect(css).toMatch(/\\.knowledge-card__arabic--hadith\\s*\\{[^}]*text-align:\\s*start[^}]*\\}/su);
    expect(css).toMatch(/\\.knowledge-card__arabic--hadith\\s*\\{[^}]*border-inline-start:[^}]*\\}/su);"""
text = replace_once(text, old_css_test, new_css_test, 'CSS semantics test')
path.write_text(text, encoding='utf-8')

# Consolidate duplicate hadith modifier rules into one deliberate typography rule.
path = Path('src/islamic-knowledge.css')
text = path.read_text(encoding='utf-8')
pattern = re.compile(r"\.knowledge-card__arabic--hadith\s*\{[^}]*\}\n?", re.S)
matches = list(pattern.finditer(text))
if len(matches) < 2:
    raise SystemExit(f'Expected duplicate hadith rules after Item 8 helper, found {len(matches)}')
replacement = """.knowledge-card__arabic--hadith {
  margin-block-end: 0.6rem;
  padding: 0.85rem 1rem;
  border-inline-start: 3px solid var(--salah-border-default);
  border-radius: var(--salah-radius-md);
  background: color-mix(in srgb, var(--salah-fg-primary) 4%, var(--salah-bg-surface));
  font-family: system-ui, sans-serif;
  font-size: clamp(1.2rem, 2.6vw, 1.55rem);
  font-weight: 600;
  line-height: 1.9;
  text-align: start;
  text-align-last: auto;
}
"""
cleaned = pattern.sub('', text)
marker = ".knowledge-card__arabic[data-quran-font='"
idx = cleaned.find(marker)
if idx < 0:
    raise SystemExit('Could not find Quran font rule insertion marker')
text = cleaned[:idx] + replacement + '\n' + cleaned[idx:]
path.write_text(text, encoding='utf-8')
