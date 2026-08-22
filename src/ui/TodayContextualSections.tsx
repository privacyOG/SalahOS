import { useEffect, useMemo, useState } from 'react';

import { buildCommunityFeed } from '../domain/communityFeed';
import { mosqueDayForDate, taraweehSessionsForDate } from '../domain/mosqueTimetable';
import type { PrayerName } from '../domain/prayerEngine';
import { deriveRamadanMode } from '../domain/ramadan';
import {
  buildRamadanFastTimes,
  RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES,
} from '../domain/ramadanTimes';
import type { SourcedPrayerDashboard } from '../domain/sourcedDashboard';
import { formatLocalTime, localeTag } from '../i18n/i18n';
import { todayContextCopy } from '../i18n/todayContextV2Translations';
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
import type { PersistedSettings } from '../platform/settingsStorage';
import { BidiText } from './BidiText';

export type TodayManagedDataState =
  'no-selected-mosque' | 'missing-timetable' | 'stale-timetable' | 'offline-managed';

export interface TodaySeasonalContext {
  readonly ramadanDay: number;
  readonly hijriYear: number;
  readonly imsakLocalMinutes: number | null;
  readonly suhurEndsAtLocalMinutes: number | null;
  readonly iftarLocalMinutes: number | null;
  readonly taraweehSessions: readonly Readonly<{ label: string; startLocalMinutes: number }>[];
}

export interface TodayCommunityPreview {
  readonly announcement: ReturnType<typeof buildCommunityFeed>['announcements'][number] | null;
  readonly event: ReturnType<typeof buildCommunityFeed>['events'][number] | null;
}

export interface TodayContextModel {
  readonly seasonal: TodaySeasonalContext | null;
  readonly managedDataState: TodayManagedDataState | null;
  readonly selectedMosqueName: string | null;
  readonly astronomicalUnavailable: boolean;
  readonly community: TodayCommunityPreview | null;
}

interface TodayContextModelInput {
  readonly settings: PersistedSettings;
  readonly dashboard: SourcedPrayerDashboard;
  readonly unavailablePrayers: readonly PrayerName[];
  readonly communityLibrary: CommunityContentLibrary;
  readonly mosqueLibrary: MosqueProfileLibraryState;
  readonly online: boolean;
  readonly now: Date;
}

interface RuntimeLibraries {
  readonly community: CommunityContentLibrary;
  readonly mosques: MosqueProfileLibraryState;
}

function readLibraries(): RuntimeLibraries {
  const storage = getApplicationStorage();
  return {
    community: loadCommunityContentLibrary(storage),
    mosques: loadMosqueProfileLibrary(storage),
  };
}

function localizedMosqueName(
  value: Readonly<{ en?: string; ar?: string }>,
  locale: Locale,
): string | null {
  return locale === 'ar' ? (value.ar ?? value.en ?? null) : (value.en ?? value.ar ?? null);
}

function eventStart(value: string, locale: Locale, allDay: boolean): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    ...(allDay ? {} : { timeStyle: 'short' as const }),
  }).format(new Date(value));
}

export function buildTodayContextModel(input: TodayContextModelInput): TodayContextModel {
  const selectedProfile =
    input.mosqueLibrary.selectedProfileId === null
      ? null
      : (input.mosqueLibrary.profiles.find(
          (profile) => profile.id === input.mosqueLibrary.selectedProfileId,
        ) ?? null);
  const selectedMosqueName =
    selectedProfile === null
      ? null
      : (localizedMosqueName(selectedProfile.name, input.settings.locale) ?? selectedProfile.id);

  const date = input.dashboard.base.today.date;
  const ramadan = deriveRamadanMode(input.dashboard.base.hijri);
  let seasonal: TodaySeasonalContext | null = null;

  if (ramadan.active && ramadan.ramadanDay !== null) {
    const fajr = input.dashboard.prayers.find((prayer) => prayer.name === 'fajr');
    const maghrib = input.dashboard.prayers.find((prayer) => prayer.name === 'maghrib');
    const fastTimes = buildRamadanFastTimes({
      displayedFajrLocalMinutes: fajr?.localMinutes ?? null,
      displayedMaghribLocalMinutes: maghrib?.localMinutes ?? null,
      imsakOffsetMinutes: RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES,
    });
    const mosqueDay =
      input.settings.mosqueTimetable === null
        ? null
        : mosqueDayForDate(input.settings.mosqueTimetable, date);

    seasonal = Object.freeze({
      ramadanDay: ramadan.ramadanDay,
      hijriYear: ramadan.hijriYear,
      imsakLocalMinutes: fastTimes.imsakLocalMinutes,
      suhurEndsAtLocalMinutes: fastTimes.suhurEndsAtLocalMinutes,
      iftarLocalMinutes: fastTimes.iftarLocalMinutes,
      taraweehSessions: Object.freeze(
        input.settings.prayerSourceMode === 'local-mosque' && mosqueDay !== null
          ? [...taraweehSessionsForDate(mosqueDay)]
          : [],
      ),
    });
  }

  let managedDataState: TodayManagedDataState | null = null;
  if (input.settings.prayerSourceMode === 'local-mosque') {
    if (input.mosqueLibrary.selectedProfileId === null) {
      managedDataState = 'no-selected-mosque';
    } else if (input.settings.mosqueTimetable === null) {
      managedDataState = 'missing-timetable';
    } else if (mosqueDayForDate(input.settings.mosqueTimetable, date) === null) {
      managedDataState = 'stale-timetable';
    } else if (!input.online) {
      managedDataState = 'offline-managed';
    }
  }

  let community: TodayCommunityPreview | null = null;
  if (input.mosqueLibrary.selectedProfileId !== null) {
    const feed = buildCommunityFeed({
      announcements: input.communityLibrary.announcements,
      events: input.communityLibrary.events,
      now: input.now.toISOString(),
      locale: input.settings.locale === 'ar' ? 'ar' : 'en',
      surface: 'mobile',
      mosqueId: input.mosqueLibrary.selectedProfileId,
    });
    const announcement = feed.announcements[0] ?? null;
    const event = feed.events[0] ?? null;
    if (announcement !== null || event !== null) {
      community = Object.freeze({ announcement, event });
    }
  }

  return Object.freeze({
    seasonal,
    managedDataState,
    selectedMosqueName,
    astronomicalUnavailable: input.unavailablePrayers.length > 0,
    community,
  });
}

export function TodayContextualSections(props: {
  readonly settings: PersistedSettings;
  readonly dashboard: SourcedPrayerDashboard;
  readonly unavailablePrayers: readonly PrayerName[];
  readonly online: boolean;
  readonly now: Date;
  readonly communityHref: string;
  readonly mosquesHref: string;
  readonly showCommunity?: boolean;
}) {
  const [libraries, setLibraries] = useState<RuntimeLibraries>(readLibraries);
  const locale = props.settings.locale;
  const text = todayContextCopy[locale];
  const model = useMemo(
    () =>
      buildTodayContextModel({
        settings: props.settings,
        dashboard: props.dashboard,
        unavailablePrayers: props.unavailablePrayers,
        communityLibrary: libraries.community,
        mosqueLibrary: libraries.mosques,
        online: props.online,
        now: props.now,
      }),
    [libraries, props.dashboard, props.now, props.online, props.settings, props.unavailablePrayers],
  );

  useEffect(() => {
    const refresh = () => {
      setLibraries(readLibraries());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const managedCopy =
    model.managedDataState === null
      ? null
      : {
          'no-selected-mosque': {
            title: text.noSelectedMosqueTitle,
            body: text.noSelectedMosqueBody,
            action: true,
          },
          'missing-timetable': {
            title: text.missingTimetableTitle,
            body: text.missingTimetableBody,
            action: false,
          },
          'stale-timetable': {
            title: text.staleTimetableTitle,
            body: text.staleTimetableBody,
            action: false,
          },
          'offline-managed': {
            title: text.offlineManagedTitle,
            body: text.offlineManagedBody,
            action: false,
          },
        }[model.managedDataState];

  const formatTime = (localMinutes: number | null) =>
    localMinutes === null ? '—' : formatLocalTime(localMinutes, locale, props.settings.timeFormat);

  return (
    <div className="today-contextual" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {(managedCopy !== null || model.astronomicalUnavailable) && (
        <section className="today-context-states" aria-label={text.astronomicalUnavailableTitle}>
          {managedCopy !== null && (
            <article
              className="today-context-state"
              data-state={model.managedDataState ?? undefined}
            >
              <strong>{managedCopy.title}</strong>
              <p>{managedCopy.body}</p>
              {model.selectedMosqueName !== null && (
                <small>
                  <BidiText>{model.selectedMosqueName}</BidiText>
                </small>
              )}
              {managedCopy.action && <a href={props.mosquesHref}>{text.chooseMosque}</a>}
            </article>
          )}
          {model.astronomicalUnavailable && (
            <article className="today-context-state" data-state="astronomical-unavailable">
              <strong>{text.astronomicalUnavailableTitle}</strong>
              <p>{text.astronomicalUnavailableBody}</p>
            </article>
          )}
        </section>
      )}

      {model.seasonal !== null && (
        <section className="today-seasonal" aria-labelledby="today-ramadan-title">
          <header>
            <div>
              <p>{text.ramadanEyebrow}</p>
              <h2 id="today-ramadan-title">
                {text.ramadanDay} {model.seasonal.ramadanDay}
              </h2>
            </div>
            <strong>{model.seasonal.hijriYear} AH</strong>
          </header>
          <div className="today-seasonal__times">
            <div>
              <span>{text.imsak}</span>
              <strong>{formatTime(model.seasonal.imsakLocalMinutes)}</strong>
            </div>
            <div>
              <span>{text.suhurEnds}</span>
              <strong>{formatTime(model.seasonal.suhurEndsAtLocalMinutes)}</strong>
            </div>
            <div>
              <span>{text.iftar}</span>
              <strong>{formatTime(model.seasonal.iftarLocalMinutes)}</strong>
            </div>
          </div>
          {model.seasonal.taraweehSessions.length > 0 && (
            <div className="today-seasonal__taraweeh">
              <span>{text.taraweeh}</span>
              <div>
                {model.seasonal.taraweehSessions.map((session, index) => (
                  <strong key={`${session.label}-${String(index)}`}>
                    <BidiText>{session.label}</BidiText> · {formatTime(session.startLocalMinutes)}
                  </strong>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {props.showCommunity !== false && model.community !== null && (
        <section className="today-community-preview" aria-labelledby="today-community-title">
          <header>
            <div>
              <p>{text.communityEyebrow}</p>
              <h2 id="today-community-title">{text.communityTitle}</h2>
            </div>
            <a href={props.communityHref}>{text.viewCommunity}</a>
          </header>
          <div className="today-community-preview__grid">
            {model.community.announcement !== null && (
              <article dir={model.community.announcement.direction}>
                <span>{text.announcement}</span>
                <strong>{model.community.announcement.title}</strong>
                <p>{model.community.announcement.body}</p>
              </article>
            )}
            {model.community.event !== null && (
              <article dir={model.community.event.direction}>
                <span>{text.event}</span>
                <strong>{model.community.event.title}</strong>
                <dl>
                  <div>
                    <dt>{text.starts}</dt>
                    <dd>
                      {eventStart(
                        model.community.event.startsAt,
                        locale,
                        model.community.event.allDay,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{text.venue}</dt>
                    <dd>{model.community.event.venue}</dd>
                  </div>
                </dl>
              </article>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
