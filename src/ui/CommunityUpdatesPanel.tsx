import { useEffect, useMemo, useState } from 'react';

import { buildCommunityFeed } from '../domain/communityFeed';
import { localeTag } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { communityUpdatesCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadCommunityContentLibrary,
  parseCommunityContentLibrary,
  saveCommunityContentLibrary,
  serializeCommunityContentLibrary,
  type CommunityContentLibrary,
} from '../platform/communityContentStorage';
import { MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT } from '../platform/mosqueProfileEvents';
import { loadMosqueProfileLibrary } from '../platform/mosqueProfileLibrary';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = communityUpdatesCopy;

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function readLibrary(): CommunityContentLibrary {
  try {
    return loadCommunityContentLibrary(getApplicationStorage());
  } catch {
    return { announcements: [], events: [] };
  }
}

function readSelectedMosqueId(): string | null {
  try {
    return loadMosqueProfileLibrary(getApplicationStorage()).selectedProfileId;
  } catch {
    return null;
  }
}

function formatEventStart(value: string, locale: Locale, allDay: boolean): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    ...(allDay ? {} : { timeStyle: 'short' as const }),
  }).format(date);
}

export function CommunityUpdatesPanel() {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const [library, setLibrary] = useState<CommunityContentLibrary>(readLibrary);
  const [selectedMosqueId, setSelectedMosqueId] = useState<string | null>(readSelectedMosqueId);
  const [now, setNow] = useState(() => new Date());
  const [payload, setPayload] = useState('');
  const [message, setMessage] = useState<'imported' | 'exported' | 'invalid' | null>(null);
  const text = copy[locale];

  const feed = useMemo(
    () =>
      buildCommunityFeed({
        announcements: library.announcements,
        events: library.events,
        now: now.toISOString(),
        locale: locale === 'ar' ? 'ar' : 'en',
        surface: 'mobile',
        mosqueId: selectedMosqueId,
      }),
    [library, locale, now, selectedMosqueId],
  );

  useEffect(() => {
    const refresh = () => {
      setLocale(readLocale());
      setLibrary(readLibrary());
      setSelectedMosqueId(readSelectedMosqueId());
      setNow(new Date());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    window.addEventListener('focus', refresh);
    window.addEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) return null;

  const hasContent = feed.announcements.length > 0 || feed.events.length > 0;

  const importPayload = () => {
    try {
      const parsed = parseCommunityContentLibrary(payload);
      saveCommunityContentLibrary(getApplicationStorage(), parsed);
      setLibrary(parsed);
      setNow(new Date());
      setMessage('imported');
    } catch {
      setMessage('invalid');
    }
  };

  const prepareExport = () => {
    setPayload(serializeCommunityContentLibrary(library));
    setMessage('exported');
  };

  return (
    <section
      className="community-updates-panel"
      aria-labelledby="community-updates-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="community-updates-panel__heading">
        <div>
          <p className="community-updates-panel__eyebrow">SalahOS</p>
          <h2 id="community-updates-title">{text.title}</h2>
        </div>
        <p>{text.subtitle}</p>
      </header>

      {!hasContent && <p className="community-updates-panel__empty">{text.empty}</p>}

      {feed.announcements.length > 0 && (
        <section aria-labelledby="community-announcements-title">
          <h3 id="community-announcements-title">{text.announcements}</h3>
          <div className="community-updates-panel__grid">
            {feed.announcements.map((announcement) => (
              <article
                className="community-update-card"
                data-priority={announcement.priority}
                key={`${announcement.mosqueId}:${announcement.id}`}
                dir={announcement.direction}
              >
                {announcement.imageUrl !== null && (
                  <img src={announcement.imageUrl} alt="" loading="lazy" />
                )}
                <div className="community-update-card__body">
                  <div className="community-update-card__badges">
                    {announcement.pinned && <span>{text.pinned}</span>}
                    {announcement.priority === 'priority' && <span>{text.priority}</span>}
                  </div>
                  <h4>{announcement.title}</h4>
                  <p>{announcement.body}</p>
                  <small>
                    {text.source}: <bdi>{announcement.mosqueId}</bdi>
                  </small>
                  {announcement.callToActionUrl !== null && (
                    <a href={announcement.callToActionUrl} rel="noreferrer" target="_blank">
                      {text.openLink}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {feed.events.length > 0 && (
        <section aria-labelledby="community-events-title">
          <h3 id="community-events-title">{text.events}</h3>
          <div className="community-updates-panel__grid">
            {feed.events.map((event) => (
              <article
                className="community-update-card community-update-card--event"
                key={`${event.mosqueId}:${event.id}`}
                dir={event.direction}
              >
                {event.imageUrl !== null && <img src={event.imageUrl} alt="" loading="lazy" />}
                <div className="community-update-card__body">
                  {event.allDay && (
                    <div className="community-update-card__badges">
                      <span>{text.allDay}</span>
                    </div>
                  )}
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <dl>
                    <div>
                      <dt>{text.starts}</dt>
                      <dd>{formatEventStart(event.startsAt, locale, event.allDay)}</dd>
                    </div>
                    <div>
                      <dt>{text.venue}</dt>
                      <dd>{event.venue}</dd>
                    </div>
                  </dl>
                  <small>
                    {text.source}: <bdi>{event.mosqueId}</bdi>
                  </small>
                  {event.registrationUrl !== null && (
                    <a href={event.registrationUrl} rel="noreferrer" target="_blank">
                      {text.eventInfo}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <details className="community-updates-panel__manage">
        <summary>{text.manage}</summary>
        <p>{text.manageHelp}</p>
        <label>
          <span>{text.payload}</span>
          <textarea
            value={payload}
            onChange={(event) => {
              setPayload(event.target.value);
            }}
            rows={8}
          />
        </label>
        <div className="community-updates-panel__actions">
          <button type="button" onClick={importPayload}>
            {text.import}
          </button>
          <button type="button" onClick={prepareExport}>
            {text.export}
          </button>
        </div>
        {message !== null && (
          <p className="community-updates-panel__message" role="status">
            {text[message]}
          </p>
        )}
      </details>
    </section>
  );
}
