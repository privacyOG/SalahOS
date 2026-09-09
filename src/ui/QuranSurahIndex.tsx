import { useMemo, useState } from 'react';

import {
  searchQuranOfflineSurahs,
  type QuranOfflinePack,
  type QuranRevelationPlace,
} from '../domain/quranOfflineLibrary';

const emptySearchLabels: Readonly<Record<string, string>> = Object.freeze({
  'Find a surah': 'No surahs match this search.',
  'ابحث عن سورة': 'لا توجد سورة مطابقة لهذا البحث.',
  'Sure bul': 'Bu aramayla eşleşen sure yok.',
  'Cari surah': 'Tidak ada surah yang cocok dengan pencarian ini.',
});

function emptySearchLabel(searchLabel: string, override?: string): string {
  return override ?? emptySearchLabels[searchLabel] ?? 'No surahs match this search.';
}

export function QuranSurahIndex(
  props: Readonly<{
    pack: QuranOfflinePack;
    selectedSurah: number;
    searchLabel: string;
    searchPlaceholder: string;
    emptyLabel?: string;
    ayahCountLabel: string;
    revelationLabel: Readonly<Record<QuranRevelationPlace, string>>;
    onSelect: (surah: number) => void;
  }>,
) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchQuranOfflineSurahs(props.pack, query), [props.pack, query]);
  const emptySearch = query.trim().length > 0 && results.length === 0;

  return (
    <section className="quran-surah-index" data-quran-surah-index>
      <label className="quran-surah-index__search">
        <span>{props.searchLabel}</span>
        <input
          type="search"
          value={query}
          placeholder={props.searchPlaceholder}
          data-quran-surah-search
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
      </label>
      {emptySearch ? (
        <p className="knowledge-empty" role="status" data-quran-surah-search-empty>
          {emptySearchLabel(props.searchLabel, props.emptyLabel)}
        </p>
      ) : (
        <div className="quran-surah-index__results" role="listbox" aria-label={props.searchLabel}>
          {results.map((surah) => (
            <button
              key={surah.surah}
              type="button"
              role="option"
              aria-selected={surah.surah === props.selectedSurah}
              className="quran-surah-index__option"
              data-quran-surah-option={surah.surah}
              onClick={() => {
                props.onSelect(surah.surah);
              }}
            >
              <span className="quran-surah-index__number">{String(surah.surah)}</span>
              <span className="quran-surah-index__names">
                <strong className="quran-uthmani-script" lang="ar" dir="rtl">
                  {surah.nameArabic}
                </strong>
                <span lang="en-Latn" dir="ltr">
                  {surah.nameTransliteration}
                </span>
              </span>
              <span className="quran-surah-index__meta">
                {String(surah.ayahCount)} {props.ayahCountLabel} ·{' '}
                {props.revelationLabel[surah.revelationPlace]}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
