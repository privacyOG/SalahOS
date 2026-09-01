from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Domain: only add narrator provenance needed for the isnad summary.
path = Path('src/domain/islamicKnowledgeStage7.ts')
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "  readonly arabicExcerpt: string;\n  readonly topics: readonly string[];",
    "  readonly arabicExcerpt: string;\n  readonly narrator: string;\n  readonly topics: readonly string[];",
    'hadith metadata interface',
)
for arabic, narrator in [
    ("إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى", "‘Umar ibn al-Khattab"),
    ("الطُّهُورُ شَطْرُ الإِيمَانِ، وَالصَّلَاةُ نُورٌ", "Abu Malik al-Ash‘ari"),
    ("صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً", "‘Abdullah ibn ‘Umar"),
]:
    old = f"    arabicExcerpt: '{arabic}',"
    new = f"    arabicExcerpt: '{arabic}',\n    narrator: '{narrator}',"
    text = replace_once(text, old, new, f'narrator {narrator}')
path.write_text(text, encoding='utf-8')

# Platform: reviewed user-initiated external navigation. Domain stays URL-free.
Path('src/platform/hadithExternalActions.ts').write_text("""const SUNNAH_BASE = 'https://sunnah.com/';

export function hadithFullTextUrl(sourceId: string, hadithNumber: number): string {
  const slug = sourceId === 'hadith-bukhari' ? 'bukhari' : sourceId === 'hadith-muslim' ? 'muslim' : null;
  if (!slug || !Number.isInteger(hadithNumber) || hadithNumber < 1) {
    throw new Error('Unsupported hadith full-text reference');
  }
  return `${SUNNAH_BASE}${slug}:${String(hadithNumber)}`;
}
""", encoding='utf-8')

Path('src/platform/hadithExternalActions.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { hadithFullTextUrl } from './hadithExternalActions';

describe('hadith full-text navigation', () => {
  it('builds only reviewed Bukhari and Muslim links', () => {
    expect(hadithFullTextUrl('hadith-bukhari', 1)).toBe('https://sunnah.com/bukhari:1');
    expect(hadithFullTextUrl('hadith-muslim', 223)).toBe('https://sunnah.com/muslim:223');
    expect(() => hadithFullTextUrl('other', 1)).toThrow();
    expect(() => hadithFullTextUrl('hadith-bukhari', 0)).toThrow();
  });
});
""", encoding='utf-8')

path = Path('scripts/check-remote-network-policy.mjs')
text = path.read_text(encoding='utf-8')
needle = "  ['src/platform/qiblaGoogleMaps.ts', 'interactive Qiblah Google Maps provider'],\n"
text = replace_once(
    text,
    needle,
    needle + "  ['src/platform/hadithExternalActions.ts', 'user-initiated canonical hadith navigation'],\n",
    'network review entry',
)
path.write_text(text, encoding='utf-8')

# UI: compact localized labels, honest partial-matn disclosure, full text link, isnad and explicit fallback.
path = Path('src/ui/KnowledgeStage7Details.tsx')
text = path.read_text(encoding='utf-8')
import_anchor = "import { getFiqhStage7Metadata, getHadithStage7Metadata } from '../domain/islamicKnowledgeStage7';\n"
text = replace_once(
    text,
    import_anchor,
    import_anchor + "import { hadithFullTextUrl } from '../platform/hadithExternalActions';\n",
    'external action import',
)
insert_anchor = "const madhhabNames = {\n"
compact_copy = """const hadithCopy = {
  en: ['Isnad', 'Partial Arabic matn', 'Full text', 'Metadata unavailable'],
  ar: ['الإسناد', 'متن عربي جزئي', 'النص الكامل', 'البيانات غير متاحة'],
  tr: ['İsnad', 'Kısmi Arapça metin', 'Tam metin', 'Meta veri yok'],
  id: ['Isnad', 'Matan Arab sebagian', 'Teks lengkap', 'Metadata tidak ada'],
} as const satisfies Readonly<Record<Locale, readonly [string, string, string, string]>>;

"""
text = replace_once(text, insert_anchor, compact_copy + insert_anchor, 'compact hadith copy')
old_fallback = """  if (!metadata)
    return (
      <p lang={entry.translationPresentation.lang} dir={entry.translationPresentation.dir}>
        {entry.text}
      </p>
    );"""
new_fallback = """  if (!metadata)
    return (
      <>
        <p lang={entry.translationPresentation.lang} dir={entry.translationPresentation.dir}>
          {entry.text}
        </p>
        <p className="knowledge-hadith-metadata-state" role="note" data-hadith-metadata-state="unavailable">
          {hadithCopy[locale][3]}
        </p>
      </>
    );"""
text = replace_once(text, old_fallback, new_fallback, 'explicit metadata fallback')
related_anchor = """  const related = metadata.relatedHadithIds
    .map((entryId) => getIslamicKnowledgeEntryById(entryId))
    .filter((candidate): candidate is HadithKnowledgeEntry => candidate?.module === 'hadith');

  return ("""
text = replace_once(
    text,
    related_anchor,
    """  const related = metadata.relatedHadithIds
    .map((entryId) => getIslamicKnowledgeEntryById(entryId))
    .filter((candidate): candidate is HadithKnowledgeEntry => candidate?.module === 'hadith');
  const [isnadLabel, excerptLabel, fullTextLabel] = hadithCopy[locale];

  return (""",
    'hadith compact labels',
)
old_arabic = """      <p
        className="knowledge-card__arabic knowledge-card__arabic--hadith"
        lang="ar"
        dir="rtl"
        data-hadith-arabic
      >
        {metadata.arabicExcerpt}
      </p>"""
new_arabic = """      <p className="knowledge-hadith-excerpt-heading">
        <span data-hadith-arabic-scope="partial-matn">{excerptLabel}</span>
        <a
          href={hadithFullTextUrl(metadata.sourceId, metadata.hadithNumber)}
          rel="noreferrer"
          data-hadith-full-text
        >
          {fullTextLabel}
        </a>
      </p>
      <p
        className="knowledge-card__arabic knowledge-card__arabic--hadith"
        lang="ar"
        dir="rtl"
        data-hadith-arabic
      >
        {metadata.arabicExcerpt}
      </p>"""
text = replace_once(text, old_arabic, new_arabic, 'partial matn header')
dl_anchor = """      <dl className="knowledge-source-list" data-hadith-metadata>
        <div>
          <dt>{copy.book}</dt>"""
text = replace_once(
    text,
    dl_anchor,
    """      <dl className="knowledge-source-list" data-hadith-metadata>
        <div>
          <dt>{isnadLabel}</dt>
          <dd data-hadith-isnad data-knowledge-source-metadata lang="en" dir="ltr">
            {metadata.narrator} → Muhammad ﷺ
          </dd>
        </div>
        <div>
          <dt>{copy.book}</dt>""",
    'isnad row',
)
path.write_text(text, encoding='utf-8')

# Knowledge IA: move the existing compact-library/scholar language into a prominent note,
# remove redundant guidance copy, and expose the live governed entry count without new locale strings.
path = Path('src/ui/KnowledgeScreen.tsx')
text = path.read_text(encoding='utf-8')
text = replace_once(text, "  noResults: string;\n  guidance: string;", "  noResults: string;", 'remove guidance type')
for guidance in [
    "    guidance:\n      'Q&A summaries preserve source and scholar attribution and call out juristic variation where it matters.',\n",
    "    guidance:\n      'تحافظ ملخصات الأسئلة والأجوبة على نسبة المصدر والعالم وتوضح مواضع اختلاف الفقهاء عند الحاجة.',\n",
    "    guidance:\n      'Soru-cevap özetleri kaynak ve âlim atfını korur, gerektiğinde fıkhî ihtilafı açıkça belirtir.',\n",
    "    guidance:\n      'Ringkasan tanya-jawab mempertahankan atribusi sumber dan ulama serta menandai perbedaan fikih bila relevan.',\n",
]:
    text = replace_once(text, guidance, '', 'remove redundant guidance')
old_header = """        <p>{labels.intro}</p>
        <div className="knowledge-hero__status" role="note">
          <span>{labels.offline}</span>
          <span aria-hidden="true">•</span>
          <span>{labels.guidance}</span>
        </div>
      </header>"""
new_header = """        <p className="knowledge-hero__scope" data-knowledge-curated-size={filterIslamicKnowledge('all', '').length}>
          {filterIslamicKnowledge('all', '').length} · {labels.offline}
        </p>
      </header>

      <aside className="knowledge-scholar-disclaimer" role="note" data-scholar-disclaimer>
        {labels.intro}
      </aside>"""
text = replace_once(text, old_header, new_header, 'right-size and scholar disclaimer')
path.write_text(text, encoding='utf-8')

# CSS: one distinct hadith rule plus small disclosure/fallback/disclaimer surfaces.
path = Path('src/islamic-knowledge.css')
text = path.read_text(encoding='utf-8')
old_rule = """.knowledge-card__arabic--hadith {
  margin-block-end: 0.6rem;
  font-family: var(--salah-quran-arabic-font, var(--salah-font-arabic));
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  line-height: 1.75;
}
"""
new_rule = """.knowledge-card__arabic--hadith {
  margin-block-end: 0.6rem;
  padding: 0.8rem 0.9rem;
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
text = replace_once(text, old_rule, new_rule, 'distinct hadith typography')
append = """

.knowledge-hadith-excerpt-heading {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-xs);
  font-weight: 750;
}

.knowledge-hadith-excerpt-heading a {
  color: var(--salah-fg-accent);
}

.knowledge-hadith-metadata-state,
.knowledge-scholar-disclaimer {
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-md);
  background: var(--salah-bg-surface);
  color: var(--salah-fg-secondary);
  padding: 0.8rem 0.9rem;
}

.knowledge-hadith-metadata-state {
  font-size: var(--salah-text-sm);
}

.knowledge-hero__scope {
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-sm);
  font-weight: 700;
}

.knowledge-scholar-disclaimer {
  margin-block: 1rem;
  border-inline-start: 3px solid var(--salah-border-default);
  font-size: var(--salah-text-sm);
  font-weight: 700;
  line-height: 1.55;
}
"""
path.write_text(text.rstrip() + append + '\n', encoding='utf-8')

# Tests: preserve governance, honest excerpt/full-text, isnad, existing grade/authority and live scope.
path = Path('src/domain/islamicKnowledgeStage7.test.ts')
text = path.read_text(encoding='utf-8')
old = """      expect(metadata.arabicExcerpt.trim().length).toBeGreaterThan(10);
      expect(metadata.bookNumber).toBeGreaterThan(0);"""
new = """      expect(metadata.arabicExcerpt.trim().length).toBeGreaterThan(10);
      expect(metadata.narrator.trim().length).toBeGreaterThan(5);
      expect(metadata.bookNumber).toBeGreaterThan(0);"""
text = replace_once(text, old, new, 'narrator test')
path.write_text(text, encoding='utf-8')

Path('src/ui/HadithHonestyV153.test.tsx').write_text(r'''import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import { filterIslamicKnowledge } from '../domain/islamicKnowledge';
import { initializeApplicationStorage } from '../platform/applicationStorage';
import { defaultPersistedSettings, SETTINGS_STORAGE_KEY, type KeyValueStorage } from '../platform/settingsStorage';
import { KnowledgeScreen } from './KnowledgeScreen';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('v1.5.3 Hadith honesty', () => {
  beforeAll(async () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...defaultPersistedSettings, locale: 'en' }));
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
    expect(markup).toContain(`data-knowledge-curated-size="${String(filterIslamicKnowledge('all', '').length)}"`);
  });

  it('keeps hadith Arabic visually distinct from Qur’anic typography', () => {
    const css = readFileSync(new URL('../islamic-knowledge.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.knowledge-card__arabic--hadith\s*\{[^}]*font-family:\s*system-ui[^}]*\}/su);
    expect(css).toMatch(/\.knowledge-card__arabic--hadith\s*\{[^}]*text-align:\s*start[^}]*\}/su);
  });
});
''', encoding='utf-8')
