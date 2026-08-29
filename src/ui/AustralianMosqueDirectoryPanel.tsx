import { useEffect, useMemo, useState } from 'react';

import '../australian-mosque-directory.css';
import {
  australianMosqueDirectory,
  australianMosques,
  australianMosqueToProfile,
  searchAustralianMosques,
  sortAustralianMosquesByDistance,
  type AustralianMosqueRecord,
} from '../domain/australianMosqueDirectoryCombined';
import type { EnrichedMosqueDirectoryRecord } from '../domain/mosqueDirectoryEnrichment';
import { localeTag } from '../i18n/i18n';
import { australianMosqueDirectoryCopy } from '../i18n/australianMosqueDirectoryTranslations';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT } from '../platform/mosqueProfileEvents';
import {
  loadMosqueProfileLibrary,
  removeMosqueProfile,
  saveMosqueProfileLibrary,
  selectMosqueProfile,
  upsertMosqueProfile,
  type MosqueProfileLibraryState,
} from '../platform/mosqueProfileLibrary';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';

const COLLAPSED_RESULT_LIMIT = 24;

function readSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function readMosques(): MosqueProfileLibraryState {
  try {
    return loadMosqueProfileLibrary(getApplicationStorage());
  } catch {
    return { profiles: [], selectedProfileId: null };
  }
}

function formatDistance(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} km`;
}

function localizedDirectoryName(mosque: AustralianMosqueRecord, locale: Locale): string {
  return locale === 'ar' ? (mosque.nameAr ?? mosque.name) : mosque.name;
}

function directionsUrl(mosque: AustralianMosqueRecord): string {
  const destination = encodeURIComponent(`${String(mosque.latitude)},${String(mosque.longitude)}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

function verificationLabel(
  record: EnrichedMosqueDirectoryRecord,
  text: (typeof australianMosqueDirectoryCopy)[Locale],
): string {
  switch (record.verification.state) {
    case 'claimed':
      return text.claimed;
    case 'verified':
      return text.verified;
    default:
      return text.unverified;
  }
}

function freshnessLabel(
  record: EnrichedMosqueDirectoryRecord,
  text: (typeof australianMosqueDirectoryCopy)[Locale],
): string {
  switch (record.quality.freshness) {
    case 'fresh':
      return text.fresh;
    case 'aging':
      return text.aging;
    case 'stale':
      return text.stale;
    default:
      return text.unknownFreshness;
  }
}

export function AustralianMosqueDirectoryPanel() {
  const [settings, setSettings] = useState<PersistedSettings>(readSettings);
  const [library, setLibrary] = useState<MosqueProfileLibraryState>(readMosques);
  const [query, setQuery] = useState('');
  const [sortByDistance, setSortByDistance] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const locale = settings.locale;
  const text = australianMosqueDirectoryCopy[locale];
  const savedCoordinates = settings.location?.coordinates ?? null;
  const followedIds = useMemo(
    () => new Set<string>(library.profiles.map((profile) => profile.id)),
    [library.profiles],
  );

  useEffect(() => {
    const refresh = () => {
      setSettings(readSettings());
      setLibrary(readMosques());
    };
    window.addEventListener('focus', refresh);
    window.addEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [query, sortByDistance]);

  const matchingMosques = useMemo(() => searchAustralianMosques(australianMosques, query), [query]);
  const rankedMosques = useMemo(() => {
    if (!sortByDistance || savedCoordinates === null) {
      return matchingMosques.map((mosque) => ({ mosque, distanceKm: null }));
    }
    return sortAustralianMosquesByDistance(matchingMosques, savedCoordinates);
  }, [matchingMosques, savedCoordinates, sortByDistance]);
  const visibleMosques = expanded ? rankedMosques : rankedMosques.slice(0, COLLAPSED_RESULT_LIMIT);

  const persistLibrary = (next: MosqueProfileLibraryState) => {
    saveMosqueProfileLibrary(getApplicationStorage(), next);
    setLibrary(next);
    window.dispatchEvent(new Event(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT));
  };

  const useMosque = (mosque: AustralianMosqueRecord) => {
    const profile = australianMosqueToProfile(mosque);
    const withProfile = upsertMosqueProfile(library, profile);
    persistLibrary(selectMosqueProfile(withProfile, profile.id));
  };

  const toggleFavourite = (mosque: AustralianMosqueRecord) => {
    const profile = australianMosqueToProfile(mosque);
    const next = followedIds.has(profile.id)
      ? removeMosqueProfile(library, profile.id)
      : upsertMosqueProfile(library, profile);
    persistLibrary(next);
  };

  return (
    <section
      className="australian-mosque-directory"
      aria-labelledby="australian-mosque-directory-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
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
            const selected = mosque.id === library.selectedProfileId;
            const followed = followedIds.has(mosque.id);
            const enriched = mosque.enriched;
            const timetableUrl = enriched.prayerTimes?.timetableUrl;
            return (
              <article
                className="mosque-summary-card australian-mosque-directory__card"
                data-directory-mosque-id={mosque.id}
                data-selected={selected}
                data-favourite={followed}
                data-directory-quality={enriched.quality.score}
                data-directory-freshness={enriched.quality.freshness}
                data-directory-published-prayer-times={
                  enriched.prayerTimes === null ? 'false' : 'true'
                }
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
                  <div className="australian-mosque-directory__data-status">
                    <span data-directory-verification={enriched.verification.state}>
                      {verificationLabel(enriched, text)}
                    </span>
                    <span data-directory-freshness-label={enriched.quality.freshness}>
                      {freshnessLabel(enriched, text)}
                    </span>
                    <span>
                      {text.quality}: {enriched.quality.score}/100
                    </span>
                  </div>
                </div>
                <div className="mosque-summary-card__actions australian-mosque-directory__actions">
                  <button
                    type="button"
                    aria-pressed={selected}
                    data-followed={followed}
                    disabled={selected}
                    onClick={() => {
                      useMosque(mosque);
                    }}
                  >
                    {selected ? text.selected : text.useMosque}
                  </button>
                  <button
                    type="button"
                    className="quiet-button"
                    aria-pressed={followed}
                    data-directory-favourite-toggle="true"
                    onClick={() => {
                      toggleFavourite(mosque);
                    }}
                  >
                    {followed ? text.removeFavourite : text.favourite}
                  </button>
                  <a href={directionsUrl(mosque)} target="_blank" rel="noreferrer">
                    {text.directions}
                  </a>
                  {enriched.contact.phone !== undefined && (
                    <a href={`tel:${enriched.contact.phone}`}>{text.call}</a>
                  )}
                  {enriched.contact.website !== undefined && (
                    <a href={enriched.contact.website} target="_blank" rel="noreferrer">
                      {text.website}
                    </a>
                  )}
                  {timetableUrl !== undefined && (
                    <a href={timetableUrl} target="_blank" rel="noreferrer">
                      {text.timetable}
                    </a>
                  )}
                  <a href="#shared-mosque-directory-title" data-directory-report-edit="true">
                    {text.reportEdit}
                  </a>
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
          <time dateTime={australianMosqueDirectory.source.generatedAt}>
            {new Intl.DateTimeFormat(localeTag(locale), { dateStyle: 'medium' }).format(
              new Date(australianMosqueDirectory.source.generatedAt),
            )}
          </time>
        </p>
        <div>
          <a
            href={australianMosqueDirectory.source.osmAttributionUrl}
            rel="noreferrer"
            target="_blank"
          >
            OpenStreetMap
          </a>
          <a
            href={australianMosqueDirectory.source.osmLicenceUrl}
            rel="noreferrer"
            target="_blank"
          >
            ODbL 1.0
          </a>
          <a
            href={australianMosqueDirectory.source.mosqueFinderUrl}
            rel="noreferrer"
            target="_blank"
          >
            {text.mosqueFinderSource}
          </a>
          <a href="/mosque-packs/manifest.json" download>
            Directory packs
          </a>
        </div>
      </footer>
    </section>
  );
}
