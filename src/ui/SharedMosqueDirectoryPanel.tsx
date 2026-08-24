import { useEffect, useMemo, useState } from 'react';

import { createCoordinates } from '../domain/coordinates';
import {
  findPotentialSharedMosqueDuplicate,
  searchSharedMosques,
  sharedMosqueToProfile,
  type SharedMosqueRecord,
  type SharedMosqueSubmissionInput,
} from '../domain/sharedMosqueDirectory';
import { localeTag } from '../i18n/i18n';
import { sharedMosqueDirectoryCopy } from '../i18n/sharedMosqueDirectoryTranslations';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT } from '../platform/mosqueProfileEvents';
import {
  loadMosqueProfileLibrary,
  saveMosqueProfileLibrary,
  selectMosqueProfile,
  upsertMosqueProfile,
  type MosqueProfileLibraryState,
} from '../platform/mosqueProfileLibrary';
import {
  loadSharedMosqueDirectoryCache,
  mergeSharedMosqueDirectoryCache,
  queueSharedMosqueDirectoryOutbox,
} from '../platform/sharedMosqueDirectoryCache';
import {
  fetchSharedMosques,
  requestSharedMosqueClaim,
  SharedMosqueDirectoryTransportError,
  submitSharedMosque,
  suggestSharedMosqueEdit,
} from '../platform/sharedMosqueDirectoryTransport';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';

type ConnectionState = 'idle' | 'loading' | 'online' | 'offline';
type ContributionMode = 'submission' | 'edit' | 'claim' | null;

function readSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function readLibrary(): MosqueProfileLibraryState {
  try {
    return loadMosqueProfileLibrary(getApplicationStorage());
  } catch {
    return { profiles: [], selectedProfileId: null };
  }
}

function localizedName(record: SharedMosqueRecord, locale: Locale): string {
  return locale === 'ar' ? (record.nameAr ?? record.name) : record.name;
}

function formatDistance(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} km`;
}

function verificationLabel(
  record: SharedMosqueRecord,
  copy: ReturnType<typeof sharedMosqueDirectoryCopy[Locale]>,
): string {
  switch (record.verification.state) {
    case 'claimed':
      return copy.claimed;
    case 'verified':
      return copy.verified;
    default:
      return copy.unverified;
  }
}

export function SharedMosqueDirectoryPanel() {
  const [settings, setSettings] = useState<PersistedSettings>(readSettings);
  const [library, setLibrary] = useState<MosqueProfileLibraryState>(readLibrary);
  const [records, setRecords] = useState<readonly SharedMosqueRecord[]>(() => {
    try {
      return loadSharedMosqueDirectoryCache(getApplicationStorage())?.records ?? [];
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState('');
  const [nearby, setNearby] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [contributionMode, setContributionMode] = useState<ContributionMode>(null);
  const [activeMosqueId, setActiveMosqueId] = useState<string | null>(null);
  const [submission, setSubmission] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    timeZone: readSettings().location?.timeZone ?? 'Australia/Sydney',
  });
  const [editSuggestion, setEditSuggestion] = useState('');
  const [claimContact, setClaimContact] = useState('');
  const locale = settings.locale;
  const text = sharedMosqueDirectoryCopy[locale];
  const savedCoordinates = settings.location?.coordinates ?? null;

  useEffect(() => {
    const refresh = () => {
      setSettings(readSettings());
      setLibrary(readLibrary());
    };
    window.addEventListener('focus', refresh);
    window.addEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    };
  }, []);

  const search = async (useNearby: boolean) => {
    setConnection('loading');
    setFeedback(null);
    try {
      const next = await fetchSharedMosques({
        query,
        coordinates: useNearby ? savedCoordinates : null,
        radiusKm: 100,
        limit: 50,
      });
      setRecords(next);
      mergeSharedMosqueDirectoryCache(
        getApplicationStorage(),
        next,
        library.selectedProfileId?.startsWith('shared-')
          ? [library.selectedProfileId.slice('shared-'.length)]
          : [],
      );
      setConnection('online');
    } catch {
      const cached = loadSharedMosqueDirectoryCache(getApplicationStorage())?.records ?? [];
      const filtered = searchSharedMosques(cached, {
        query,
        coordinates: useNearby ? savedCoordinates : null,
        radiusKm: useNearby && savedCoordinates !== null ? 100 : null,
        limit: 50,
      }).map((result) => result.mosque);
      setRecords(filtered);
      setConnection('offline');
    }
  };

  useEffect(() => {
    void search(false);
    // Initial shared-directory refresh occurs once; user actions own later queries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayed = useMemo(
    () =>
      searchSharedMosques(records, {
        query: connection === 'offline' ? query : '',
        coordinates: nearby ? savedCoordinates : null,
        radiusKm: nearby && savedCoordinates !== null ? 100 : null,
        limit: 50,
      }),
    [connection, nearby, query, records, savedCoordinates],
  );

  const selectMosque = (record: SharedMosqueRecord) => {
    const profile = sharedMosqueToProfile(record);
    const withProfile = upsertMosqueProfile(library, profile);
    const next = selectMosqueProfile(withProfile, profile.id);
    saveMosqueProfileLibrary(getApplicationStorage(), next);
    mergeSharedMosqueDirectoryCache(getApplicationStorage(), records, [record.id]);
    setLibrary(next);
    window.dispatchEvent(new Event(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT));
  };

  const queueContribution = (
    kind: 'submission' | 'edit-suggestion' | 'claim',
    payload: Readonly<Record<string, string | number | null>>,
  ) => {
    queueSharedMosqueDirectoryOutbox(getApplicationStorage(), {
      id: `${kind}-${crypto.randomUUID()}`,
      kind,
      createdAt: new Date().toISOString(),
      payload,
    });
    setFeedback(text.contributionQueued);
  };

  const sendSubmission = async () => {
    const latitude = Number(submission.latitude);
    const longitude = Number(submission.longitude);
    let input: SharedMosqueSubmissionInput;
    try {
      const coordinates = createCoordinates(latitude, longitude);
      input = {
        name: submission.name,
        address: submission.address,
        countryCode: 'AU',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timeZone: submission.timeZone,
      };
    } catch {
      setFeedback('Invalid mosque coordinates.');
      return;
    }
    if (findPotentialSharedMosqueDuplicate(records, input) !== null) {
      setFeedback(text.duplicate);
      return;
    }
    try {
      await submitSharedMosque(input);
      setFeedback(text.contributionReceived);
      setContributionMode(null);
    } catch (error) {
      if (error instanceof SharedMosqueDirectoryTransportError && error.status === 409) {
        setFeedback(text.duplicate);
        return;
      }
      queueContribution('submission', input as unknown as Record<string, string | number | null>);
    }
  };

  const sendEditSuggestion = async (record: SharedMosqueRecord) => {
    const correctedAddress = editSuggestion.trim();
    if (correctedAddress.length < 3) return;
    try {
      await suggestSharedMosqueEdit(record.id, { address: correctedAddress });
      setFeedback(text.contributionReceived);
      setContributionMode(null);
      setEditSuggestion('');
    } catch {
      queueContribution('edit-suggestion', { mosqueId: record.id, address: correctedAddress });
    }
  };

  const sendClaim = async (record: SharedMosqueRecord) => {
    const contact = claimContact.trim();
    if (contact.length < 3) return;
    try {
      await requestSharedMosqueClaim(record.id, contact);
      setFeedback(text.contributionReceived);
      setContributionMode(null);
      setClaimContact('');
    } catch {
      queueContribution('claim', { mosqueId: record.id, contact });
    }
  };

  return (
    <section
      className="shared-mosque-directory"
      aria-labelledby="shared-mosque-directory-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-shared-directory-connection={connection}
    >
      <header className="shared-mosque-directory__header">
        <div>
          <p className="shared-mosque-directory__eyebrow">{text.shared}</p>
          <h2 id="shared-mosque-directory-title">{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <span className="shared-mosque-directory__connection" role="status">
          {connection === 'online'
            ? text.online
            : connection === 'loading'
              ? '…'
              : connection === 'offline'
                ? text.offline
                : text.cached}
        </span>
      </header>

      <div className="shared-mosque-directory__toolbar">
        <label className="mosques-browser__search">
          <span>{text.search}</span>
          <input
            type="search"
            value={query}
            placeholder={text.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void search(nearby);
            }}
            dir="auto"
          />
        </label>
        <button type="button" onClick={() => void search(nearby)} disabled={connection === 'loading'}>
          {text.searchAction}
        </button>
        <button
          type="button"
          aria-pressed={nearby}
          disabled={savedCoordinates === null || connection === 'loading'}
          onClick={() => {
            const next = !nearby;
            setNearby(next);
            void search(next);
          }}
        >
          {text.nearby}
        </button>
      </div>
      <p className="shared-mosque-directory__privacy">{text.nearbyHint}</p>

      {displayed.length === 0 ? (
        <div className="mosques-screen__empty" data-shared-directory-empty="true">
          <p>{text.noResults}</p>
        </div>
      ) : (
        <div className="mosque-summary-grid shared-mosque-directory__grid">
          {displayed.map(({ mosque, distanceKm }) => {
            const profileId = `shared-${mosque.id}`;
            const selected = library.selectedProfileId === profileId;
            const active = activeMosqueId === mosque.id;
            return (
              <article
                className="mosque-summary-card shared-mosque-directory__card"
                key={mosque.id}
                data-shared-mosque-id={mosque.id}
                data-verification-state={mosque.verification.state}
              >
                <div className="mosque-summary-card__identity">
                  <div className="shared-mosque-directory__name-row">
                    <h3><bdi>{localizedName(mosque, locale)}</bdi></h3>
                    <span className={`shared-mosque-directory__badge shared-mosque-directory__badge--${mosque.verification.state}`}>
                      {verificationLabel(mosque, text)}
                    </span>
                  </div>
                  <p>{mosque.address}</p>
                  {distanceKm !== null && (
                    <span>{text.distance}: {formatDistance(distanceKm, locale)}</span>
                  )}
                </div>
                <div className="mosque-summary-card__actions shared-mosque-directory__actions">
                  <button type="button" disabled={selected} onClick={() => selectMosque(mosque)}>
                    {selected ? text.selected : text.useMosque}
                  </button>
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={() => {
                      setActiveMosqueId(mosque.id);
                      setContributionMode(active && contributionMode === 'edit' ? null : 'edit');
                    }}
                  >
                    {text.suggestEdit}
                  </button>
                  <button
                    type="button"
                    className="quiet-button"
                    disabled={mosque.verification.state === 'claimed'}
                    onClick={() => {
                      setActiveMosqueId(mosque.id);
                      setContributionMode(active && contributionMode === 'claim' ? null : 'claim');
                    }}
                  >
                    {text.claim}
                  </button>
                </div>

                {active && contributionMode === 'edit' && (
                  <div className="shared-mosque-directory__inline-form" data-shared-edit-form="true">
                    <label>
                      <span>{text.suggestionPlaceholder}</span>
                      <input
                        value={editSuggestion}
                        onChange={(event) => setEditSuggestion(event.target.value)}
                        placeholder={mosque.address}
                        dir="auto"
                      />
                    </label>
                    <button type="button" onClick={() => void sendEditSuggestion(mosque)}>{text.send}</button>
                  </div>
                )}
                {active && contributionMode === 'claim' && (
                  <div className="shared-mosque-directory__inline-form" data-shared-claim-form="true">
                    <label>
                      <span>{text.claimContact}</span>
                      <input value={claimContact} onChange={(event) => setClaimContact(event.target.value)} dir="auto" />
                    </label>
                    <button type="button" onClick={() => void sendClaim(mosque)}>{text.send}</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="shared-mosque-directory__contribute">
        <button
          type="button"
          className="quiet-button"
          aria-expanded={contributionMode === 'submission'}
          onClick={() => {
            setActiveMosqueId(null);
            setContributionMode(contributionMode === 'submission' ? null : 'submission');
            if (submission.latitude === '' && savedCoordinates !== null) {
              setSubmission((current) => ({
                ...current,
                latitude: String(savedCoordinates.latitude),
                longitude: String(savedCoordinates.longitude),
              }));
            }
          }}
        >
          {text.submitMosque}
        </button>

        {contributionMode === 'submission' && (
          <div className="shared-mosque-directory__submission" data-shared-submission-form="true">
            <h3>{text.submitMosque}</h3>
            <label><span>{text.name}</span><input value={submission.name} onChange={(event) => setSubmission((value) => ({ ...value, name: event.target.value }))} dir="auto" /></label>
            <label><span>{text.address}</span><input value={submission.address} onChange={(event) => setSubmission((value) => ({ ...value, address: event.target.value }))} dir="auto" /></label>
            <div className="shared-mosque-directory__coordinate-row">
              <label><span>{text.latitude}</span><input inputMode="decimal" value={submission.latitude} onChange={(event) => setSubmission((value) => ({ ...value, latitude: event.target.value }))} /></label>
              <label><span>{text.longitude}</span><input inputMode="decimal" value={submission.longitude} onChange={(event) => setSubmission((value) => ({ ...value, longitude: event.target.value }))} /></label>
            </div>
            <label><span>{text.timeZone}</span><input value={submission.timeZone} onChange={(event) => setSubmission((value) => ({ ...value, timeZone: event.target.value }))} /></label>
            <button type="button" onClick={() => void sendSubmission()}>{text.submit}</button>
          </div>
        )}
      </div>

      {feedback !== null && <p className="shared-mosque-directory__feedback" role="status">{feedback}</p>}
      <footer className="shared-mosque-directory__footer"><p>{text.privacy}</p></footer>
    </section>
  );
}
