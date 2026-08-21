import { useEffect, useMemo, useState } from 'react';

import { buildCommunityFeed } from '../domain/communityFeed';
import { localeTag } from '../i18n/i18n';
import { communityV2Copy } from '../i18n/mosquesCommunityV2Translations';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadCommunityContentLibrary,
  type CommunityContentLibrary,
} from '../platform/communityContentStorage';
import { MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT } from '../platform/mosqueProfileEvents';
import {
  loadMosqueProfileLibrary,
  type MosqueProfileLibraryState,
} from '../platform/mosqueProfileLibrary';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

type CommunityTab = 'announcements' | 'events';

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function readCommunityLibrary(): CommunityContentLibrary {
  try {
    return loadCommunityContentLibrary(getApplicationStorage());
  } catch {
    return { announcements: [], events: [] };
  }
}

function readMosqueLibrary(): MosqueProfileLibraryState {
  try {
    return loadMosqueProfileLibrary(getApplicationStorage());
  } catch {
    return { profiles: [], selectedProfileId: null };
  }
}

function localizedName(
  value: Readonly<{ en?: string; ar?: string }>,
  locale: Locale,
): string | null {
  return locale === 'ar' ? (value.ar ?? value.en ?? null) : (value.en ?? value.ar ?? null);
}

function formatDateTime(value: string, locale: Locale, allDay = false): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    ...(allDay ? {} : { timeStyle: 'short' as const }),
  }).format(new Date(value));
}

export function CommunityScreen() {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const [library, setLibrary] = useState<CommunityContentLibrary>(readCommunityLibrary);
  const [mosques, setMosques] = useState<MosqueProfileLibraryState>(readMosqueLibrary);
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<CommunityTab>('announcements');
  const text = communityV2Copy[locale];

  const feed = useMemo(
    () =>
      buildCommunityFeed({
        announcements: library.announcements,
        events: library.events,
        now: now.toISOString(),
        locale: locale === 'ar' ? 'ar' : 'en',
        surface: 'mobile',
        mosqueId: mosques.selectedProfileId,
      }),
    [library, locale, mosques.selectedProfileId, now],
  );

  useEffect(() => {
    const refresh = () => {
      setLocale(readLocale());
      setLibrary(readCommunityLibrary());
      setMosques(readMosqueLibrary());
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

  const sourceName = (mosqueId: string): string => {
    const profile = mosques.profiles.find((entry) => entry.id === mosqueId);
    return profile === undefined ? mosqueId : (localizedName(profile.name, locale) ?? mosqueId);
  };

  return (
    <main
      className="community-screen"
      aria-labelledby="community-screen-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="community-screen__header">
        <div>
          <p className="community-screen__eyebrow">SalahOS</p>
          <h2 id="community-screen-title">{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
      </header>

      <div className="community-screen__tabs" role="tablist" aria-label={text.title}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'announcements'}
          onClick={() => {
            setTab('announcements');
          }}
        >
          {text.announcements}
          <span>{feed.announcements.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'events'}
          onClick={() => {
            setTab('events');
          }}
        >
          {text.events}
          <span>{feed.events.length}</span>
        </button>
      </div>

      {tab === 'announcements' ? (
        <section className="community-screen__content" role="tabpanel">
          {feed.announcements.length === 0 ? (
            <div className="community-screen__empty">
              <strong>{text.announcements}</strong>
              <p>{text.emptyAnnouncements}</p>
            </div>
          ) : (
            <div className="community-screen__grid">
              {feed.announcements.map((announcement) => {
                const stored = library.announcements.find(
                  (entry) =>
                    entry.mosqueId === announcement.mosqueId &&
                    entry.announcementId === announcement.id,
                );
                return (
                  <article
                    className="community-preview-card"
                    data-priority={announcement.priority}
                    key={`${announcement.mosqueId}:${announcement.id}`}
                    dir={announcement.direction}
                  >
                    {announcement.imageUrl !== null && (
                      <img src={announcement.imageUrl} alt="" loading="lazy" />
                    )}
                    <div className="community-preview-card__body">
                      <div className="community-preview-card__status">
                        <span>{text.published}</span>
                        {announcement.pinned && <span>{text.pinned}</span>}
                        {announcement.priority === 'priority' && <span>{text.priority}</span>}
                      </div>
                      <h3>{announcement.title}</h3>
                      <p>{announcement.body}</p>
                      <dl>
                        <div>
                          <dt>{text.source}</dt>
                          <dd>
                            <bdi>{sourceName(announcement.mosqueId)}</bdi>
                          </dd>
                        </div>
                        {stored?.endsAt !== null && stored?.endsAt !== undefined && (
                          <div>
                            <dt>{text.availableUntil}</dt>
                            <dd>{formatDateTime(stored.endsAt, locale)}</dd>
                          </div>
                        )}
                      </dl>
                      {announcement.callToActionUrl !== null && (
                        <a href={announcement.callToActionUrl} rel="noreferrer" target="_blank">
                          {text.openLink}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="community-screen__content" role="tabpanel">
          {feed.events.length === 0 ? (
            <div className="community-screen__empty">
              <strong>{text.events}</strong>
              <p>{text.emptyEvents}</p>
            </div>
          ) : (
            <div className="community-screen__grid">
              {feed.events.map((event) => (
                <article
                  className="community-preview-card community-preview-card--event"
                  key={`${event.mosqueId}:${event.id}`}
                  dir={event.direction}
                >
                  {event.imageUrl !== null && <img src={event.imageUrl} alt="" loading="lazy" />}
                  <div className="community-preview-card__body">
                    <div className="community-preview-card__status">
                      <span>{text.upcoming}</span>
                      {event.allDay && <span>{text.allDay}</span>}
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <dl>
                      <div>
                        <dt>{text.starts}</dt>
                        <dd>{formatDateTime(event.startsAt, locale, event.allDay)}</dd>
                      </div>
                      <div>
                        <dt>{text.venue}</dt>
                        <dd>{event.venue}</dd>
                      </div>
                      <div>
                        <dt>{text.source}</dt>
                        <dd>
                          <bdi>{sourceName(event.mosqueId)}</bdi>
                        </dd>
                      </div>
                    </dl>
                    {event.registrationUrl !== null && (
                      <a href={event.registrationUrl} rel="noreferrer" target="_blank">
                        {text.eventInfo}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
