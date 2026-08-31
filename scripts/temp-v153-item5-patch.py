from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(text: str, before: str, after: str, label: str) -> str:
    count = text.count(before)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(before, after, 1)

# Make the shared data-attribute rules the single typography authority.
p = 'src/islamic-knowledge.css'
s = read(p)
s = replace_once(
    s,
    ".knowledge-card__arabic {\n  margin-block: 1rem;\n  color: var(--salah-fg-primary) !important;\n  font-size: clamp(1.35rem, 3vw, 1.8rem);\n  line-height: 1.9 !important;\n  text-align: end;\n}",
    ".knowledge-card__arabic {\n  margin-block: 1rem;\n  color: var(--salah-fg-primary);\n  font-size: clamp(1.35rem, 3vw, 1.8rem);\n  line-height: 1.85;\n  letter-spacing: 0;\n  font-variant-ligatures: common-ligatures contextual;\n  font-feature-settings: 'rlig' 1, 'calt' 1, 'liga' 1, 'kern' 1;\n  text-align: justify;\n  text-align-last: end;\n}",
    'shared Arabic typography',
)
s = replace_once(
    s,
    ".knowledge-card__arabic[data-quran-scale='compact'] {\n  font-size: clamp(1.15rem, 2.5vw, 1.45rem);\n}",
    ".knowledge-card__arabic[data-quran-scale='compact'] {\n  font-size: clamp(1.15rem, 2.5vw, 1.45rem);\n  line-height: 1.75;\n}",
    'compact line height',
)
s = replace_once(
    s,
    ".knowledge-card__arabic[data-quran-scale='comfortable'] {\n  font-size: clamp(1.35rem, 3vw, 1.8rem);\n}",
    ".knowledge-card__arabic[data-quran-scale='comfortable'] {\n  font-size: clamp(1.35rem, 3vw, 1.8rem);\n  line-height: 1.85;\n}",
    'comfortable line height',
)
s = replace_once(
    s,
    ".knowledge-card__arabic[data-quran-scale='large'] {\n  font-size: clamp(1.65rem, 4vw, 2.15rem);\n}",
    ".knowledge-card__arabic[data-quran-scale='large'] {\n  font-size: clamp(1.65rem, 4vw, 2.15rem);\n  line-height: 1.9;\n}",
    'large line height',
)
s = replace_once(
    s,
    ".knowledge-card__arabic[data-quran-scale='xlarge'] {\n  font-size: clamp(1.95rem, 5vw, 2.55rem);\n}",
    ".knowledge-card__arabic[data-quran-scale='xlarge'] {\n  font-size: clamp(1.95rem, 5vw, 2.55rem);\n  line-height: 1.95;\n}",
    'xlarge line height',
)
write(p, s)

# The full offline reader now emits the same data-state contract as curated cards.
p = 'src/ui/QuranOfflineReader.tsx'
s = read(p)
s = replace_once(
    s,
    '                      className={`knowledge-card__arabic knowledge-card__arabic--${preferences.arabicFont} knowledge-card__arabic--${preferences.fontScale}`}\n                      lang="ar"\n                      dir="rtl"',
    '                      className="knowledge-card__arabic"\n                      lang="ar"\n                      dir="rtl"\n                      data-quran-font={preferences.arabicFont}\n                      data-quran-scale={preferences.fontScale}',
    'offline reader typography state',
)
write(p, s)

# Delete the duplicate modifier selector system from the offline-reader stylesheet.
p = 'src/quran-offline-reader.css'
s = read(p)
for block in [
    ".knowledge-card__arabic--amiri-quran {\n  font-family: 'Salah Amiri Quran', serif;\n}\n\n",
    ".knowledge-card__arabic--system {\n  font-family: system-ui, sans-serif;\n}\n\n",
    ".knowledge-card__arabic--compact {\n  font-size: clamp(1.15rem, 2.5vw, 1.45rem);\n}\n\n",
    ".knowledge-card__arabic--comfortable {\n  font-size: clamp(1.35rem, 3vw, 1.8rem);\n}\n\n",
    ".knowledge-card__arabic--large {\n  font-size: clamp(1.65rem, 4vw, 2.15rem);\n}\n\n",
    ".knowledge-card__arabic--xlarge {\n  font-size: clamp(1.95rem, 5vw, 2.55rem);\n}\n\n",
]:
    if block not in s:
        raise SystemExit('offline modifier block missing')
    s = s.replace(block, '', 1)
write(p, s)

# Regression test: both reader surfaces must share the data-state selector contract.
write(
    'src/ui/QuranTypographyArchitecture.test.tsx',
    """import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Qur’an typography architecture', () => {
  it('uses one data-attribute state contract across both reader surfaces', () => {
    const knowledge = readFileSync(new URL('../islamic-knowledge.css', import.meta.url), 'utf8');
    const offlineCss = readFileSync(new URL('../quran-offline-reader.css', import.meta.url), 'utf8');
    const offlineReader = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');

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
    expect(knowledge).toContain("font-feature-settings: 'rlig' 1, 'calt' 1, 'liga' 1, 'kern' 1");
    expect(knowledge).toContain('text-align: justify');
    expect(knowledge).toContain('text-align-last: end');
  });
});
""",
)
