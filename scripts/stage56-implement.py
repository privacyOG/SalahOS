#!/usr/bin/env python3
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:100]!r}")
    target.write_text(text.replace(old, new, 1))


Path("src/domain/islamicKnowledgeStage7.ts").write_text(
    r'''import type { Madhhab } from './islamicKnowledge';

export interface HadithStage7Metadata {
  readonly entryId: string;
  readonly sourceId: string;
  readonly bookNumber: number;
  readonly bookTitle: string;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly hadithNumber: number;
  readonly inBookReference: string;
  readonly arabicExcerpt: string;
  readonly topics: readonly string[];
  readonly relatedHadithIds: readonly string[];
}

export interface FiqhMadhhabPosition {
  readonly madhhab: Madhhab;
  readonly summary: string;
  readonly sourceId: string;
}

export interface FiqhStage7Metadata {
  readonly entryId: string;
  readonly topic: string;
  readonly reviewedAt: string;
  readonly supportingReferences: readonly string[];
  readonly madhhabPositions: readonly FiqhMadhhabPosition[];
}

export const hadithStage7Metadata = Object.freeze([
  {
    entryId: 'hadith-intentions',
    sourceId: 'hadith-bukhari',
    bookNumber: 1,
    bookTitle: 'Revelation',
    chapterNumber: 1,
    chapterTitle: "How the Divine Revelation started being revealed to Allah's Messenger",
    hadithNumber: 1,
    inBookReference: 'Book 1, Hadith 1',
    arabicExcerpt: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    topics: ['intention', 'sincerity', 'worship', 'migration'],
    relatedHadithIds: ['hadith-prayer-light'],
  },
  {
    entryId: 'hadith-prayer-light',
    sourceId: 'hadith-muslim',
    bookNumber: 2,
    bookTitle: 'The Book of Purification',
    chapterNumber: 1,
    chapterTitle: "The virtue of wudu'",
    hadithNumber: 223,
    inBookReference: 'Book 2, Hadith 1',
    arabicExcerpt: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالصَّلَاةُ نُورٌ',
    topics: ['purification', 'prayer', 'faith', 'remembrance'],
    relatedHadithIds: ['hadith-congregation', 'hadith-intentions'],
  },
  {
    entryId: 'hadith-congregation',
    sourceId: 'hadith-bukhari',
    bookNumber: 10,
    bookTitle: 'Call to Prayers (Adhaan)',
    chapterNumber: 30,
    chapterTitle: 'Superiority of the congregational Salat (prayer)',
    hadithNumber: 645,
    inBookReference: 'Book 10, Hadith 42',
    arabicExcerpt: 'صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً',
    topics: ['congregation', 'mosque', 'prayer', 'community'],
    relatedHadithIds: ['hadith-prayer-light'],
  },
] as const satisfies readonly HadithStage7Metadata[]);

export const fiqhStage7Metadata = Object.freeze([
  {
    entryId: 'qa-intention',
    topic: 'Intention in worship',
    reviewedAt: '2026-08-26',
    supportingReferences: ['Sahih al-Bukhari, Hadith 1'],
    madhhabPositions: [
      {
        madhhab: 'hanafi',
        summary:
          'The intention is fundamentally the resolve of the heart. Hanafi prayer rules discuss its timing with the opening of worship; spoken wording may assist concentration but does not replace the heart.',
        sourceId: 'fiqh-hanafi-hidayah',
      },
      {
        madhhab: 'maliki',
        summary:
          'The decisive intention is in the heart and identifies the act of worship being performed. A fixed verbal formula is not required for the intention itself.',
        sourceId: 'fiqh-maliki-risalah',
      },
      {
        madhhab: 'shafii',
        summary:
          'The intention is an act of the heart and, in the school’s formal prayer rules, accompanies entry into the prayer with the opening takbir.',
        sourceId: 'fiqh-shafii-majmu',
      },
      {
        madhhab: 'hanbali',
        summary:
          'The intention is located in the heart and is tied to entering the act of worship. Merely pronouncing words is not itself the legal intention.',
        sourceId: 'fiqh-hanbali-mughni',
      },
    ],
  },
  {
    entryId: 'qa-prayer-doubt',
    topic: 'Doubt and prostration of forgetfulness',
    reviewedAt: '2026-08-26',
    supportingReferences: ['al-Hidayah', 'al-Risalah', 'al-Majmu‘', 'al-Mughni'],
    madhhabPositions: [
      {
        madhhab: 'hanafi',
        summary:
          'Hanafi law has a detailed sujud al-sahw procedure and ordinarily places the prescribed prostrations after the final sitting and salam according to the school’s standard method.',
        sourceId: 'fiqh-hanafi-hidayah',
      },
      {
        madhhab: 'maliki',
        summary:
          'Maliki law distinguishes causes involving deficiency and addition; that distinction materially affects whether the prostrations are performed before or after salam.',
        sourceId: 'fiqh-maliki-risalah',
      },
      {
        madhhab: 'shafii',
        summary:
          'The standard Shafi‘i treatment places sujud al-sahw before salam while preserving detailed rules for the kinds of doubt or omission that call for it.',
        sourceId: 'fiqh-shafii-majmu',
      },
      {
        madhhab: 'hanbali',
        summary:
          'Hanbali law preserves both before-salam and after-salam cases according to the cause and the transmitted Prophetic precedents rather than imposing one placement on every case.',
        sourceId: 'fiqh-hanbali-mughni',
      },
    ],
  },
  {
    entryId: 'qa-travel-prayer',
    topic: 'Traveller prayer and qasr',
    reviewedAt: '2026-08-26',
    supportingReferences: ['Qur’an 4:101', 'al-Hidayah', 'al-Risalah', 'al-Majmu‘', 'al-Mughni'],
    madhhabPositions: [
      {
        madhhab: 'hanafi',
        summary:
          'For a qualifying traveller, the Hanafi school treats shortening the four-rak‘ah obligatory prayers as the operative traveller prayer, subject to its own travel and residence thresholds.',
        sourceId: 'fiqh-hanafi-hidayah',
      },
      {
        madhhab: 'maliki',
        summary:
          'The Maliki school treats qasr as an emphasized Prophetic practice for qualifying travel, with school-specific conditions governing distance and intended stay.',
        sourceId: 'fiqh-maliki-risalah',
      },
      {
        madhhab: 'shafii',
        summary:
          'The Shafi‘i school treats qasr as a permitted concession for qualifying travel; completing the prayer remains valid, subject to the school’s travel and stay conditions.',
        sourceId: 'fiqh-shafii-majmu',
      },
      {
        madhhab: 'hanbali',
        summary:
          'The Hanbali school treats qasr as a strongly established concession and Prophetic practice for qualifying travel, with its own distance and intended-stay rules.',
        sourceId: 'fiqh-hanbali-mughni',
      },
    ],
  },
] as const satisfies readonly FiqhStage7Metadata[]);

export function getHadithStage7Metadata(entryId: string): HadithStage7Metadata | null {
  return hadithStage7Metadata.find((metadata) => metadata.entryId === entryId) ?? null;
}

export function getFiqhStage7Metadata(entryId: string): FiqhStage7Metadata | null {
  return fiqhStage7Metadata.find((metadata) => metadata.entryId === entryId) ?? null;
}

export function stage7SearchText(entryId: string): string {
  const hadith = getHadithStage7Metadata(entryId);
  if (hadith) {
    return [hadith.bookTitle, hadith.chapterTitle, hadith.inBookReference, hadith.arabicExcerpt, ...hadith.topics].join(' ');
  }
  const fiqh = getFiqhStage7Metadata(entryId);
  if (!fiqh) return '';
  return [
    fiqh.topic,
    fiqh.reviewedAt,
    ...fiqh.supportingReferences,
    ...fiqh.madhhabPositions.flatMap((position) => [position.madhhab, position.summary, position.sourceId]),
  ].join(' ');
}
'''
)

Path("src/domain/islamicKnowledgeStage7.test.ts").write_text(
    r'''import { describe, expect, it } from 'vitest';

import {
  getIslamicKnowledgeEntryById,
  islamicKnowledgeEntries,
  type HadithKnowledgeEntry,
  type QaKnowledgeEntry,
} from './islamicKnowledge';
import { getIslamicKnowledgeSource } from './islamicKnowledgeGovernance';
import { getFiqhStage7Metadata, getHadithStage7Metadata } from './islamicKnowledgeStage7';

const requiredMadhhabs = ['hanafi', 'maliki', 'shafii', 'hanbali'] as const;

describe('Stage 7 Hadith and Fiqh knowledge metadata', () => {
  it('enriches every shipped Hadith with governed Arabic and collection navigation metadata', () => {
    const hadithEntries = islamicKnowledgeEntries.filter(
      (entry): entry is HadithKnowledgeEntry => entry.module === 'hadith',
    );
    expect(hadithEntries).toHaveLength(3);

    for (const entry of hadithEntries) {
      const metadata = getHadithStage7Metadata(entry.id);
      expect(metadata).not.toBeNull();
      if (!metadata) throw new Error(`Missing Stage 7 Hadith metadata for ${entry.id}`);
      expect(metadata.arabicExcerpt.trim().length).toBeGreaterThan(10);
      expect(metadata.bookNumber).toBeGreaterThan(0);
      expect(metadata.bookTitle.trim().length).toBeGreaterThan(3);
      expect(metadata.chapterNumber).toBeGreaterThan(0);
      expect(metadata.chapterTitle.trim().length).toBeGreaterThan(3);
      expect(entry.reference).toBe(`Hadith ${String(metadata.hadithNumber)}`);
      expect(metadata.topics.length).toBeGreaterThan(0);
      expect(entry.sourceIds).toContain(metadata.sourceId);
      expect(getIslamicKnowledgeSource(metadata.sourceId)?.kind).toBe('hadith-collection');
      for (const relatedId of metadata.relatedHadithIds) {
        expect(relatedId).not.toBe(entry.id);
        expect(getIslamicKnowledgeEntryById(relatedId)?.module).toBe('hadith');
      }
    }
  });

  it('gives every current Fiqh Q&A four source-backed madhhab positions and audit metadata', () => {
    const fiqhEntries = islamicKnowledgeEntries.filter(
      (entry): entry is QaKnowledgeEntry => entry.module === 'qa' && entry.contentType === 'fiqh',
    );
    expect(fiqhEntries).toHaveLength(3);

    for (const entry of fiqhEntries) {
      const metadata = getFiqhStage7Metadata(entry.id);
      expect(metadata).not.toBeNull();
      if (!metadata) throw new Error(`Missing Stage 7 Fiqh metadata for ${entry.id}`);
      expect(metadata.topic.trim().length).toBeGreaterThan(3);
      expect(metadata.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(metadata.supportingReferences.length).toBeGreaterThan(0);
      expect(metadata.madhhabPositions.map((position) => position.madhhab)).toEqual(requiredMadhhabs);
      for (const position of metadata.madhhabPositions) {
        expect(position.summary.trim().length).toBeGreaterThan(60);
        expect(entry.sourceIds).toContain(position.sourceId);
        const source = getIslamicKnowledgeSource(position.sourceId);
        expect(source?.kind).toBe('fiqh');
        expect(source?.madhhabs).toContain(position.madhhab);
      }
    }
  });
});
'''
)

Path("src/ui/KnowledgeStage7Details.tsx").write_text(
    r'''import type { Locale } from '../i18n/translations';
import {
  getIslamicKnowledgeEntryById,
  type HadithKnowledgeEntry,
  type QaKnowledgeEntry,
} from '../domain/islamicKnowledge';
import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';
import { getFiqhStage7Metadata, getHadithStage7Metadata } from '../domain/islamicKnowledgeStage7';

const labels: Readonly<Record<Locale, Readonly<{
  book: string;
  chapter: string;
  hadithNumber: string;
  grade: string;
  gradingAuthority: string;
  topics: string;
  related: string;
  topic: string;
  reviewed: string;
  scholar: string;
  originalSources: string;
  supporting: string;
  madhhabViews: string;
  disagreement: string;
}>>> = {
  en: { book: 'Book', chapter: 'Chapter', hadithNumber: 'Hadith number', grade: 'Grade', gradingAuthority: 'Grading authority', topics: 'Topics', related: 'Related hadith', topic: 'Topic', reviewed: 'Reviewed', scholar: 'Scholar attribution', originalSources: 'Original sources', supporting: 'Supporting references', madhhabViews: 'Four-madhhab view', disagreement: 'Recognised disagreement' },
  ar: { book: 'الكتاب', chapter: 'الباب', hadithNumber: 'رقم الحديث', grade: 'الدرجة', gradingAuthority: 'جهة التصحيح', topics: 'الموضوعات', related: 'أحاديث ذات صلة', topic: 'الموضوع', reviewed: 'تاريخ المراجعة', scholar: 'نسبة العالم', originalSources: 'المصادر الأصلية', supporting: 'مراجع مساندة', madhhabViews: 'عرض المذاهب الأربعة', disagreement: 'الخلاف المعتبر' },
  tr: { book: 'Kitap', chapter: 'Bölüm', hadithNumber: 'Hadis numarası', grade: 'Derece', gradingAuthority: 'Derecelendiren', topics: 'Konular', related: 'İlgili hadisler', topic: 'Konu', reviewed: 'İnceleme tarihi', scholar: 'Âlim atfı', originalSources: 'Asıl kaynaklar', supporting: 'Destekleyici kaynaklar', madhhabViews: 'Dört mezhep görünümü', disagreement: 'Geçerli ihtilaf' },
  id: { book: 'Kitab', chapter: 'Bab', hadithNumber: 'Nomor hadis', grade: 'Derajat', gradingAuthority: 'Otoritas penilaian', topics: 'Topik', related: 'Hadis terkait', topic: 'Topik', reviewed: 'Ditinjau', scholar: 'Atribusi ulama', originalSources: 'Sumber asli', supporting: 'Referensi pendukung', madhhabViews: 'Pandangan empat mazhab', disagreement: 'Perbedaan yang diakui' },
};

const madhhabNames = { hanafi: 'Hanafi', maliki: 'Maliki', shafii: 'Shafi‘i', hanbali: 'Hanbali' } as const;

export function HadithStage7Details({ entry, locale, onSearchTopic, onNavigateHadith }: Readonly<{
  entry: HadithKnowledgeEntry;
  locale: Locale;
  onSearchTopic: (topic: string) => void;
  onNavigateHadith: (entryId: string) => void;
}>) {
  const copy = labels[locale];
  const metadata = getHadithStage7Metadata(entry.id);
  if (!metadata) return <p>{entry.text}</p>;
  const related = metadata.relatedHadithIds
    .map((entryId) => getIslamicKnowledgeEntryById(entryId))
    .filter((candidate): candidate is HadithKnowledgeEntry => candidate?.module === 'hadith');

  return (
    <>
      <p className="knowledge-card__arabic knowledge-card__arabic--hadith" lang="ar" dir="rtl" data-hadith-arabic>{metadata.arabicExcerpt}</p>
      <p data-hadith-translation>{entry.text}</p>
      <dl className="knowledge-source-list" data-hadith-metadata>
        <div><dt>{copy.book}</dt><dd data-hadith-book>{metadata.bookNumber} · {metadata.bookTitle}</dd></div>
        <div><dt>{copy.chapter}</dt><dd data-hadith-chapter>{metadata.chapterNumber} · {metadata.chapterTitle}</dd></div>
        <div><dt>{copy.hadithNumber}</dt><dd>{entry.collection} · {entry.reference} · {metadata.inBookReference}</dd></div>
        <div><dt>{copy.grade}</dt><dd>{entry.grade}</dd></div>
        <div><dt>{copy.gradingAuthority}</dt><dd>{entry.grader}</dd></div>
      </dl>
      <div className="knowledge-topics" data-hadith-topics>
        <strong>{copy.topics}</strong>
        <div className="knowledge-chip-row">
          {metadata.topics.map((topic) => <button type="button" key={topic} data-hadith-topic={topic} onClick={() => onSearchTopic(topic)}>{topic}</button>)}
        </div>
      </div>
      <div className="knowledge-related" data-hadith-related>
        <strong>{copy.related}</strong>
        <div>{related.map((relatedEntry) => <button type="button" key={relatedEntry.id} onClick={() => onNavigateHadith(relatedEntry.id)}>{relatedEntry.reference}</button>)}</div>
      </div>
      <p className="knowledge-card__source-note">{entry.sourceNote}</p>
    </>
  );
}

export function FiqhStage7Details({ entry, locale }: Readonly<{ entry: QaKnowledgeEntry; locale: Locale }>) {
  const copy = labels[locale];
  const metadata = getFiqhStage7Metadata(entry.id);
  if (!metadata) return <p>{entry.answer}</p>;
  return (
    <>
      <p>{entry.answer}</p>
      <dl className="knowledge-source-list" data-fiqh-audit>
        <div><dt>{copy.scholar}</dt><dd>{entry.scholar}</dd></div>
        <div><dt>{copy.originalSources}</dt><dd>{entry.sourceTitle}</dd></div>
        <div><dt>{copy.topic}</dt><dd data-fiqh-topic>{metadata.topic}</dd></div>
        <div><dt>{copy.reviewed}</dt><dd>{metadata.reviewedAt}</dd></div>
        <div><dt>{copy.supporting}</dt><dd data-fiqh-supporting>{metadata.supportingReferences.join(' · ')}</dd></div>
      </dl>
      <section className="knowledge-fiqh" data-fiqh-four-madhhab>
        <h4>{copy.madhhabViews}</h4>
        <div className="knowledge-fiqh-grid">
          {metadata.madhhabPositions.map((position) => {
            const source = getIslamicKnowledgeSource(position.sourceId);
            return <article key={position.madhhab} data-fiqh-madhhab={position.madhhab}><strong>{madhhabNames[position.madhhab]}</strong><p>{position.summary}</p><small>{source?.title ?? position.sourceId}</small></article>;
          })}
        </div>
      </section>
      {entry.disagreementNote ? <div className="knowledge-disagreement" data-fiqh-disagreement><strong>{copy.disagreement}</strong><p>{entry.disagreementNote}</p></div> : null}
      <p className="knowledge-card__source-note">{entry.sourceNote}</p>
    </>
  );
}
'''
)

replace_once(
    "src/domain/islamicKnowledge.ts",
    "export type IslamicKnowledgeModule = 'quran' | 'hadith' | 'qa';",
    "import { stage7SearchText } from './islamicKnowledgeStage7';\n\nexport type IslamicKnowledgeModule = 'quran' | 'hadith' | 'qa';",
)
replace_once(
    "src/domain/islamicKnowledge.ts",
    "      entry.sourceNote,\n      ...entry.sourceIds,\n      ...entry.tags,",
    "      entry.sourceNote,\n      stage7SearchText(entry.id),\n      ...entry.sourceIds,\n      ...entry.tags,",
)
replace_once(
    "src/domain/islamicKnowledge.ts",
    "    entry.disagreementNote ?? '',\n    ...entry.sourceIds,",
    "    entry.disagreementNote ?? '',\n    stage7SearchText(entry.id),\n    ...entry.sourceIds,",
)
replace_once(
    "package.json",
    '"knowledge:content:check": "vitest run src/domain/islamicKnowledgeGovernance.test.ts"',
    '"knowledge:content:check": "vitest run src/domain/islamicKnowledgeGovernance.test.ts src/domain/islamicKnowledgeStage7.test.ts"',
)

replace_once(
    "src/ui/KnowledgeScreen.tsx",
    "import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';",
    "import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';\nimport { FiqhStage7Details, HadithStage7Details } from './KnowledgeStage7Details';",
)
replace_once("src/ui/KnowledgeScreen.tsx", "  hadith: string;\n  qa: string;", "  hadith: string;\n  fiqh: string;\n  qa: string;")
replace_once("src/ui/KnowledgeScreen.tsx", "    hadith: 'Hadith',\n    qa: 'Q&A',", "    hadith: 'Hadith',\n    fiqh: 'Fiqh',\n    qa: 'Q&A',")
replace_once("src/ui/KnowledgeScreen.tsx", "    hadith: 'الحديث',\n    qa: 'سؤال وجواب',", "    hadith: 'الحديث',\n    fiqh: 'الفقه',\n    qa: 'سؤال وجواب',")
replace_once("src/ui/KnowledgeScreen.tsx", "    hadith: 'Hadis',\n    qa: 'Soru & Cevap',", "    hadith: 'Hadis',\n    fiqh: 'Fıkıh',\n    qa: 'Soru & Cevap',")
replace_once("src/ui/KnowledgeScreen.tsx", "    hadith: 'Hadis',\n    qa: 'Tanya & Jawab',", "    hadith: 'Hadis',\n    fiqh: 'Fikih',\n    qa: 'Tanya & Jawab',")
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    "const copy: Readonly<Record<Locale, KnowledgeCopy>> = {",
    "type KnowledgeFilter = IslamicKnowledgeModule | 'fiqh' | 'all';\n\nconst copy: Readonly<Record<Locale, KnowledgeCopy>> = {",
)

replace_once(
    "src/ui/KnowledgeScreen.tsx",
    '''function KnowledgeEntryCard({
  entry,
  labels,
  quranPreferences,
  onToggleBookmark,
  onMarkLastRead,
  onOpenRelated,
  onShareStatus,
}: Readonly<{
  entry: IslamicKnowledgeEntry;
  labels: KnowledgeCopy;
  quranPreferences: QuranReadingPreferences;
  onToggleBookmark: (entryId: string) => void;
  onMarkLastRead: (entryId: string) => void;
  onOpenRelated: (entryId: string) => void;
  onShareStatus: (message: string) => void;
}>) {''',
    '''function KnowledgeEntryCard({
  entry,
  labels,
  locale,
  quranPreferences,
  onToggleBookmark,
  onMarkLastRead,
  onOpenRelated,
  onSearchHadithTopic,
  onNavigateHadith,
  onShareStatus,
}: Readonly<{
  entry: IslamicKnowledgeEntry;
  labels: KnowledgeCopy;
  locale: Locale;
  quranPreferences: QuranReadingPreferences;
  onToggleBookmark: (entryId: string) => void;
  onMarkLastRead: (entryId: string) => void;
  onOpenRelated: (entryId: string) => void;
  onSearchHadithTopic: (topic: string) => void;
  onNavigateHadith: (entryId: string) => void;
  onShareStatus: (message: string) => void;
}>) {''',
)
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    '''  if (entry.module === 'hadith') {
    return (
      <article className="knowledge-card" data-knowledge-module="hadith">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.hadith}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <p>{entry.text}</p>
        <dl className="knowledge-source-list">
          <div>
            <dt>{labels.collection}</dt>
            <dd>
              {entry.collection} · {entry.reference}
            </dd>
          </div>
          <div>
            <dt>{labels.grade}</dt>
            <dd>{entry.grade}</dd>
          </div>
          <div>
            <dt>{labels.gradedBy}</dt>
            <dd>{entry.grader}</dd>
          </div>
        </dl>
      </article>
    );
  }''',
    '''  if (entry.module === 'hadith') {
    return (
      <article className="knowledge-card knowledge-card--hadith" data-knowledge-module="hadith">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.hadith}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <HadithStage7Details entry={entry} locale={locale} onSearchTopic={onSearchHadithTopic} onNavigateHadith={onNavigateHadith} />
      </article>
    );
  }''',
)
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    '''  return (
    <article className="knowledge-card" data-knowledge-module="qa">
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">{labels.qa}</span>
        <span className="knowledge-offline">{labels.offline}</span>
      </div>
      <h3>{entry.question}</h3>
      <p>{entry.answer}</p>
      <dl className="knowledge-source-list">
        <div>
          <dt>{labels.scholar}</dt>
          <dd>{entry.scholar}</dd>
        </div>
        <div>
          <dt>{labels.source}</dt>
          <dd>{entry.sourceTitle}</dd>
        </div>
      </dl>
      <p className="knowledge-card__source-note">{entry.sourceNote}</p>
    </article>
  );''',
    '''  return (
    <article className="knowledge-card knowledge-card--fiqh" data-knowledge-module="qa" data-knowledge-content-type={entry.contentType}>
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">{entry.contentType === 'fiqh' ? labels.fiqh : labels.qa}</span>
        <span className="knowledge-offline">{labels.offline}</span>
      </div>
      <h3>{entry.question}</h3>
      {entry.contentType === 'fiqh' ? <FiqhStage7Details entry={entry} locale={locale} /> : <p>{entry.answer}</p>}
    </article>
  );''',
)
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    "  const [module, setModule] = useState<IslamicKnowledgeModule | 'all'>('all');",
    "  const [module, setModule] = useState<KnowledgeFilter>('all');",
)
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    '''  const entries = useMemo(() => {
    const filtered = filterIslamicKnowledge(module, query);
    if (!bookmarksOnly) return filtered;
    return filtered.filter(
      (entry) => entry.module === 'quran' && quranPreferences.bookmarkedAyahIds.includes(entry.id),
    );
  }, [bookmarksOnly, module, query, quranPreferences.bookmarkedAyahIds]);''',
    '''  const entries = useMemo(() => {
    const baseModule: IslamicKnowledgeModule | 'all' = module === 'fiqh' ? 'qa' : module;
    const filtered = filterIslamicKnowledge(baseModule, query);
    const scoped =
      module === 'fiqh'
        ? filtered.filter((entry) => entry.module === 'qa' && entry.contentType === 'fiqh')
        : filtered;
    if (!bookmarksOnly) return scoped;
    return scoped.filter(
      (entry) => entry.module === 'quran' && quranPreferences.bookmarkedAyahIds.includes(entry.id),
    );
  }, [bookmarksOnly, module, query, quranPreferences.bookmarkedAyahIds]);''',
)
replace_once("src/ui/KnowledgeScreen.tsx", "    id: IslamicKnowledgeModule | 'all';", "    id: KnowledgeFilter;")
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    "    { id: 'hadith', label: labels.hadith },\n    { id: 'qa', label: labels.qa },",
    "    { id: 'hadith', label: labels.hadith },\n    { id: 'fiqh', label: labels.fiqh },\n    { id: 'qa', label: labels.qa },",
)
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    "              labels={labels}\n              quranPreferences={quranPreferences}",
    "              labels={labels}\n              locale={locale}\n              quranPreferences={quranPreferences}",
)
replace_once(
    "src/ui/KnowledgeScreen.tsx",
    '''              onOpenRelated={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'quran') return;
                setModule('quran');
                setBookmarksOnly(false);
                setQuery(related.reference.replace('Qur’an ', ''));
              }}
              onShareStatus={setShareStatus}''',
    '''              onOpenRelated={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'quran') return;
                setModule('quran');
                setBookmarksOnly(false);
                setQuery(related.reference.replace('Qur’an ', ''));
              }}
              onSearchHadithTopic={(topic) => {
                setModule('hadith');
                setBookmarksOnly(false);
                setQuery(topic);
              }}
              onNavigateHadith={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'hadith') return;
                setModule('hadith');
                setBookmarksOnly(false);
                setQuery(related.reference);
              }}
              onShareStatus={setShareStatus}''',
)

css_path = Path("src/islamic-knowledge.css")
css_path.write_text(
    css_path.read_text()
    + r'''

/* Stage 56 — Hadith and Fiqh knowledge expansion */
.knowledge-card--hadith .knowledge-card__arabic--hadith { margin-block-end: 0.6rem; }
.knowledge-chip-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.knowledge-chip-row button,
.knowledge-fiqh-grid article { border: 1px solid var(--salah-border-subtle); border-radius: var(--salah-radius-md); background: color-mix(in srgb, var(--salah-fg-accent) 5%, var(--salah-bg-surface)); }
.knowledge-chip-row button { min-height: 2.25rem; padding-inline: 0.75rem; }
.knowledge-fiqh { display: grid; gap: 0.75rem; margin-block-start: 1rem; }
.knowledge-fiqh h4 { margin: 0; }
.knowledge-fiqh-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.knowledge-fiqh-grid article { min-width: 0; padding: 0.85rem; }
.knowledge-fiqh-grid article p { margin-block: 0.45rem; font-size: var(--salah-text-sm); }
.knowledge-fiqh-grid article small { color: var(--salah-fg-tertiary); overflow-wrap: anywhere; }
.knowledge-disagreement { margin-block-start: 0.9rem; padding: 0.85rem; border-inline-start: 3px solid var(--salah-fg-accent); border-radius: var(--salah-radius-sm); background: color-mix(in srgb, var(--salah-fg-accent) 6%, var(--salah-bg-surface)); }
.knowledge-disagreement p { margin-block-end: 0; }
@media (max-width: 760px) { .knowledge-fiqh-grid { grid-template-columns: minmax(0, 1fr); } }
'''
)

visual = Path("scripts/visual-islamic-knowledge.mjs")
visual_text = visual.read_text()
old_visual = '''    await screen.locator('[data-knowledge-filter="hadith"]').click();
    assert(
      (await screen.locator('.knowledge-card').count()) === 3,
      'Hadith filter did not isolate entries',
    );

    await screen.locator('[data-knowledge-filter="all"]').click();'''
new_visual = '''    await screen.locator('[data-knowledge-filter="hadith"]').click();
    assert(
      (await screen.locator('.knowledge-card').count()) === 3,
      'Hadith filter did not isolate entries',
    );
    assert((await screen.locator('[data-hadith-arabic]').count()) === 3, 'Hadith Arabic excerpts are missing');
    assert(
      (await screen.locator('[data-hadith-book]').count()) === 3 &&
        (await screen.locator('[data-hadith-chapter]').count()) === 3,
      'Hadith book/chapter metadata is missing',
    );
    await screen.locator('[data-hadith-topic="intention"]').click();
    assert((await screen.locator('[data-knowledge-module="hadith"]').count()) === 1, 'Hadith topic navigation did not isolate the intention entry');
    await screen.getByRole('searchbox').fill('');
    await screen.locator('[data-hadith-related] button').first().click();
    assert((await screen.locator('[data-knowledge-module="hadith"]').count()) === 1, 'Related Hadith navigation did not isolate its target');
    await screen.getByRole('searchbox').fill('');

    await screen.locator('[data-knowledge-filter="fiqh"]').click();
    assert((await screen.locator('[data-knowledge-content-type="fiqh"]').count()) === 3, 'First-class Fiqh filter did not isolate the governed Fiqh entries');
    assert((await screen.locator('[data-fiqh-madhhab]').count()) === 12, 'Four-madhhab Fiqh views are incomplete');

    await screen.locator('[data-knowledge-filter="all"]').click();'''
if visual_text.count(old_visual) != 1:
    raise SystemExit("visual acceptance insertion point mismatch")
visual_text = visual_text.replace(old_visual, new_visual, 1)
visual_text = visual_text.replace("stage55-quran-expansion-mobile.png", "stage56-hadith-fiqh-expansion-mobile.png")
visual_text = visual_text.replace("stage55-quran-expansion-rtl.png", "stage56-hadith-fiqh-expansion-rtl.png")
visual_text = visual_text.replace("stage55-quran-expansion-results.json", "stage56-hadith-fiqh-expansion-results.json")
visual_text = visual_text.replace("Stage 55 Quran expansion acceptance passed", "Stage 56 Hadith and Fiqh acceptance passed")
visual.write_text(visual_text)

docs = Path("docs/ISLAMIC_KNOWLEDGE_GOVERNANCE.md")
docs_text = docs.read_text()
docs_text = docs_text.replace(
    "Later Stage 7 work may add school-specific views and more granular citations. This Stage 5 policy is the minimum governance contract those additions must preserve.",
    "Stage 7 adds school-specific views while preserving this Stage 5 minimum governance contract. Every displayed Hanafi, Maliki, Shafi‘i and Hanbali position points back to the corresponding approved source lane already attached to the governed Q&A entry.",
)
docs.write_text(
    docs_text
    + r'''

## Stage 7 Hadith and Fiqh enrichment

Stage 7 keeps the governed catalogue as the source of truth and adds auditable companion metadata in `src/domain/islamicKnowledgeStage7.ts`.

Each shipped Hadith now carries its canonical collection and hadith number together with book/chapter navigation, a concise Arabic excerpt, the existing English rendering, grade/grading authority, searchable topics and related-Hadith links. Companion metadata is accepted only when its source ID is already an approved Hadith source on the governed base entry.

Current Fiqh Q&A now has a first-class Fiqh navigation view. Each topic carries a review date, supporting references and four distinct school positions. Each Hanafi, Maliki, Shafi‘i and Hanbali position points to that school’s approved classical source rather than being presented as an unattributed universal ruling.

`src/domain/islamicKnowledgeStage7.test.ts` is part of the permanent `knowledge:content:check` gate. It rejects missing Hadith metadata, invalid related-Hadith links, unapproved Hadith source linkage, missing Fiqh audit fields, incomplete four-school position sets or a school position whose source is not approved for that madhhab.
'''
)
