import type { Locale } from '../i18n/translations';
import { BidiText } from './BidiText';
import {
  getIslamicKnowledgeEntryById,
  type HadithKnowledgeEntry,
  type QaKnowledgeEntry,
} from '../domain/islamicKnowledge';
import { getIslamicKnowledgeSource } from '../domain/islamicKnowledgeGovernance';
import { getFiqhStage7Metadata, getHadithStage7Metadata } from '../domain/islamicKnowledgeStage7';
import { hadithFullTextUrl } from '../platform/hadithExternalActions';

const labels: Readonly<
  Record<
    Locale,
    Readonly<{
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
    }>
  >
> = {
  en: {
    book: 'Book',
    chapter: 'Chapter',
    hadithNumber: 'Hadith number',
    grade: 'Grade',
    gradingAuthority: 'Grading authority',
    topics: 'Topics',
    related: 'Related hadith',
    topic: 'Topic',
    reviewed: 'Reviewed',
    scholar: 'Scholar attribution',
    originalSources: 'Original sources',
    supporting: 'Supporting references',
    madhhabViews: 'Four-madhhab view',
    disagreement: 'Recognised disagreement',
  },
  ar: {
    book: 'الكتاب',
    chapter: 'الباب',
    hadithNumber: 'رقم الحديث',
    grade: 'الدرجة',
    gradingAuthority: 'جهة التصحيح',
    topics: 'الموضوعات',
    related: 'أحاديث ذات صلة',
    topic: 'الموضوع',
    reviewed: 'تاريخ المراجعة',
    scholar: 'نسبة العالم',
    originalSources: 'المصادر الأصلية',
    supporting: 'مراجع مساندة',
    madhhabViews: 'عرض المذاهب الأربعة',
    disagreement: 'الخلاف المعتبر',
  },
  tr: {
    book: 'Kitap',
    chapter: 'Bölüm',
    hadithNumber: 'Hadis numarası',
    grade: 'Derece',
    gradingAuthority: 'Derecelendiren',
    topics: 'Konular',
    related: 'İlgili hadisler',
    topic: 'Konu',
    reviewed: 'İnceleme tarihi',
    scholar: 'Âlim atfı',
    originalSources: 'Asıl kaynaklar',
    supporting: 'Destekleyici kaynaklar',
    madhhabViews: 'Dört mezhep görünümü',
    disagreement: 'Geçerli ihtilaf',
  },
  id: {
    book: 'Kitab',
    chapter: 'Bab',
    hadithNumber: 'Nomor hadis',
    grade: 'Derajat',
    gradingAuthority: 'Otoritas penilaian',
    topics: 'Topik',
    related: 'Hadis terkait',
    topic: 'Topik',
    reviewed: 'Ditinjau',
    scholar: 'Atribusi ulama',
    originalSources: 'Sumber asli',
    supporting: 'Referensi pendukung',
    madhhabViews: 'Pandangan empat mazhab',
    disagreement: 'Perbedaan yang diakui',
  },
};

const hadithCopy = {
  en: ['Isnad', 'Partial Arabic matn', 'Full text', 'Metadata unavailable'],
  ar: ['الإسناد', 'متن عربي جزئي', 'النص الكامل', 'البيانات غير متاحة'],
  tr: ['İsnad', 'Kısmi Arapça metin', 'Tam metin', 'Meta veri yok'],
  id: ['Isnad', 'Matan Arab sebagian', 'Teks lengkap', 'Metadata tidak ada'],
} as const satisfies Readonly<Record<Locale, readonly [string, string, string, string]>>;

const madhhabNames = {
  hanafi: 'Hanafi',
  maliki: 'Maliki',
  shafii: 'Shafi‘i',
  hanbali: 'Hanbali',
} as const;

export function HadithStage7Details({
  entry,
  locale,
  onSearchTopic,
  onNavigateHadith,
}: Readonly<{
  entry: HadithKnowledgeEntry;
  locale: Locale;
  onSearchTopic: (topic: string) => void;
  onNavigateHadith: (entryId: string) => void;
}>) {
  const copy = labels[locale];
  const metadata = getHadithStage7Metadata(entry.id);
  if (!metadata)
    return (
      <>
        <p lang={entry.translationPresentation.lang} dir={entry.translationPresentation.dir}>
          {entry.text}
        </p>
        <p
          className="knowledge-hadith-metadata-state"
          role="note"
          data-hadith-metadata-state="unavailable"
        >
          {hadithCopy[locale][3]}
        </p>
      </>
    );
  const related = metadata.relatedHadithIds
    .map((entryId) => getIslamicKnowledgeEntryById(entryId))
    .filter((candidate): candidate is HadithKnowledgeEntry => candidate?.module === 'hadith');
  const [isnadLabel, excerptLabel, fullTextLabel] = hadithCopy[locale];

  return (
    <>
      <p className="knowledge-hadith-excerpt-heading">
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
      </p>
      <p
        data-hadith-translation
        lang={entry.translationPresentation.lang}
        dir={entry.translationPresentation.dir}
      >
        {entry.text}
      </p>
      <dl className="knowledge-source-list" data-hadith-metadata>
        <div>
          <dt>{isnadLabel}</dt>
          <dd data-hadith-isnad data-knowledge-source-metadata lang="en" dir="ltr">
            {metadata.narrator} → Muhammad ﷺ
          </dd>
        </div>
        <div>
          <dt>{copy.book}</dt>
          <dd
            data-hadith-book
            data-knowledge-source-metadata
            lang={metadata.displayPresentation.lang}
            dir={metadata.displayPresentation.dir}
          >
            {metadata.bookNumber} · {metadata.bookTitle}
          </dd>
        </div>
        <div>
          <dt>{copy.chapter}</dt>
          <dd
            data-hadith-chapter
            data-knowledge-source-metadata
            lang={metadata.displayPresentation.lang}
            dir={metadata.displayPresentation.dir}
          >
            {metadata.chapterNumber} · {metadata.chapterTitle}
          </dd>
        </div>
        <div>
          <dt>{copy.hadithNumber}</dt>
          <dd
            data-knowledge-source-metadata
            lang={metadata.displayPresentation.lang}
            dir={metadata.displayPresentation.dir}
          >
            {entry.collection} · <BidiText>{entry.reference}</BidiText> · {metadata.inBookReference}
          </dd>
        </div>
        <div>
          <dt>{copy.grade}</dt>
          <dd
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {entry.grade}
          </dd>
        </div>
        <div>
          <dt>{copy.gradingAuthority}</dt>
          <dd
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {entry.grader}
          </dd>
        </div>
      </dl>
      <div className="knowledge-topics" data-hadith-topics>
        <strong>{copy.topics}</strong>
        <div className="knowledge-chip-row">
          {metadata.topics.map((topic) => (
            <button
              type="button"
              key={topic}
              data-hadith-topic={topic}
              onClick={() => {
                onSearchTopic(topic);
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
      <div className="knowledge-related" data-hadith-related>
        <strong>{copy.related}</strong>
        <div>
          {related.map((relatedEntry) => (
            <button
              type="button"
              key={relatedEntry.id}
              onClick={() => {
                onNavigateHadith(relatedEntry.id);
              }}
              data-hadith-related-reference
              lang={relatedEntry.referencePresentation.lang}
              dir={relatedEntry.referencePresentation.dir}
            >
              <BidiText>{relatedEntry.reference}</BidiText>
            </button>
          ))}
        </div>
      </div>
      <p
        className="knowledge-card__source-note"
        lang={entry.metadataPresentation.lang}
        dir={entry.metadataPresentation.dir}
      >
        {entry.sourceNote}
      </p>
    </>
  );
}

export function FiqhStage7Details({
  entry,
  locale,
}: Readonly<{ entry: QaKnowledgeEntry; locale: Locale }>) {
  const copy = labels[locale];
  const metadata = getFiqhStage7Metadata(entry.id);
  if (!metadata)
    return (
      <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>
        {entry.answer}
      </p>
    );
  return (
    <>
      <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>
        {entry.answer}
      </p>
      <dl className="knowledge-source-list" data-fiqh-audit>
        <div>
          <dt>{copy.scholar}</dt>
          <dd
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {entry.scholar}
          </dd>
        </div>
        <div>
          <dt>{copy.originalSources}</dt>
          <dd
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {entry.sourceTitle}
          </dd>
        </div>
        <div>
          <dt>{copy.topic}</dt>
          <dd
            data-fiqh-topic
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {metadata.topic}
          </dd>
        </div>
        <div>
          <dt>{copy.reviewed}</dt>
          <dd
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {metadata.reviewedAt}
          </dd>
        </div>
        <div>
          <dt>{copy.supporting}</dt>
          <dd
            data-fiqh-supporting
            data-knowledge-source-metadata
            lang={entry.metadataPresentation.lang}
            dir={entry.metadataPresentation.dir}
          >
            {metadata.supportingReferences.join(' · ')}
          </dd>
        </div>
      </dl>
      <section className="knowledge-fiqh" data-fiqh-four-madhhab>
        <h4>{copy.madhhabViews}</h4>
        <div className="knowledge-fiqh-grid">
          {metadata.madhhabPositions.map((position) => {
            const source = getIslamicKnowledgeSource(position.sourceId);
            return (
              <article key={position.madhhab} data-fiqh-madhhab={position.madhhab}>
                <strong>{madhhabNames[position.madhhab]}</strong>
                <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>
                  {position.summary}
                </p>
                <small
                  lang={source?.displayPresentation.lang ?? entry.metadataPresentation.lang}
                  dir={source?.displayPresentation.dir ?? entry.metadataPresentation.dir}
                >
                  {source?.title ?? position.sourceId}
                </small>
              </article>
            );
          })}
        </div>
      </section>
      {entry.disagreementNote ? (
        <div className="knowledge-disagreement" data-fiqh-disagreement>
          <strong>{copy.disagreement}</strong>
          <p lang={entry.metadataPresentation.lang} dir={entry.metadataPresentation.dir}>
            {entry.disagreementNote}
          </p>
        </div>
      ) : null}
      <p
        className="knowledge-card__source-note"
        lang={entry.metadataPresentation.lang}
        dir={entry.metadataPresentation.dir}
      >
        {entry.sourceNote}
      </p>
    </>
  );
}
