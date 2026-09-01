import { useEffect, useMemo, useState } from 'react';

import { buildCommunityFeed } from '../domain/communityFeed';
import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { calculationMethods } from '../domain/methods';
import { greatCircleDistanceKilometers } from '../domain/greatCircleDistance';
import type { MosqueFacility, MosqueProfile } from '../domain/mosqueProfile';
import type { PrayerSourceMode } from '../domain/mosqueTimetable';
import type { PrayerName } from '../domain/prayerEngine';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { formatLocalTime, localeTag, translate } from '../i18n/i18n';
import { mosquesV2Copy } from '../i18n/mosquesCommunityV2Translations';
import type { Locale, TranslationKey } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadCommunityContentLibrary,
  type CommunityContentLibrary,
} from '../platform/communityContentStorage';
import { MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT } from '../platform/mosqueProfileEvents';
import {
  loadMosqueProfileLibrary,
  saveMosqueProfileLibrary,
  selectMosqueProfile,
  type MosqueProfileLibraryState,
} from '../platform/mosqueProfileLibrary';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

type MosqueListMode = 'followed' | 'nearby';

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const facilityLabels: Readonly<Record<Locale, Readonly<Record<MosqueFacility, string>>>> = {
  en: {
    wudu: 'Wudu',
    toilets: 'Toilets',
    parking: 'Parking',
    'women-prayer-space': 'Women’s prayer space',
    'wheelchair-accessible': 'Wheelchair accessible',
    'family-room': 'Family room',
    'hearing-loop': 'Hearing loop',
  },
  ar: {
    wudu: 'وضوء',
    toilets: 'دورات مياه',
    parking: 'مواقف',
    'women-prayer-space': 'مصلى للنساء',
    'wheelchair-accessible': 'مهيأ للكراسي المتحركة',
    'family-room': 'غرفة عائلية',
    'hearing-loop': 'حلقة سمعية',
  },
  tr: {
    wudu: 'Abdest',
    toilets: 'Tuvaletler',
    parking: 'Otopark',
    'women-prayer-space': 'Kadınlar namaz alanı',
    'wheelchair-accessible': 'Tekerlekli sandalye erişimi',
    'family-room': 'Aile odası',
    'hearing-loop': 'İşitme döngüsü',
  },
  id: {
    wudu: 'Wudu',
    toilets: 'Toilet',
    parking: 'Parkir',
    'women-prayer-space': 'Ruang salat wanita',
    'wheelchair-accessible': 'Akses kursi roda',
    'family-room': 'Ruang keluarga',
    'hearing-loop': 'Loop pendengaran',
  },
};

const timetableFreshnessLabels: Readonly<
  Record<Locale, Readonly<{ current: string; missing: string }>>
> = {
  en: {
    current: 'Today’s timetable row is available on this device.',
    missing:
      'The linked timetable has no row for today; mosque start and Iqamah times are unavailable.',
  },
  ar: {
    current: 'صف جدول اليوم متاح على هذا الجهاز.',
    missing: 'الجدول المرتبط لا يحتوي على صف لليوم؛ أوقات بدء الصلاة والإقامة للمسجد غير متاحة.',
  },
  tr: {
    current: 'Bugünün takvim satırı bu cihazda mevcut.',
    missing:
      'Bağlı takvimde bugün için satır yok; cami başlangıç ve kamet saatleri kullanılamıyor.',
  },
  id: {
    current: 'Baris jadwal hari ini tersedia di perangkat ini.',
    missing:
      'Jadwal tertaut tidak memiliki baris untuk hari ini; waktu mulai dan iqamah masjid tidak tersedia.',
  },
};

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

function readCommunity(): CommunityContentLibrary {
  try {
    return loadCommunityContentLibrary(getApplicationStorage());
  } catch {
    return { announcements: [], events: [] };
  }
}

function localizedText(
  value: Readonly<{ en?: string; ar?: string }> | null,
  locale: Locale,
): string | null {
  if (value === null) return null;
  return locale === 'ar' ? (value.ar ?? value.en ?? null) : (value.en ?? value.ar ?? null);
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('en-AU');
}

function timetableMatchesProfile(settings: PersistedSettings, profile: MosqueProfile): boolean {
  if (settings.mosqueTimetable === null) return false;
  const timetableName = normalized(settings.mosqueTimetable.mosqueName);
  return [profile.name.en, profile.name.ar]
    .filter((value): value is string => value !== undefined)
    .some((value) => normalized(value) === timetableName);
}

function profileSourceMode(
  settings: PersistedSettings,
  linkedTimetable: boolean,
): PrayerSourceMode {
  if (settings.prayerSourceMode === 'local-mosque') {
    return linkedTimetable ? 'local-mosque' : 'calculated';
  }
  return settings.prayerSourceMode;
}

function distanceKm(
  from: Readonly<{ latitude: number; longitude: number }>,
  to: Readonly<{ latitude: number; longitude: number }>,
): number {
  return greatCircleDistanceKilometers(from, to);
}

function formatDistance(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} km`;
}

function formatEventStart(value: string, locale: Locale, allDay: boolean): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    ...(allDay ? {} : { timeStyle: 'short' as const }),
  }).format(new Date(value));
}

export function MosquesScreen() {
  const [settings, setSettings] = useState<PersistedSettings>(readSettings);
  const [library, setLibrary] = useState<MosqueProfileLibraryState>(readMosques);
  const [community, setCommunity] = useState<CommunityContentLibrary>(readCommunity);
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<MosqueListMode>('followed');
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(
    () => readMosques().selectedProfileId,
  );
  const locale = settings.locale;
  const text = mosquesV2Copy[locale];

  useEffect(() => {
    const refresh = () => {
      const nextLibrary = readMosques();
      setSettings(readSettings());
      setLibrary(nextLibrary);
      setCommunity(readCommunity());
      setViewedProfileId((current) => {
        if (current !== null && nextLibrary.profiles.some((profile) => profile.id === current)) {
          return current;
        }
        return nextLibrary.selectedProfileId ?? nextLibrary.profiles[0]?.id ?? null;
      });
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

  const filteredProfiles = useMemo(() => {
    const needle = normalized(query);
    const matches = library.profiles.filter((profile) => {
      if (needle.length === 0) return true;
      const haystack = [
        profile.name.en,
        profile.name.ar,
        profile.address.formatted,
        ...profile.facilities,
      ]
        .filter((value): value is string => value !== undefined)
        .join(' ')
        .toLocaleLowerCase('en-AU');
      return haystack.includes(needle);
    });
    const savedCoordinates = settings.location?.coordinates ?? null;
    if (mode !== 'nearby' || !nearbyEnabled || savedCoordinates === null) return matches;
    return [...matches].sort(
      (left, right) =>
        distanceKm(savedCoordinates, left.coordinates) -
        distanceKm(savedCoordinates, right.coordinates),
    );
  }, [library.profiles, mode, nearbyEnabled, query, settings.location]);

  const viewedProfile =
    library.profiles.find((profile) => profile.id === viewedProfileId) ??
    library.profiles.find((profile) => profile.id === library.selectedProfileId) ??
    library.profiles[0] ??
    null;

  const linkedTimetable =
    viewedProfile === null ? false : timetableMatchesProfile(settings, viewedProfile);
  const sourceMode = profileSourceMode(settings, linkedTimetable);
  const dashboardResult = useMemo(
    () =>
      viewedProfile === null
        ? null
        : buildPrayerDashboardResult({
            instant: now,
            coordinates: viewedProfile.coordinates,
            timeZone: viewedProfile.timeZone,
            method: calculationMethods[settings.calculationMethodId],
            asrConvention: settings.asrConvention,
            highLatitudeRule: settings.highLatitudeRule,
            adjustments: settings.prayerAdjustments,
            hijriCorrectionDays: settings.hijriCorrectionDays,
          }),
    [now, settings, viewedProfile],
  );
  const sourcedDashboard = useMemo(() => {
    if (dashboardResult?.ok !== true) return null;
    return applyPrayerSourceToDashboard({
      dashboard: dashboardResult.dashboard,
      sourceMode,
      mosqueTimetable: linkedTimetable ? settings.mosqueTimetable : null,
    });
  }, [dashboardResult, linkedTimetable, settings.mosqueTimetable, sourceMode]);
  const timetableHasToday =
    linkedTimetable &&
    dashboardResult?.ok === true &&
    settings.mosqueTimetable?.days.some(
      (day) => day.date === dashboardResult.dashboard.today.date,
    ) === true;

  const profileCommunity = useMemo(
    () =>
      viewedProfile === null
        ? { announcements: [], events: [] }
        : buildCommunityFeed({
            announcements: community.announcements,
            events: community.events,
            now: now.toISOString(),
            locale: locale === 'ar' ? 'ar' : 'en',
            surface: 'mobile',
            mosqueId: viewedProfile.id,
          }),
    [community, locale, now, viewedProfile],
  );

  if (smartDisplayModeRequested(window.location.search)) return null;

  const persistSelection = (profile: MosqueProfile) => {
    const next = selectMosqueProfile(library, profile.id);
    saveMosqueProfileLibrary(getApplicationStorage(), next);
    setLibrary(next);
    setViewedProfileId(profile.id);
    window.dispatchEvent(new Event(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT));
  };

  const nextPrayer = sourcedDashboard?.nextPrayer ?? null;
  const nextPrayerTime = sourcedDashboard?.nextPrayerLocalMinutes ?? null;

  return (
    <main
      className="mosques-screen"
      aria-labelledby="mosques-screen-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="mosques-screen__header">
        <div>
          <p className="mosques-screen__eyebrow">SalahOS</p>
          <h2 id="mosques-screen-title">{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
      </header>

      <section className="mosques-browser" aria-label={text.followed}>
        <div className="mosques-browser__toolbar">
          <div className="mosques-browser__tabs" role="tablist" aria-label={text.title}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'followed'}
              onClick={() => {
                setMode('followed');
              }}
            >
              {text.followed}
              <span>{library.profiles.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'nearby'}
              onClick={() => {
                setMode('nearby');
              }}
            >
              {text.nearby}
            </button>
          </div>
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
        </div>

        {mode === 'nearby' && !nearbyEnabled && (
          <div className="mosques-nearby-gate">
            <p>{text.nearbyPrivacy}</p>
            {settings.location === null ? (
              <strong>{text.nearbyNeedsLocation}</strong>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNearbyEnabled(true);
                }}
              >
                {text.nearbyAction}
              </button>
            )}
          </div>
        )}
        {mode === 'nearby' && nearbyEnabled && settings.location !== null && (
          <p className="mosques-nearby-status" role="status">
            {text.nearbyUsingSaved}
          </p>
        )}

        {library.profiles.length === 0 ? (
          <div className="mosques-screen__empty">
            <p>{text.noFollowed}</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="mosques-screen__empty">
            <p>{text.noMatch}</p>
          </div>
        ) : (
          <div className="mosque-summary-grid">
            {filteredProfiles.map((profile) => {
              const selected = profile.id === library.selectedProfileId;
              const distance =
                mode === 'nearby' && nearbyEnabled && settings.location !== null
                  ? distanceKm(settings.location.coordinates, profile.coordinates)
                  : null;
              return (
                <article className="mosque-summary-card" data-selected={selected} key={profile.id}>
                  <div className="mosque-summary-card__identity">
                    <h3>
                      <bdi>{localizedText(profile.name, locale)}</bdi>
                    </h3>
                    <p>{profile.address.formatted}</p>
                    {distance !== null && (
                      <span>
                        {text.distance}: {formatDistance(distance, locale)}
                      </span>
                    )}
                  </div>
                  <div className="mosque-summary-card__actions">
                    <button
                      type="button"
                      className="quiet-button"
                      onClick={() => {
                        setViewedProfileId(profile.id);
                      }}
                    >
                      {text.viewProfile}
                    </button>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        persistSelection(profile);
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
      </section>

      {viewedProfile !== null && (
        <section className="mosque-profile-v2" aria-labelledby="mosque-profile-v2-title">
          <header className="mosque-profile-v2__header">
            <div>
              <p>{text.profile}</p>
              <h2 id="mosque-profile-v2-title">
                <bdi>{localizedText(viewedProfile.name, locale)}</bdi>
              </h2>
              {localizedText(viewedProfile.description, locale) !== null && (
                <p>{localizedText(viewedProfile.description, locale)}</p>
              )}
            </div>
            {viewedProfile.id === library.selectedProfileId && <span>{text.selected}</span>}
          </header>

          <div className="mosque-profile-v2__prayer-context">
            <div className="mosque-profile-next">
              <span>{text.nextPrayer}</span>
              <strong>
                {nextPrayer === null
                  ? text.unavailable
                  : translate(locale, prayerTranslationKeys[nextPrayer])}
              </strong>
              <bdi>
                {nextPrayerTime === null
                  ? '—'
                  : `${formatLocalTime(nextPrayerTime, locale, settings.timeFormat)}${
                      sourcedDashboard?.nextPrayerDayOffset === 1 ? ` · ${text.tomorrow}` : ''
                    }`}
              </bdi>
            </div>
            <div className="mosque-profile-source">
              <span>{text.source}</span>
              <strong>
                {linkedTimetable && sourceMode === 'local-mosque'
                  ? text.localTimetableSource
                  : text.calculatedSource}
              </strong>
              {linkedTimetable && sourceMode === 'local-mosque' && (
                <small>
                  {timetableHasToday
                    ? timetableFreshnessLabels[locale].current
                    : timetableFreshnessLabels[locale].missing}
                </small>
              )}
              {!linkedTimetable && settings.prayerSourceMode === 'local-mosque' && (
                <small>{text.localTimetableNotLinked}</small>
              )}
            </div>
          </div>

          <section
            className="mosque-profile-prayers"
            aria-labelledby="mosque-profile-prayers-title"
          >
            <h3 id="mosque-profile-prayers-title">{text.todayPrayerTimes}</h3>
            <div className="mosque-profile-prayers__list">
              {sourcedDashboard === null ? (
                <p>{text.unavailable}</p>
              ) : (
                sourcedDashboard.prayers
                  .filter((row) => row.name !== 'sunrise')
                  .map((row) => (
                    <div
                      className="mosque-profile-prayer-row"
                      data-next={row.isNext}
                      key={row.name}
                    >
                      <strong>{translate(locale, prayerTranslationKeys[row.name])}</strong>
                      <span>
                        {row.localMinutes === null
                          ? '—'
                          : formatLocalTime(row.localMinutes, locale, settings.timeFormat)}
                      </span>
                      <small>
                        {text.iqamah}:{' '}
                        {row.iqamahLocalMinutes === null
                          ? '—'
                          : formatLocalTime(row.iqamahLocalMinutes, locale, settings.timeFormat)}
                      </small>
                    </div>
                  ))
              )}
            </div>
          </section>

          <div className="mosque-profile-v2__secondary-grid">
            <section>
              <h3>{text.jumuah}</h3>
              {sourcedDashboard === null || sourcedDashboard.jumuahSessions.length === 0 ? (
                <p>{text.noJumuah}</p>
              ) : (
                <ul className="mosque-profile-list">
                  {sourcedDashboard.jumuahSessions.map((session) => (
                    <li key={`${session.label}:${String(session.salahLocalMinutes)}`}>
                      <strong>{session.label}</strong>
                      <span>
                        {formatLocalTime(session.salahLocalMinutes, locale, settings.timeFormat)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>{text.announcements}</h3>
              {profileCommunity.announcements.length === 0 ? (
                <p>{text.noAnnouncements}</p>
              ) : (
                <ul className="mosque-profile-list">
                  {profileCommunity.announcements.slice(0, 3).map((announcement) => (
                    <li key={announcement.id} dir={announcement.direction}>
                      <strong>{announcement.title}</strong>
                      <span>{announcement.body}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>{text.events}</h3>
              {profileCommunity.events.length === 0 ? (
                <p>{text.noEvents}</p>
              ) : (
                <ul className="mosque-profile-list">
                  {profileCommunity.events.slice(0, 3).map((event) => (
                    <li key={event.id} dir={event.direction}>
                      <strong>{event.title}</strong>
                      <span>{formatEventStart(event.startsAt, locale, event.allDay)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>{text.contact}</h3>
              <dl className="mosque-profile-meta">
                <div>
                  <dt>{text.address}</dt>
                  <dd>{viewedProfile.address.formatted}</dd>
                </div>
                <div>
                  <dt>{text.timezone}</dt>
                  <dd dir="ltr">{viewedProfile.timeZone}</dd>
                </div>
                <div>
                  <dt>{text.facilities}</dt>
                  <dd>
                    {viewedProfile.facilities.length === 0
                      ? text.noFacilities
                      : viewedProfile.facilities
                          .map((facility) => facilityLabels[locale][facility])
                          .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt>{text.contact}</dt>
                  <dd>
                    {viewedProfile.contact.email ?? viewedProfile.contact.phone ?? text.noContact}
                  </dd>
                </div>
              </dl>
              {viewedProfile.contact.links.length > 0 && (
                <div className="mosque-profile-links">
                  {viewedProfile.contact.links.map((link) => (
                    <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                      {localizedText(link.label ?? null, locale) ?? link.kind}
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      )}
    </main>
  );
}
