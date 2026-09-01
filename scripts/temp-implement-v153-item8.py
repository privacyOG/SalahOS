from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {text.count(old)}')
    return text.replace(old, new, 1)

# 1) Hadith metadata: make excerpt/full-text/isnad/tanzih state explicit.
path = Path('src/domain/islamicKnowledgeStage7.ts')
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "  readonly arabicExcerpt: string;\n  readonly topics: readonly string[];",
    "  readonly arabicExcerpt: string;\n  readonly arabicExcerptKind: 'partial-matn';\n  readonly fullTextUrl: string;\n  readonly isnadSummary: string;\n  readonly tanzihNote: string | null;\n  readonly topics: readonly string[];",
    'metadata interface',
)
metadata_additions = {
    "    arabicExcerpt: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',": "    arabicExcerpt: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',\n    arabicExcerptKind: 'partial-matn',\n    fullTextUrl: 'https://sunnah.com/bukhari:1',\n    isnadSummary: '‘Umar ibn al-Khattab → Prophet Muhammad ﷺ',\n    tanzihNote: null,",
    "    arabicExcerpt: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالصَّلَاةُ نُورٌ',": "    arabicExcerpt: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالصَّلَاةُ نُورٌ',\n    arabicExcerptKind: 'partial-matn',\n    fullTextUrl: 'https://sunnah.com/muslim:223',\n    isnadSummary: 'Abu Malik al-Ash‘ari → Prophet Muhammad ﷺ',\n    tanzihNote: null,",
    "    arabicExcerpt: 'صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً',": "    arabicExcerpt: 'صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً',\n    arabicExcerptKind: 'partial-matn',\n    fullTextUrl: 'https://sunnah.com/bukhari:645',\n    isnadSummary: '‘Abdullah ibn ‘Umar → Prophet Muhammad ﷺ',\n    tanzihNote: null,",
}
for old, new in metadata_additions.items():
    text = replace_once(text, old, new, f'metadata entry {old[:30]}')
path.write_text(text, encoding='utf-8')

# 2) Hadith presentation: honest excerpt label, full-text link, explicit fallback, isnad and tanzih surface.
path = Path('src/ui/KnowledgeStage7Details.tsx')
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "      gradingAuthority: string;\n      topics: string;",
    "      gradingAuthority: string;\n      isnad: string;\n      arabicMatnExcerpt: string;\n      fullText: string;\n      metadataUnavailable: string;\n      tanzih: string;\n      topics: string;",
    'label type',
)
locale_replacements = {
    "    gradingAuthority: 'Grading authority',\n    topics: 'Topics',": "    gradingAuthority: 'Grading authority',\n    isnad: 'Isnad summary',\n    arabicMatnExcerpt: 'Arabic matn excerpt · partial',\n    fullText: 'Open full hadith text',\n    metadataUnavailable: 'Detailed hadith metadata is unavailable for this entry. The cited collection reference remains the source of record.',\n    tanzih: 'Tanzih note',\n    topics: 'Topics',",
    "    gradingAuthority: 'جهة التصحيح',\n    topics: 'الموضوعات',": "    gradingAuthority: 'جهة التصحيح',\n    isnad: 'ملخص الإسناد',\n    arabicMatnExcerpt: 'مقتطف من متن الحديث بالعربية · غير كامل',\n    fullText: 'فتح نص الحديث كاملاً',\n    metadataUnavailable: 'البيانات التفصيلية لهذا الحديث غير متاحة هنا. يبقى مرجع المجموعة المذكور هو المرجع المعتمد.',\n    tanzih: 'تنبيه التنزيه',\n    topics: 'الموضوعات',",
    "    gradingAuthority: 'Derecelendiren',\n    topics: 'Konular',": "    gradingAuthority: 'Derecelendiren',\n    isnad: 'İsnad özeti',\n    arabicMatnExcerpt: 'Arapça metin alıntısı · kısmi',\n    fullText: 'Hadisin tam metnini aç',\n    metadataUnavailable: 'Bu kayıt için ayrıntılı hadis metaverisi mevcut değil. Belirtilen koleksiyon referansı esas kaynak olarak kalır.',\n    tanzih: 'Tenzih notu',\n    topics: 'Konular',",
    "    gradingAuthority: 'Otoritas penilaian',\n    topics: 'Topik',": "    gradingAuthority: 'Otoritas penilaian',\n    isnad: 'Ringkasan isnad',\n    arabicMatnExcerpt: 'Kutipan matan Arab · sebagian',\n    fullText: 'Buka teks hadis lengkap',\n    metadataUnavailable: 'Metadata hadis terperinci tidak tersedia untuk entri ini. Referensi koleksi yang dicantumkan tetap menjadi sumber utama.',\n    tanzih: 'Catatan tanzih',\n    topics: 'Topik',",
}
for old, new in locale_replacements.items():
    text = replace_once(text, old, new, f'locale labels {old[:25]}')
old_fallback = """  if (!metadata)\n    return (\n      <p lang={entry.translationPresentation.lang} dir={entry.translationPresentation.dir}>\n        {entry.text}\n      </p>\n    );"""
new_fallback = """  if (!metadata)\n    return (\n      <>\n        <p lang={entry.translationPresentation.lang} dir={entry.translationPresentation.dir}>\n          {entry.text}\n        </p>\n        <p\n          className=\"knowledge-hadith-metadata-state\"\n          role=\"note\"\n          data-hadith-metadata-state=\"unavailable\"\n        >\n          {copy.metadataUnavailable}\n        </p>\n      </>\n    );"""
text = replace_once(text, old_fallback, new_fallback, 'hadith explicit fallback')
old_arabic = """      <p\n        className=\"knowledge-card__arabic knowledge-card__arabic--hadith\"\n        lang=\"ar\"\n        dir=\"rtl\"\n        data-hadith-arabic\n      >\n        {metadata.arabicExcerpt}\n      </p>"""
new_arabic = """      <div className=\"knowledge-hadith-excerpt-heading\">\n        <span data-hadith-arabic-scope={metadata.arabicExcerptKind}>{copy.arabicMatnExcerpt}</span>\n        <a\n          href={metadata.fullTextUrl}\n          rel=\"noreferrer\"\n          data-hadith-full-text\n          lang={metadata.displayPresentation.lang}\n          dir={metadata.displayPresentation.dir}\n        >\n          {copy.fullText}\n        </a>\n      </div>\n      <p\n        className=\"knowledge-card__arabic knowledge-card__arabic--hadith\"\n        lang=\"ar\"\n        dir=\"rtl\"\n        data-hadith-arabic\n      >\n        {metadata.arabicExcerpt}\n      </p>"""
text = replace_once(text, old_arabic, new_arabic, 'hadith excerpt presentation')
start = text.index('      <dl className="knowledge-source-list" data-hadith-metadata>')
end_marker = '      </dl>\n      <div className="knowledge-topics" data-hadith-topics>'
end = text.index(end_marker, start)
new_dl = """      <dl className=\"knowledge-source-list knowledge-source-list--hadith\" data-hadith-metadata>\n        <div className=\"knowledge-hadith-audit-item\">\n          <dt>{copy.isnad}</dt>\n          <dd\n            data-hadith-isnad\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n            {metadata.isnadSummary}\n          </dd>\n        </div>\n        <div className=\"knowledge-hadith-audit-item\">\n          <dt>{copy.grade}</dt>\n          <dd\n            data-hadith-grade\n            data-knowledge-source-metadata\n            lang={entry.metadataPresentation.lang}\n            dir={entry.metadataPresentation.dir}\n          >\n            {entry.grade}\n          </dd>\n        </div>\n        <div className=\"knowledge-hadith-audit-item\">\n          <dt>{copy.gradingAuthority}</dt>\n          <dd\n            data-hadith-grading-authority\n            data-knowledge-source-metadata\n            lang={entry.metadataPresentation.lang}\n            dir={entry.metadataPresentation.dir}\n          >\n            {entry.grader}\n          </dd>\n        </div>\n        <div>\n          <dt>{copy.book}</dt>\n          <dd\n            data-hadith-book\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n            {metadata.bookNumber} · {metadata.bookTitle}\n          </dd>\n        </div>\n        <div>\n          <dt>{copy.chapter}</dt>\n          <dd\n            data-hadith-chapter\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n            {metadata.chapterNumber} · {metadata.chapterTitle}\n          </dd>\n        </div>\n        <div>\n          <dt>{copy.hadithNumber}</dt>\n          <dd\n            data-knowledge-source-metadata\n            lang={metadata.displayPresentation.lang}\n            dir={metadata.displayPresentation.dir}\n          >\n            {entry.collection} · <BidiText>{entry.reference}</BidiText> · {metadata.inBookReference}\n          </dd>\n        </div>\n      </dl>\n      {metadata.tanzihNote ? (\n        <aside className=\"knowledge-hadith-tanzih\" role=\"note\" data-hadith-tanzih>\n          <strong>{copy.tanzih}</strong>\n          <p>{metadata.tanzihNote}</p>\n        </aside>\n      ) : null}\n"""
text = text[:start] + new_dl + text[end + len('      </dl>\n'):]
path.write_text(text, encoding='utf-8')

# 3) Right-size the curated Knowledge IA and make scholar disclaimer prominent.
path = Path('src/ui/KnowledgeScreen.tsx')
text = path.read_text(encoding='utf-8')
text = replace_once(
    text,
    "  filterIslamicKnowledge,\n  getIslamicKnowledgeEntryById,",
    "  filterIslamicKnowledge,\n  getIslamicKnowledgeEntryById,\n  islamicKnowledgeEntries,",
    'knowledge imports',
)
text = replace_once(
    text,
    "  noResults: string;\n  guidance: string;",
    "  noResults: string;\n  guidance: string;\n  curatedScope: string;\n  scholarDisclaimer: string;",
    'knowledge copy type',
)
copy_replacements = {
    "    guidance:\n      'Q&A summaries preserve source and scholar attribution and call out juristic variation where it matters.',": "    guidance:\n      'Q&A summaries preserve source and scholar attribution and call out juristic variation where it matters.',\n    curatedScope: 'Curated learning set: {count} source-governed entries; not a comprehensive hadith or fatwa corpus.',\n    scholarDisclaimer:\n      'Learning aid only. For personal rulings, disputed questions, or circumstances that materially affect worship, consult a qualified scholar you trust.',",
    "    guidance:\n      'تحافظ ملخصات الأسئلة والأجوبة على نسبة المصدر والعالم وتوضح مواضع اختلاف الفقهاء عند الحاجة.',": "    guidance:\n      'تحافظ ملخصات الأسئلة والأجوبة على نسبة المصدر والعالم وتوضح مواضع اختلاف الفقهاء عند الحاجة.',\n    curatedScope: 'مجموعة تعليمية منتقاة: {count} مادة موثقة المصادر، وليست موسوعة حديث أو قاعدة فتاوى شاملة.',\n    scholarDisclaimer:\n      'للتعلّم فقط. في الأحكام الشخصية، والمسائل المختلف فيها، أو الظروف التي تؤثر فعلياً في العبادة، راجع عالماً مؤهلاً تثق بعلمه.',",
    "    guidance:\n      'Soru-cevap özetleri kaynak ve âlim atfını korur, gerektiğinde fıkhî ihtilafı açıkça belirtir.',": "    guidance:\n      'Soru-cevap özetleri kaynak ve âlim atfını korur, gerektiğinde fıkhî ihtilafı açıkça belirtir.',\n    curatedScope: 'Seçilmiş öğrenme seti: {count} kaynak denetimli kayıt; kapsamlı bir hadis veya fetva külliyatı değildir.',\n    scholarDisclaimer:\n      'Yalnızca öğrenme amaçlıdır. Kişisel hükümler, ihtilaflı meseleler veya ibadeti önemli ölçüde etkileyen durumlar için güvendiğiniz ehil bir âlime danışın.',",
    "    guidance:\n      'Ringkasan tanya-jawab mempertahankan atribusi sumber dan ulama serta menandai perbedaan fikih bila relevan.',": "    guidance:\n      'Ringkasan tanya-jawab mempertahankan atribusi sumber dan ulama serta menandai perbedaan fikih bila relevan.',\n    curatedScope: 'Kumpulan belajar terkurasi: {count} entri dengan sumber terkelola; bukan korpus hadis atau fatwa yang lengkap.',\n    scholarDisclaimer:\n      'Hanya sebagai sarana belajar. Untuk hukum pribadi, masalah yang diperselisihkan, atau keadaan yang memengaruhi ibadah secara berarti, konsultasikan dengan ulama yang kompeten dan Anda percayai.',",
}
for old, new in copy_replacements.items():
    text = replace_once(text, old, new, f'knowledge copy {old[:20]}')
text = replace_once(
    text,
    "  const labels = copy[locale];\n  const [module, setModule]",
    "  const labels = copy[locale];\n  const curatedScope = labels.curatedScope.replace('{count}', String(islamicKnowledgeEntries.length));\n  const [module, setModule]",
    'curated count',
)
old_status = """        <div className=\"knowledge-hero__status\" role=\"note\">\n          <span>{labels.offline}</span>\n          <span aria-hidden=\"true\">•</span>\n          <span>{labels.guidance}</span>\n        </div>\n      </header>"""
new_status = """        <div className=\"knowledge-hero__status\" role=\"note\">\n          <span>{labels.offline}</span>\n          <span aria-hidden=\"true\">•</span>\n          <span>{labels.guidance}</span>\n        </div>\n        <p className=\"knowledge-hero__scope\" data-knowledge-curated-size={islamicKnowledgeEntries.length}>\n          {curatedScope}\n        </p>\n      </header>\n\n      <aside className=\"knowledge-scholar-disclaimer\" role=\"note\" data-scholar-disclaimer>\n        {labels.scholarDisclaimer}\n      </aside>"""
text = replace_once(text, old_status, new_status, 'knowledge scope/disclaimer')
path.write_text(text, encoding='utf-8')

# 4) Styling: hadith text deliberately distinct from Qur'an, plus honest metadata/disclaimer surfaces.
path = Path('src/islamic-knowledge.css')
text = path.read_text(encoding='utf-8')
append = r'''

/* v1.5.3 Item 8: Hadith is not typeset as Qur'anic text. */
.knowledge-hadith-excerpt-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-block-start: 1rem;
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-xs);
  font-weight: 750;
}

.knowledge-hadith-excerpt-heading a {
  color: var(--salah-fg-accent);
  font-weight: 800;
}

.knowledge-card__arabic--hadith {
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

.knowledge-source-list--hadith .knowledge-hadith-audit-item {
  padding: 0.65rem 0.75rem;
  border-radius: var(--salah-radius-md);
  background: color-mix(in srgb, var(--salah-fg-accent) 5%, var(--salah-bg-surface));
}

.knowledge-hadith-metadata-state,
.knowledge-hadith-tanzih,
.knowledge-scholar-disclaimer {
  border: 1px solid var(--salah-border-subtle);
  border-radius: var(--salah-radius-md);
  background: var(--salah-bg-surface);
  color: var(--salah-fg-secondary);
}

.knowledge-hadith-metadata-state,
.knowledge-hadith-tanzih {
  margin-block: 0.75rem 0;
  padding: 0.8rem 0.9rem;
  font-size: var(--salah-text-sm);
}

.knowledge-hadith-tanzih strong {
  color: var(--salah-fg-primary);
}

.knowledge-hadith-tanzih p {
  margin-block-end: 0;
}

.knowledge-hero__scope {
  margin-block-start: 0.75rem;
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-sm);
  font-weight: 700;
}

.knowledge-scholar-disclaimer {
  margin-block: 1rem;
  padding: 0.9rem 1rem;
  border-inline-start: 3px solid var(--salah-border-default);
  box-shadow: var(--salah-shadow-sm);
  font-size: var(--salah-text-sm);
  font-weight: 700;
  line-height: 1.55;
}
'''
if 'v1.5.3 Item 8: Hadith is not typeset as Qur\'anic text.' in text:
    raise SystemExit('Item 8 styles already present')
path.write_text(text.rstrip() + append + '\n', encoding='utf-8')

# 5) Extend domain regression tests for honesty/provenance fields and tanzih applicability.
path = Path('src/domain/islamicKnowledgeStage7.test.ts')
text = path.read_text(encoding='utf-8')
old = """      expect(metadata.arabicExcerpt.trim().length).toBeGreaterThan(10);\n      expect(metadata.bookNumber).toBeGreaterThan(0);"""
new = """      expect(metadata.arabicExcerpt.trim().length).toBeGreaterThan(10);\n      expect(metadata.arabicExcerptKind).toBe('partial-matn');\n      expect(metadata.fullTextUrl).toMatch(/^https:\/\/sunnah\\.com\/(?:bukhari|muslim):\\d+$/u);\n      expect(metadata.isnadSummary).toContain('→ Prophet Muhammad ﷺ');\n      expect(metadata.tanzihNote).toBeNull();\n      expect(metadata.bookNumber).toBeGreaterThan(0);"""
text = replace_once(text, old, new, 'stage7 honesty assertions')
path.write_text(text, encoding='utf-8')

# 6) UI regression test for partial-label/full-link/isnad/grade/authority/disclaimer + typography ownership.
path = Path('src/ui/HadithHonestyV153.test.tsx')
path.write_text(r'''import { readFileSync } from 'node:fs';
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
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('v1.5.3 Hadith honesty and scope', () => {
  beforeAll(async () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...defaultPersistedSettings, locale: 'en' }));
    await initializeApplicationStorage(storage);
  });

  it('labels partial Arabic matn and exposes the audit metadata beside every hadith', () => {
    const markup = renderToStaticMarkup(<KnowledgeScreen scope="hadith" />);
    expect(markup.match(/data-hadith-arabic-scope="partial-matn"/gu)).toHaveLength(3);
    expect(markup.match(/data-hadith-full-text/gu)).toHaveLength(3);
    expect(markup.match(/data-hadith-isnad/gu)).toHaveLength(3);
    expect(markup.match(/data-hadith-grade/gu)).toHaveLength(3);
    expect(markup.match(/data-hadith-grading-authority/gu)).toHaveLength(3);
    expect(markup).toContain('https://sunnah.com/bukhari:1');
    expect(markup).toContain('https://sunnah.com/muslim:223');
    expect(markup).toContain('https://sunnah.com/bukhari:645');
    expect(markup).toContain('data-scholar-disclaimer');
    expect(markup).toContain('data-knowledge-curated-size="12"');
  });

  it('keeps hadith Arabic typography explicitly distinct from Qur’anic typography', () => {
    const css = readFileSync(new URL('../islamic-knowledge.css', import.meta.url), 'utf8');
    const hadithRule = css.match(/\.knowledge-card__arabic--hadith\s*\{[^}]+\}/u)?.[0] ?? '';
    expect(hadithRule).toContain('font-family: system-ui');
    expect(hadithRule).toContain('text-align: start');
    expect(hadithRule).toContain('border-inline-start');
  });
});
''', encoding='utf-8')
