import { useMemo, useState } from 'react';

import '../hadith-library.css';

import {
  islamicKnowledgeEntries,
  type HadithKnowledgeEntry,
} from '../domain/islamicKnowledge';
import {
  NAWAWI_COLLECTION_AUTHOR,
  NAWAWI_COLLECTION_AUTHOR_ALIASES,
  NAWAWI_COLLECTION_ID,
  NAWAWI_COLLECTION_TITLE,
  nawawiHadithEntries,
  type HadithLibraryContentBlock,
} from '../domain/nawawiHadithCollection';
import { getHadithStage7Metadata } from '../domain/islamicKnowledgeStage7';
import type { Locale } from '../i18n/translations';

type HadithLibraryCopy = Readonly<{
  eyebrow: string;
  title: string;
  intro: string;
  browse: string;
  search: string;
  searchPlaceholder: string;
  scholar: string;
  collection: string;
  allScholars: string;
  allCollections: string;
  results: string;
  noResults: string;
  offline: string;
  source: string;
  grade: string;
  reference: string;
  entries: string;
}>;

type HadithLibraryRecord = Readonly<{
  id: string;
  sortNumber: number;
  title: string;
  author: string;
  authorAliases: readonly string[];
  collectionId: string;
  collection: string;
  reference: string | null;
  grade: string | null;
  blocks: readonly HadithLibraryContentBlock[];
  sourceNote: string;
  tags: readonly string[];
}>;

type CollectionDirectoryEntry = Readonly<{
  author: string;
  collectionId: string;
  collection: string;
  count: number;
}>;

const copy: Readonly<Record<Locale, HadithLibraryCopy>> = {
  en: {
    eyebrow: 'Hadith library',
    title: 'Browse hadith by scholar and collection',
    intro:
      'Choose a scholar or collection, or search across titles, hadith text, scholar names, collections and references. The library remains available offline.',
    browse: 'Scholars & collections',
    search: 'Search hadith',
    searchPlaceholder: 'Title, text, scholar, collection or reference…',
    scholar: 'Scholar / compiler',
    collection: 'Collection',
    allScholars: 'All scholars',
    allCollections: 'All collections',
    results: 'results',
    noResults: 'No hadith match the current search and filters.',
    offline: 'Available offline',
    source: 'Source',
    grade: 'Grade',
    reference: 'Reference',
    entries: 'entries',
  },
  ar: {
    eyebrow: 'مكتبة الحديث',
    title: 'تصفح الحديث حسب العالم والمجموعة',
    intro:
      'اختر العالم أو المجموعة، أو ابحث في العناوين والنصوص وأسماء العلماء والمجموعات والمراجع. المكتبة متاحة دون اتصال.',
    browse: 'العلماء والمجموعات',
    search: 'البحث في الحديث',
    searchPlaceholder: 'العنوان، النص، العالم، المجموعة أو المرجع…',
    scholar: 'العالم / المصنف',
    collection: 'المجموعة',
    allScholars: 'كل العلماء',
    allCollections: 'كل المجموعات',
    results: 'نتائج',
    noResults: 'لا توجد أحاديث مطابقة للبحث والمرشحات الحالية.',
    offline: 'متاح دون اتصال',
    source: 'المصدر',
    grade: 'الدرجة',
    reference: 'المرجع',
    entries: 'أحاديث',
  },
  tr: {
    eyebrow: 'Hadis kütüphanesi',
    title: 'Hadisleri âlim ve koleksiyona göre inceleyin',
    intro:
      'Bir âlim veya koleksiyon seçin ya da başlık, hadis metni, âlim adı, koleksiyon ve kaynaklarda arama yapın. Kütüphane çevrimdışı kullanılabilir.',
    browse: 'Âlimler ve koleksiyonlar',
    search: 'Hadis ara',
    searchPlaceholder: 'Başlık, metin, âlim, koleksiyon veya kaynak…',
    scholar: 'Âlim / derleyen',
    collection: 'Koleksiyon',
    allScholars: 'Tüm âlimler',
    allCollections: 'Tüm koleksiyonlar',
    results: 'sonuç',
    noResults: 'Geçerli arama ve filtrelerle eşleşen hadis yok.',
    offline: 'Çevrimdışı kullanılabilir',
    source: 'Kaynak',
    grade: 'Derece',
    reference: 'Referans',
    entries: 'kayıt',
  },
  id: {
    eyebrow: 'Pustaka hadis',
    title: 'Jelajahi hadis berdasarkan ulama dan koleksi',
    intro:
      'Pilih ulama atau koleksi, atau cari berdasarkan judul, teks hadis, nama ulama, koleksi, dan referensi. Pustaka tetap tersedia luring.',
    browse: 'Ulama & koleksi',
    search: 'Cari hadis',
    searchPlaceholder: 'Judul, teks, ulama, koleksi, atau referensi…',
    scholar: 'Ulama / penyusun',
    collection: 'Koleksi',
    allScholars: 'Semua ulama',
    allCollections: 'Semua koleksi',
    results: 'hasil',
    noResults: 'Tidak ada hadis yang cocok dengan pencarian dan filter saat ini.',
    offline: 'Tersedia luring',
    source: 'Sumber',
    grade: 'Derajat',
    reference: 'Referensi',
    entries: 'entri',
  },
};

function legacyAuthor(entry: HadithKnowledgeEntry): Readonly<{
  name: string;
  aliases: readonly string[];
  collectionId: string;
}> {
  if (entry.collection.toLocaleLowerCase().includes('bukhari')) {
    return {
      name: 'Imam al-Bukhari',
      aliases: ['Imam Bukhari', 'al-Bukhari', 'Bukhari'],
      collectionId: 'sahih-al-bukhari-curated',
    };
  }
  if (entry.collection.toLocaleLowerCase().includes('muslim')) {
    return {
      name: 'Imam Muslim',
      aliases: ['Muslim ibn al-Hajjaj', 'Sahih Muslim', 'Muslim'],
      collectionId: 'sahih-muslim-curated',
    };
  }
  return {
    name: entry.grader,
    aliases: [entry.grader],
    collectionId: `curated-${entry.collection.toLocaleLowerCase().replace(/[^a-z0-9]+/gu, '-')}`,
  };
}

const legacyHadithEntries = islamicKnowledgeEntries.filter(
  (entry): entry is HadithKnowledgeEntry => entry.module === 'hadith',
);

const libraryRecords: readonly HadithLibraryRecord[] = Object.freeze(
  [
    ...nawawiHadithEntries.map(
      (entry): HadithLibraryRecord => ({
        id: entry.id,
        sortNumber: entry.number,
        title: entry.title,
        author: NAWAWI_COLLECTION_AUTHOR,
        authorAliases: NAWAWI_COLLECTION_AUTHOR_ALIASES,
        collectionId: NAWAWI_COLLECTION_ID,
        collection: NAWAWI_COLLECTION_TITLE,
        reference: `Hadith ${String(entry.number)}`,
        grade: null,
        blocks: entry.blocks,
        sourceNote: 'Text transcribed from the user-provided “The Forty Nawawi Hadiths” document.',
        tags: ['nawawi', 'forty hadith', 'arbaeen'],
      }),
    ),
    ...legacyHadithEntries.map((entry): HadithLibraryRecord => {
      const author = legacyAuthor(entry);
      const metadata = getHadithStage7Metadata(entry.id);
      const blocks: HadithLibraryContentBlock[] = [];
      if (metadata?.arabicExcerpt) {
        blocks.push({ kind: 'arabic', text: metadata.arabicExcerpt });
      }
      blocks.push({ kind: 'text', text: entry.text });
      return {
        id: entry.id,
        sortNumber: Number.parseInt(entry.reference.match(/\d+/u)?.[0] ?? '0', 10),
        title: entry.title,
        author: author.name,
        authorAliases: author.aliases,
        collectionId: author.collectionId,
        collection: entry.collection,
        reference: entry.reference,
        grade: entry.grade,
        blocks,
        sourceNote: entry.sourceNote,
        tags: entry.tags,
      };
    }),
  ].sort((left, right) => {
    const author = left.author.localeCompare(right.author, 'en', { sensitivity: 'base' });
    if (author !== 0) return author;
    const collection = left.collection.localeCompare(right.collection, 'en', { sensitivity: 'base' });
    if (collection !== 0) return collection;
    return left.sortNumber - right.sortNumber;
  }),
);

function searchableText(record: HadithLibraryRecord): string {
  return [
    record.title,
    record.author,
    ...record.authorAliases,
    record.collection,
    record.reference ?? '',
    record.grade ?? '',
    record.sourceNote,
    ...record.tags,
    ...record.blocks.map((block) => block.text),
  ]
    .join(' ')
    .toLocaleLowerCase();
}

function collectionDirectory(records: readonly HadithLibraryRecord[]): readonly CollectionDirectoryEntry[] {
  const grouped = new Map<string, CollectionDirectoryEntry>();
  for (const record of records) {
    const key = `${record.author}\u0000${record.collectionId}`;
    const existing = grouped.get(key);
    grouped.set(key, {
      author: record.author,
      collectionId: record.collectionId,
      collection: record.collection,
      count: (existing?.count ?? 0) + 1,
    });
  }
  return [...grouped.values()].sort((left, right) => {
    const author = left.author.localeCompare(right.author, 'en', { sensitivity: 'base' });
    return author === 0
      ? left.collection.localeCompare(right.collection, 'en', { sensitivity: 'base' })
      : author;
  });
}

const directory = collectionDirectory(libraryRecords);
const scholarOptions = Object.freeze(
  [...new Set(directory.map((item) => item.author))].sort((left, right) =>
    left.localeCompare(right, 'en', { sensitivity: 'base' }),
  ),
);

export function HadithLibraryScreen({ locale }: Readonly<{ locale: Locale }>) {
  const labels = copy[locale];
  const [query, setQuery] = useState('');
  const [scholar, setScholar] = useState('all');
  const [collectionId, setCollectionId] = useState('all');

  const availableCollections = useMemo(
    () => directory.filter((item) => scholar === 'all' || item.author === scholar),
    [scholar],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return libraryRecords.filter((record) => {
      if (scholar !== 'all' && record.author !== scholar) return false;
      if (collectionId !== 'all' && record.collectionId !== collectionId) return false;
      return normalizedQuery.length === 0 || searchableText(record).includes(normalizedQuery);
    });
  }, [collectionId, query, scholar]);

  return (
    <main className="knowledge-screen hadith-library" data-knowledge-screen data-hadith-library>
      <header className="knowledge-hero hadith-library__hero">
        <p className="knowledge-hero__eyebrow">{labels.eyebrow}</p>
        <h1>{labels.title}</h1>
        <p>{labels.intro}</p>
        <p className="knowledge-hero__scope" data-hadith-library-result-count={filteredRecords.length}>
          {filteredRecords.length} {labels.results} · {labels.offline}
        </p>
      </header>

      <section className="hadith-library__directory" aria-labelledby="hadith-library-directory-title">
        <div className="hadith-library__section-heading">
          <h2 id="hadith-library-directory-title">{labels.browse}</h2>
          <span>{directory.length} {labels.collection.toLocaleLowerCase()}</span>
        </div>
        <div className="hadith-library__collection-grid">
          {directory.map((item) => (
            <button
              type="button"
              key={`${item.author}-${item.collectionId}`}
              className="hadith-library__collection-card"
              data-hadith-collection-card={item.collectionId}
              aria-pressed={scholar === item.author && collectionId === item.collectionId}
              onClick={() => {
                setScholar(item.author);
                setCollectionId(item.collectionId);
                setQuery('');
              }}
            >
              <strong>{item.author}</strong>
              <span>{item.collection}</span>
              <small>{item.count} {labels.entries}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="hadith-library__controls" aria-label={labels.search}>
        <label className="hadith-library__search">
          <span>{labels.search}</span>
          <input
            type="search"
            data-hadith-library-search
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        <label>
          <span>{labels.scholar}</span>
          <select
            data-hadith-scholar-select
            value={scholar}
            onChange={(event) => {
              setScholar(event.target.value);
              setCollectionId('all');
            }}
          >
            <option value="all">{labels.allScholars}</option>
            {scholarOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{labels.collection}</span>
          <select
            data-hadith-collection-select
            value={collectionId}
            onChange={(event) => {
              setCollectionId(event.target.value);
            }}
          >
            <option value="all">{labels.allCollections}</option>
            {availableCollections.map((item) => (
              <option key={`${item.author}-${item.collectionId}`} value={item.collectionId}>
                {item.collection}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filteredRecords.length === 0 ? (
        <p className="knowledge-empty" role="status">{labels.noResults}</p>
      ) : (
        <section className="hadith-library__results" aria-live="polite">
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className="hadith-library__record"
              data-hadith-library-entry={record.id}
              data-hadith-library-author={record.author}
              data-hadith-library-collection={record.collectionId}
            >
              <details>
                <summary>
                  <span className="hadith-library__record-title">
                    <strong>{record.title}</strong>
                    <span>{record.author} · {record.collection}</span>
                  </span>
                  {record.reference ? <span className="hadith-library__reference">{record.reference}</span> : null}
                </summary>
                <div className="hadith-library__record-body">
                  {record.blocks.map((block, index) =>
                    block.kind === 'arabic' ? (
                      <p
                        key={`${record.id}-block-${String(index)}`}
                        className="hadith-library__arabic"
                        lang="ar"
                        dir="rtl"
                        data-hadith-library-arabic
                      >
                        {block.text}
                      </p>
                    ) : (
                      <p key={`${record.id}-block-${String(index)}`} lang="en" dir="ltr">
                        {block.text}
                      </p>
                    ),
                  )}
                  <dl className="hadith-library__metadata">
                    <div>
                      <dt>{labels.scholar}</dt>
                      <dd>{record.author}</dd>
                    </div>
                    <div>
                      <dt>{labels.source}</dt>
                      <dd>{record.collection}</dd>
                    </div>
                    {record.reference ? (
                      <div>
                        <dt>{labels.reference}</dt>
                        <dd>{record.reference}</dd>
                      </div>
                    ) : null}
                    {record.grade ? (
                      <div>
                        <dt>{labels.grade}</dt>
                        <dd>{record.grade}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="hadith-library__source-note" role="note">{record.sourceNote}</p>
                </div>
              </details>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
