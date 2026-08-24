import { useEffect, useMemo, useState } from 'react';

import {
  australianMosqueDirectory,
  australianMosques,
  searchAustralianMosques,
  sortAustralianMosquesByDistance,
  type AustralianMosqueRecord,
} from '../domain/australianMosqueDirectory';
import type { Coordinates } from '../domain/coordinates';
import { localeTag } from '../i18n/i18n';
import { australianMosqueDirectoryCopy } from '../i18n/australianMosqueDirectoryTranslations';
import type { Locale } from '../i18n/translations';

const COLLAPSED_RESULT_LIMIT = 24;

interface AustralianMosqueDirectoryPanelProps {
  readonly locale: Locale;
  readonly savedCoordinates: Coordinates | null;
  readonly selectedProfileId: string | null;
  readonly followedProfileIds: readonly string[];
  readonly onUseMosque: (mosque: AustralianMosqueRecord) => void;
}

function formatDistance(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} km`;
}

function localizedDirectoryName(mosque: AustralianMosqueRecord, locale: Locale): string {
  return locale === 'ar' ? (mosque.nameAr ?? mosque.name) : mosque.name;
}

export function AustralianMosqueDirectoryPanel({
  locale,
  savedCoordinates,
  selectedProfileId,
  followedProfileIds,
  onUseMosque,
}: AustralianMosqueDirectoryPanelProps) {
  const [query, setQuery] = useState('');
  const [sortByDistance, setSortByDistance] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const text = australianMosqueDirectoryCopy[locale];
  const followedIds = useMemo(() => new Set(followedProfileIds), [followedProfileIds]);

  useEffect(() => {
    setExpanded(false);
  }, [query, sortByDistance]);

  const matchingMosques = useMemo(
    () => searchAustralianMosques(australianMosques, query),
    [query],
  );
  const rankedMosques = useMemo(() => {
    if (!sortByDistance || savedCoordinates === null) {
      return matchingMosques.map((mosque) => ({ mosque, distanceKm: null }));
    }
    return sortAustralianMosquesByDistance(matchingMosques, savedCoordinates);
  }, [matchingMosques, savedCoordinates, sortByDistance]);
  const visibleMosques = expanded
    ? rankedMosques
    : rankedMosques.slice(0, COLLAPSED_RESULT_LIMIT);

  return (
    <section
      className="australian-mosque-directory"
      aria-labelledby="australian-mosque-directory-title"
      data-directory-record-count={australianMosqueDirectory.source.recordCount}
    >
      <header className="australian-mosque-directory__header">
        <div>
          <div className="australian-mosque-directory__title-row">
            <h2 id="australian-mosque-directory-title">{text.title}</h2>
            <span>{text.offline}</span>
          </div>
          <p>{text.subtitle}</p>
        </div>
        <strong>{australianMosqueDirectory.source.recordCount}</strong>
      </header>

      <div className="australian-mosque-directory__controls">
        <label className="mosques-browser__search">
          <span>{text.search}</span>
          <input
            type="search"
            value={query}
            placeholder={text.searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            dir="auto"
          />
        </label>
        <div className="australian-mosque-directory__sort" role="group" aria-label={text.distance}>
          <button
            type="button"
            aria-pressed={!sortByDistance}
            onClick={() => {
              setSortByDistance(false);
            }}
          >
            {text.alphabetical}
          </button>
          <button
            type="button"
            aria-pressed={sortByDistance}
            disabled={savedCoordinates === null}
            onClick={() => {
              setSortByDistance(true);
            }}
          >
            {text.nearest}
          </button>
        </div>
      </div>

      {savedCoordinates === null ? (
        <p className="australian-mosque-directory__privacy-note">{text.locationNeeded}</p>
      ) : sortByDistance ? (
        <p className="australian-mosque-directory__privacy-note" role="status">
          {text.nearbyStatus}
        </p>
      ) : null}

      <p className="australian-mosque-directory__result-count" role="status">
        {new Intl.NumberFormat(localeTag(locale)).format(matchingMosques.length)} {text.results}
      </p>

      {visibleMosques.length === 0 ? (
        <div className="mosques-screen__empty">
          <p>{text.noMatch}</p>
        </div>
      ) : (
        <div className="mosque-summary-grid australian-mosque-directory__grid">
          {visibleMosques.map(({ mosque, distanceKm }) => {
            const selected = mosque.id === selectedProfileId;
            const followed = followedIds.has(mosque.id);
            return (
              <article
                className="mosque-summary-card australian-mosque-directory__card"
                data-directory-mosque-id={mosque.id}
                data-selected={selected}
                key={mosque.id}
              >
                <div className="mosque-summary-card__identity">
                  <h3>
                    <bdi>{localizedDirectoryName(mosque, locale)}</bdi>
                  </h3>
                  <p>{mosque.address}</p>
                  {distanceKm !== null && (
                    <span>
                      {text.distance}: {formatDistance(distanceKm, locale)}
                    </span>
                  )}
                </div>
                <div className="mosque-summary-card__actions">
                  <button
                    type="button"
                    aria-pressed={selected}
                    data-followed={followed}
                    disabled={selected}
                    onClick={() => {
                      onUseMosque(mosque);
                    }}
                  >
                    {selected ? text.selected : text.useMosque}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rankedMosques.length > COLLAPSED_RESULT_LIMIT && (
        <button
          type="button"
          className="quiet-button australian-mosque-directory__expand"
          onClick={() => {
            setExpanded((value) => !value);
          }}
        >
          {expanded ? text.showLess : text.showAll}
        </button>
      )}

      <footer className="australian-mosque-directory__source">
        <p>{text.attribution}</p>
        <p>
          {text.snapshot}:{' '}
          <time dateTime={australianMosqueDirectory.source.osmBaseTimestamp}>
            {new Intl.DateTimeFormat(localeTag(locale), { dateStyle: 'medium' }).format(
              new Date(australianMosqueDirectory.source.osmBaseTimestamp),
            )}
          </time>
        </p>
        <div>
          <a
            href={australianMosqueDirectory.source.attributionUrl}
            rel="noreferrer"
            target="_blank"
          >
            OpenStreetMap
          </a>
          <a href={australianMosqueDirectory.source.licenceUrl} rel="noreferrer" target="_blank">
            ODbL 1.0
          </a>
        </div>
      </footer>
    </section>
  );
}
