import { useMemo, useState } from 'react';

import {
  searchQuranOfflineSurahs,
  type QuranOfflinePack,
  type QuranRevelationPlace,
} from '../domain/quranOfflineLibrary';

export function QuranSurahIndex(props: Readonly<{
  pack: QuranOfflinePack;
  selectedSurah: number;
  searchLabel: string;
  searchPlaceholder: string;
  ayahCountLabel: string;
  revelationLabel: Readonly<Record<QuranRevelationPlace, string>>;
  onSelect: (surah: number) => void;
}>) {
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => searchQuranOfflineSurahs(props.pack, query),
    [props.pack, query],
  );

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
              <strong lang="ar" dir="rtl">{surah.nameArabic}</strong>
              <span lang="en-Latn" dir="ltr">{surah.nameTransliteration}</span>
            </span>
            <span className="quran-surah-index__meta">
              {String(surah.ayahCount)} {props.ayahCountLabel} ·{' '}
              {props.revelationLabel[surah.revelationPlace]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
