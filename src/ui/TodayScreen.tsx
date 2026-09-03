import { useEffect, useMemo, useState } from 'react';

import '../today-contextual-v2.css';
import '../today-prayer-provenance.css';

import {
  applyAustralianMosqueCongregationTimes,
  publishedAustralianMosqueCongregationMinutes,
} from '../domain/australianMosquePrayerContext';
import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { displayedHighLatitudeRuleApplied } from '../domain/highLatitudeIndicators';
import {
  greatCircleDistanceKilometers,
  MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS,
} from '../domain/greatCircleDistance';
import { calculationMethods } from '../domain/methods';
import { buildPrayerBoardData, type PrayerBoardData } from '../domain/prayerBoardTemplate';
import { isSupplementaryPrayer } from '../domain/prayerPresentation';
import { displayedManualPrayerAdjustmentMinutes } from '../domain/prayerAdjustments';
import type { PrayerName } from '../domain/prayerEngine';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  translate,
} from '../i18n/i18n';
import { todayContextCopy } from '../i18n/todayContextV2Translations';
import type { Locale, TranslationKey } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadRecentBestAvailableLocation } from '../platform/bestAvailableLocation';
import { loadMosqueProfileLibrary } from '../platform/mosqueProfileLibrary';
import {
  loadSelectedDirectoryMosqueContext,
  type SelectedDirectoryMosqueContext,
} from '../platform/selectedDirectoryMosqueContext';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';
import { readSystemTime } from '../platform/systemTime';
import { BidiText } from './BidiText';
import { TodayContextualSections } from './TodayContextualSections';
import { useMobilePrayerThemeConfig, useMobilePrayerWeather } from './MobilePrayerThemeSurface';
import { PrayerBoardWeatherModule } from './PrayerBoardWeatherModule';
import { SalahIcon } from './SalahIcon';
import {
  searchForCongregationDestination,
  searchForSettingsCategory,
  type CongregationDestination,
} from './applicationRoute';
import { todayPrayerProvenancePresentation } from './todayPrayerProvenance';

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const sourceTranslationKeys: Readonly<
  Record<PersistedSettings['prayerSourceMode'], TranslationKey>
> = {
  calculated: 'sourceCalculated',
  'calculated-adjustments': 'sourceCalculatedAdjustments',
  'local-mosque': 'sourceLocalMosque',
};

const highLatitudeRuleTranslationKeys: Readonly<
  Record<PersistedSettings['highLatitudeRule'], TranslationKey>
> = {
  'angle-based': 'highLatitudeAngle',
  'middle-of-the-night': 'highLatitudeMiddle',
  'one-seventh': 'highLatitudeSeventh',
};

const destinationLabels: Readonly<
  Record<Locale, Readonly<Record<'mosques' | 'qiblah' | 'settings' | 'far', string>>>
> = {
  en: { mosques: 'Mosques', qiblah: 'Qiblah', settings: 'Settings', far: 'Far' },
  ar: { mosques: 'المساجد', qiblah: 'القبلة', settings: 'الإعدادات', far: 'بعيد' },
  tr: { mosques: 'Camiler', qiblah: 'Kıble', settings: 'Ayarlar', far: 'Uzak' },
  id: { mosques: 'Masjid', qiblah: 'Kiblat', settings: 'Pengaturan', far: 'Jauh' },
};

const stage8TodayCopy: Readonly<
  Record<
    Locale,
    Readonly<{
      localContext: string;
      liveLocation: string;
      recentLocation: string;
      savedLocation: string;
      approximate: string;
      precise: string;
      selectedMosque: string;
      mosqueLocation: string;
      betweenPrayerTimes: string;
      fajrEnds: string;
      nonPrayerTime: string;
      notApplicable: string;
      iqamahNotPublished: string;
      mosquePublishedIqamah: string;
      moreToday: string;
      moreTodayHint: string;
    }>
  >
> = {
  en: {
    localContext: 'Local context',
    liveLocation: 'Live location',
    recentLocation: 'Recent location',
    savedLocation: 'Saved location',
    approximate: 'Approximate',
    precise: 'Precise',
    selectedMosque: 'Selected mosque',
    mosqueLocation: 'Mosque location',
    betweenPrayerTimes: 'Between prayer times',
    fajrEnds: 'Fajr ends',
    nonPrayerTime: 'Non-prayer time',
    notApplicable: 'Not applicable',
    iqamahNotPublished: 'Not published',
    mosquePublishedIqamah: 'Iqamah/Jama’ah from the selected mosque listing where published',
    moreToday: 'More today',
    moreTodayHint: 'Solar times, Jumu’ah, shortcuts and calculation details',
  },
  ar: {
    localContext: 'السياق المحلي',
    liveLocation: 'موقع مباشر',
    recentLocation: 'موقع حديث',
    savedLocation: 'موقع محفوظ',
    approximate: 'تقريبي',
    precise: 'دقيق',
    selectedMosque: 'المسجد المختار',
    mosqueLocation: 'موقع المسجد',
    betweenPrayerTimes: 'بين أوقات الصلوات',
    fajrEnds: 'ينتهي وقت الفجر',
    nonPrayerTime: 'ليس وقت صلاة مفروضة',
    notApplicable: 'لا ينطبق',
    iqamahNotPublished: 'غير منشور',
    mosquePublishedIqamah: 'الإقامة/الجماعة من بيانات المسجد المختار عند نشرها',
    moreToday: 'المزيد لليوم',
    moreTodayHint: 'الشروق والغروب والجمعة والاختصارات وتفاصيل الحساب',
  },
  tr: {
    localContext: 'Yerel bağlam',
    liveLocation: 'Canlı konum',
    recentLocation: 'Son konum',
    savedLocation: 'Kayıtlı konum',
    approximate: 'Yaklaşık',
    precise: 'Hassas',
    selectedMosque: 'Seçili cami',
    mosqueLocation: 'Cami konumu',
    betweenPrayerTimes: 'Namaz vakitleri arasında',
    fajrEnds: 'Sabah vakti biter',
    nonPrayerTime: 'Farz namaz vakti değildir',
    notApplicable: 'Uygulanmaz',
    iqamahNotPublished: 'Yayımlanmamış',
    mosquePublishedIqamah: 'Yayımlandığında seçili cami kaydındaki kamet/cemaat saati',
    moreToday: 'Bugün daha fazlası',
    moreTodayHint: 'Güneş vakitleri, Cuma, kısayollar ve hesaplama ayrıntıları',
  },
  id: {
    localContext: 'Konteks lokal',
    liveLocation: 'Lokasi langsung',
    recentLocation: 'Lokasi terbaru',
    savedLocation: 'Lokasi tersimpan',
    approximate: 'Perkiraan',
    precise: 'Akurat',
    selectedMosque: 'Masjid terpilih',
    mosqueLocation: 'Lokasi masjid',
    betweenPrayerTimes: 'Di antara waktu salat',
    fajrEnds: 'Waktu Subuh berakhir',
    nonPrayerTime: 'Bukan waktu salat wajib',
    notApplicable: 'Tidak berlaku',
    iqamahNotPublished: 'Tidak dipublikasikan',
    mosquePublishedIqamah: 'Iqamah/jamaah dari daftar masjid terpilih bila dipublikasikan',
    moreToday: 'Lainnya hari ini',
    moreTodayHint: 'Waktu matahari, Jumat, pintasan, dan detail perhitungan',
  },
};

function initialSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function initialSelectedDirectoryMosqueContext(): SelectedDirectoryMosqueContext | null {
  try {
    const storage = getApplicationStorage();
    const selectedProfileId = loadMosqueProfileLibrary(storage).selectedProfileId;
    if (selectedProfileId === null) return null;
    const context = loadSelectedDirectoryMosqueContext(storage);
    return context?.mosqueId === selectedProfileId ? context : null;
  } catch {
    return null;
  }
}

function destinationHref(destination: CongregationDestination): string {
  const search = searchForCongregationDestination(window.location.search, destination);
  return `${window.location.pathname}${search}${window.location.hash}`;
}

function prayerSettingsHref(): string {
  const search = searchForSettingsCategory(window.location.search, 'prayer');
  return `${window.location.pathname}${search}${window.location.hash}`;
}

function localeClockTag(locale: Locale): string {
  switch (locale) {
    case 'ar':
      return 'ar';
    case 'tr':
      return 'tr-TR';
    case 'id':
      return 'id-ID';
    case 'en':
    default:
      return 'en-AU';
  }
}

function formatPrayerBoardClock(
  clock: PrayerBoardData['clock'],
  locale: Locale,
  hourCycle: PersistedSettings['timeFormat'],
): string {
  const instant = new Date(Date.UTC(2000, 0, 1, clock.hour, clock.minute, clock.second));
  return new Intl.DateTimeFormat(localeClockTag(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle,
  }).format(instant);
}

function prayerBoardCivilDate(data: PrayerBoardData): Date {
  const value = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  if (!Number.isFinite(value.getTime())) {
    throw new RangeError('Prayer-board civil date is invalid');
  }
  return value;
}

export function TodayScreen() {
  const settings = useMemo(initialSettings, []);
  const selectedDirectoryContext = useMemo(initialSelectedDirectoryMosqueContext, []);
  const activeDirectoryMosque =
    selectedDirectoryContext !== null && settings.prayerSourceMode !== 'local-mosque'
      ? selectedDirectoryContext
      : null;
  const directoryMosqueActive = activeDirectoryMosque !== null;
  const mobileThemeConfig = useMobilePrayerThemeConfig();
  const weather = useMobilePrayerWeather();
  const modules = mobileThemeConfig.moduleVisibility;
  const locale = settings.locale;
  const contextualCopy = todayContextCopy[locale];
  const uxCopy = stage8TodayCopy[locale];
  const prayerProvenance = todayPrayerProvenancePresentation({
    locale,
    methodId: settings.calculationMethodId,
    asrConvention: settings.asrConvention,
    prayerAdjustments: settings.prayerAdjustments,
  });
  const selectedMosqueDistanceKilometers =
    activeDirectoryMosque !== null && settings.location !== null
      ? greatCircleDistanceKilometers(
          settings.location.coordinates,
          activeDirectoryMosque.coordinates,
        )
      : null;
  const selectedMosqueFarAway =
    selectedMosqueDistanceKilometers !== null &&
    selectedMosqueDistanceKilometers > MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS;
  const directoryMosqueLocationAdopted =
    activeDirectoryMosque !== null && (settings.location === null || !selectedMosqueFarAway);
  const coordinates = directoryMosqueLocationAdopted
    ? activeDirectoryMosque.coordinates
    : (settings.location?.coordinates ?? null);
  const timeZoneOverride = directoryMosqueLocationAdopted
    ? activeDirectoryMosque.timeZone
    : (settings.location?.timeZone ?? null);
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const refreshNow = () => {
      setNow(readSystemTime());
    };
    const timer = window.setInterval(refreshNow, 1_000);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, []);

  useEffect(() => {
    const markOnline = () => {
      setOnline(true);
    };
    const markOffline = () => {
      setOnline(false);
    };
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  const dashboardResult = useMemo(
    () =>
      coordinates === null || now === null
        ? null
        : buildPrayerDashboardResult({
            instant: now,
            coordinates,
            ...(timeZoneOverride === null ? {} : { timeZone: timeZoneOverride }),
            method: calculationMethods[settings.calculationMethodId],
            asrConvention: settings.asrConvention,
            highLatitudeRule: settings.highLatitudeRule,
            adjustments: settings.prayerAdjustments,
            hijriCorrectionDays: settings.hijriCorrectionDays,
          }),
    [coordinates, now, settings, timeZoneOverride],
  );
  const dashboard = dashboardResult?.ok === true ? dashboardResult.dashboard : null;
  const calculationUnavailable = dashboardResult?.ok === false;
  const unavailablePrayers = dashboardResult?.ok === true ? dashboardResult.unavailablePrayers : [];
  const sourcedDashboard = useMemo(() => {
    if (dashboard === null) return null;
    const sourced = applyPrayerSourceToDashboard({
      dashboard,
      sourceMode: settings.prayerSourceMode,
      mosqueTimetable: settings.mosqueTimetable,
    });
    return activeDirectoryMosque === null
      ? sourced
      : applyAustralianMosqueCongregationTimes(sourced, activeDirectoryMosque);
  }, [activeDirectoryMosque, dashboard, settings.mosqueTimetable, settings.prayerSourceMode]);
  const prayerBoardData = useMemo(
    () =>
      sourcedDashboard === null
        ? null
        : buildPrayerBoardData({
            dashboard: sourcedDashboard,
            offline: !online,
          }),
    [online, sourcedDashboard],
  );

  const currentClock =
    now === null
      ? '—'
      : prayerBoardData === null
        ? new Intl.DateTimeFormat(localeClockTag(locale), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: settings.timeFormat,
          }).format(now)
        : formatPrayerBoardClock(prayerBoardData.clock, locale, settings.timeFormat);

  const nextPrayerLabel =
    prayerBoardData?.nextPrayer === null || prayerBoardData?.nextPrayer === undefined
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[prayerBoardData.nextPrayer.name]);
  const nextPrayerStart =
    prayerBoardData?.nextPrayer === null || prayerBoardData?.nextPrayer === undefined
      ? '—'
      : formatLocalTime(prayerBoardData.nextPrayer.startLocalMinutes, locale, settings.timeFormat);
  const nextPrayerIqamahMinutes = prayerBoardData?.nextPrayer?.iqamahLocalMinutes ?? null;
  const nextPrayerIqamah =
    nextPrayerIqamahMinutes === null
      ? directoryMosqueActive
        ? uxCopy.iqamahNotPublished
        : translate(locale, 'noIqamah')
      : formatLocalTime(nextPrayerIqamahMinutes, locale, settings.timeFormat);
  const contextLabel = selectedMosqueFarAway
    ? (prayerBoardData?.timeZone ??
      settings.location?.timeZone ??
      translate(locale, 'notConfigured'))
    : (prayerBoardData?.mosqueName ??
      prayerBoardData?.timeZone ??
      settings.location?.timeZone ??
      translate(locale, 'notConfigured'));
  const quickLabels = destinationLabels[locale];
  const currentPrayer =
    prayerBoardData?.prayers.find(
      (prayer) => prayer.isCurrent && !isSupplementaryPrayer(prayer.name),
    ) ?? null;
  const currentPrayerLabel =
    prayerBoardData === null
      ? translate(locale, 'notConfigured')
      : currentPrayer === null
        ? uxCopy.betweenPrayerTimes
        : translate(locale, prayerTranslationKeys[currentPrayer.name]);
  const recentLocation = useMemo(() => {
    if (coordinates === null || directoryMosqueLocationAdopted) return null;
    try {
      return loadRecentBestAvailableLocation(getApplicationStorage());
    } catch {
      return null;
    }
  }, [coordinates, directoryMosqueLocationAdopted]);
  const locationSourceLabel = directoryMosqueLocationAdopted
    ? uxCopy.selectedMosque
    : recentLocation?.freshness === 'live'
      ? uxCopy.liveLocation
      : recentLocation !== null
        ? uxCopy.recentLocation
        : uxCopy.savedLocation;
  const locationConfidenceLabel = directoryMosqueLocationAdopted
    ? uxCopy.mosqueLocation
    : recentLocation?.isApproximate === true
      ? uxCopy.approximate
      : uxCopy.precise;
  const locationAccuracyMeters =
    directoryMosqueLocationAdopted || recentLocation === null
      ? null
      : recentLocation.accuracyMeters;
  const locationAccuracyLabel =
    locationAccuracyMeters === null
      ? null
      : locationAccuracyMeters < 1_000
        ? `±${String(Math.round(locationAccuracyMeters))} m`
        : `±${(locationAccuracyMeters / 1_000).toFixed(1)} km`;
  const selectedMosqueDistance =
    selectedMosqueDistanceKilometers === null
      ? null
      : `${String(Math.round(selectedMosqueDistanceKilometers))} km${selectedMosqueFarAway ? ` · ${destinationLabels[locale].far}` : ''}`;

  return (
    <main
      className="today-screen"
      data-prayer-board-data-version={prayerBoardData?.version}
      data-prayer-board-source={prayerBoardData?.sourceMode}
      data-selected-directory-mosque-id={activeDirectoryMosque?.mosqueId}
      data-mobile-module-dates={modules.dates ? 'visible' : 'hidden'}
      data-mobile-module-jumuah={modules.jumuah ? 'visible' : 'hidden'}
      data-mobile-module-sunrise-sunset={modules['sunrise-sunset'] ? 'visible' : 'hidden'}
      data-mobile-module-mosque-branding={modules['mosque-branding'] ? 'visible' : 'hidden'}
      data-mobile-module-announcements={modules.announcements ? 'visible' : 'hidden'}
    >
      {prayerBoardData?.offline === true && (
        <p className="today-screen__offline" role="status">
          {translate(locale, 'offline')}
        </p>
      )}

      <header className="today-appbar">
        <div className="today-appbar__brand">
          <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
          <div>
            <strong>{translate(locale, 'appName')}</strong>
            {modules['mosque-branding'] && (
              <span>
                <BidiText>{contextLabel}</BidiText>
              </span>
            )}
          </div>
        </div>
        <div className="today-appbar__meta">
          <span className="today-appbar__clock" aria-label={translate(locale, 'currentTime')}>
            {currentClock}
          </span>
          <a href={destinationHref('settings')} aria-label={translate(locale, 'language')}>
            {locale.toUpperCase()}
          </a>
        </div>
      </header>

      {now === null ? (
        <section className="today-state" role="alert">
          <p>{translate(locale, 'currentTime')}</p>
          <h1>{translate(locale, 'systemTimeInvalid')}</h1>
          <span>{translate(locale, 'systemTimeInvalidHelp')}</span>
        </section>
      ) : calculationUnavailable ? (
        <section className="today-state" role="alert">
          <p>{translate(locale, 'dailyPrayers')}</p>
          <h1>{translate(locale, 'calculationUnavailable')}</h1>
          <span>{translate(locale, 'calculationUnavailableHelp')}</span>
        </section>
      ) : prayerBoardData === null || sourcedDashboard === null ? (
        <section className="today-state">
          <p>{translate(locale, 'currentLocation')}</p>
          <h1>{translate(locale, 'configureLocation')}</h1>
          <a className="today-state__action" href={destinationHref('settings')}>
            {translate(locale, 'settings')}
          </a>
        </section>
      ) : (
        <>
          <section className="today-next" aria-labelledby="today-next-prayer">
            <div className="today-next__current" data-current-prayer>
              <span>{translate(locale, 'currentPrayer')}</span>
              <strong>{currentPrayerLabel}</strong>
            </div>
            <div className="today-next__identity">
              <p>{translate(locale, 'nextPrayer')}</p>
              <h1 id="today-next-prayer">{nextPrayerLabel}</h1>
              {prayerBoardData.nextPrayer?.dayOffset === 1 && (
                <span className="today-next__tomorrow">{translate(locale, 'tomorrow')}</span>
              )}
            </div>
            <div className="today-next__countdown">
              <span>{translate(locale, 'countdown')}</span>
              <strong>
                {prayerBoardData.nextPrayer === null
                  ? '—'
                  : formatCountdown(prayerBoardData.nextPrayer.secondsUntil, locale)}
              </strong>
            </div>
            <dl className="today-next__times">
              <div>
                <dt>{translate(locale, 'prayerStart')}</dt>
                <dd>{nextPrayerStart}</dd>
              </div>
              <div>
                <dt>{translate(locale, 'iqamah')}</dt>
                <dd>{nextPrayerIqamah}</dd>
              </div>
            </dl>
          </section>

          <div className="today-prayer-provenance">
            <a
              className="today-prayer-provenance__chip"
              href={prayerSettingsHref()}
              aria-label={prayerProvenance.ariaLabel}
              data-manual-adjustments={prayerProvenance.hasManualAdjustments ? 'true' : 'false'}
            >
              <BidiText>{prayerProvenance.methodLabel}</BidiText>
              <span aria-hidden="true">·</span>
              <span>{prayerProvenance.asrLabel}</span>
              {prayerProvenance.adjustedLabel !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{prayerProvenance.adjustedLabel}</span>
                </>
              )}
            </a>
          </div>

          <section className="today-local-context" aria-label={uxCopy.localContext}>
            <div
              className="today-location-confidence"
              data-location-confidence={
                directoryMosqueLocationAdopted
                  ? 'mosque'
                  : recentLocation?.isApproximate === true
                    ? 'approximate'
                    : recentLocation === null
                      ? 'saved'
                      : 'precise'
              }
            >
              <div>
                <span>{uxCopy.localContext}</span>
                <strong>
                  {directoryMosqueLocationAdopted && (
                    <SalahIcon name="mosques" className="today-location-confidence__mosque-icon" />
                  )}
                  {locationSourceLabel}
                </strong>
              </div>
              <div className="today-location-confidence__meta">
                <span>{locationConfidenceLabel}</span>
                {locationAccuracyLabel !== null && <span>{locationAccuracyLabel}</span>}
                <span dir="auto">{contextLabel}</span>
              </div>
            </div>
            {modules.weather && <PrayerBoardWeatherModule weather={weather} locale={locale} />}
          </section>

          {modules.dates && (
            <section className="today-dates" aria-label={translate(locale, 'today')}>
              <div>
                <span>{translate(locale, 'gregorianDate')}</span>
                <strong>
                  {formatGregorianCivilDate(prayerBoardCivilDate(prayerBoardData), locale)}
                </strong>
              </div>
              <div>
                <span>{translate(locale, 'hijriDate')}</span>
                <strong>
                  {formatHijriCivilDate(
                    prayerBoardCivilDate(prayerBoardData),
                    locale,
                    prayerBoardData.hijri.correctionDays,
                  )}
                </strong>
              </div>
            </section>
          )}

          <section className="today-schedule" aria-labelledby="today-schedule-title">
            <div className="today-section-heading">
              <div>
                <p>{translate(locale, 'today')}</p>
                <h2 id="today-schedule-title">{translate(locale, 'dailyPrayers')}</h2>
              </div>
              <span>
                {translate(locale, 'sourceMode')} ·{' '}
                {translate(locale, sourceTranslationKeys[prayerBoardData.sourceMode])}
                {directoryMosqueActive && (
                  <small data-mosque-iqamah-source="directory-published">
                    {uxCopy.mosquePublishedIqamah}
                  </small>
                )}
                {activeDirectoryMosque !== null && selectedMosqueDistance !== null && (
                  <small data-selected-mosque-distance={selectedMosqueFarAway ? 'far' : 'near'}>
                    <BidiText>{activeDirectoryMosque.mosqueName}</BidiText> ·{' '}
                    {selectedMosqueDistance}
                  </small>
                )}
              </span>
            </div>

            <div
              className="today-prayer-table"
              role="table"
              aria-label={translate(locale, 'dailyPrayers')}
            >
              <div className="today-prayer-row today-prayer-row--header" role="row">
                <span role="columnheader">{translate(locale, 'dailyPrayers')}</span>
                <span role="columnheader">{translate(locale, 'prayerStart')}</span>
                <span role="columnheader">{translate(locale, 'iqamah')}</span>
              </div>
              {prayerBoardData.prayers.map((prayer) => {
                const sourcePrayer = sourcedDashboard.prayers.find(
                  (candidate) => candidate.name === prayer.name,
                );
                const manualAdjustmentMinutes =
                  sourcePrayer === undefined
                    ? null
                    : displayedManualPrayerAdjustmentMinutes(
                        prayer.name,
                        sourcePrayer.manualAdjustmentMinutes,
                        prayerBoardData.sourceMode,
                      );
                const highLatitudeApplied =
                  sourcePrayer === undefined
                    ? false
                    : displayedHighLatitudeRuleApplied(
                        prayer.name,
                        sourcePrayer.highLatitudeRuleApplied,
                        prayerBoardData.sourceMode,
                      );
                const isSunrise = prayer.name === 'sunrise';
                const publishedIqamahMinutes =
                  activeDirectoryMosque !== null && !isSunrise
                    ? publishedAustralianMosqueCongregationMinutes(
                        activeDirectoryMosque.prayerTimes,
                        prayer.name,
                      )
                    : [];
                const stateLabel = isSunrise
                  ? uxCopy.fajrEnds
                  : prayer.isCurrent
                    ? translate(locale, 'currentPrayer')
                    : prayer.isNext
                      ? translate(locale, 'nextPrayer')
                      : null;
                const iqamahDisplay = isSunrise
                  ? uxCopy.notApplicable
                  : publishedIqamahMinutes.length > 0
                    ? publishedIqamahMinutes
                        .map((minutes) => formatLocalTime(minutes, locale, settings.timeFormat))
                        .join(' / ')
                    : prayer.iqamahLocalMinutes === null
                      ? directoryMosqueActive
                        ? uxCopy.iqamahNotPublished
                        : translate(locale, 'noIqamah')
                      : formatLocalTime(prayer.iqamahLocalMinutes, locale, settings.timeFormat);
                return (
                  <div
                    className={`today-prayer-row${!isSunrise && prayer.isCurrent ? ' is-current' : ''}${
                      !isSunrise && prayer.isNext ? ' is-next' : ''
                    }${isSunrise ? ' today-prayer-row--sunrise' : ''}`}
                    role="row"
                    data-today-prayer-name={prayer.name}
                    data-directory-published-iqamah={
                      publishedIqamahMinutes.length > 0 ? 'true' : 'false'
                    }
                    key={prayer.name}
                  >
                    <div className="today-prayer-row__name" role="cell">
                      <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                      {stateLabel !== null && <span>{stateLabel}</span>}
                      {isSunrise && <small>{uxCopy.nonPrayerTime}</small>}
                      {highLatitudeApplied && (
                        <small>
                          {translate(locale, 'highLatitudeAdjustment')} ·{' '}
                          {translate(
                            locale,
                            highLatitudeRuleTranslationKeys[sourcedDashboard.base.highLatitudeRule],
                          )}
                        </small>
                      )}
                      {manualAdjustmentMinutes !== null && (
                        <small>
                          {translate(locale, 'manualOffset')}{' '}
                          {manualAdjustmentMinutes > 0 ? '+' : ''}
                          {String(manualAdjustmentMinutes)} {translate(locale, 'minutesShort')}
                        </small>
                      )}
                    </div>
                    <strong className="today-prayer-row__time" role="cell">
                      {prayer.startLocalMinutes === null
                        ? '—'
                        : formatLocalTime(prayer.startLocalMinutes, locale, settings.timeFormat)}
                    </strong>
                    <strong className="today-prayer-row__time today-prayer-row__iqamah" role="cell">
                      {iqamahDisplay}
                    </strong>
                  </div>
                );
              })}
            </div>
          </section>

          <TodayContextualSections
            settings={settings}
            dashboard={sourcedDashboard}
            unavailablePrayers={unavailablePrayers}
            online={!prayerBoardData.offline}
            now={now}
            communityHref={destinationHref('community')}
            mosquesHref={destinationHref('mosques')}
            showCommunity={modules.announcements}
          />

          <details className="today-secondary-context">
            <summary>
              <span>{uxCopy.moreToday}</span>
              <small>{uxCopy.moreTodayHint}</small>
            </summary>
            <div className="today-secondary-context__content">
              {modules['sunrise-sunset'] && (
                <section className="today-solar" aria-labelledby="today-solar-title">
                  <div className="today-section-heading">
                    <div>
                      <p>{contextualCopy.solarEyebrow}</p>
                      <h2 id="today-solar-title">{contextualCopy.solarTitle}</h2>
                    </div>
                  </div>
                  <div className="today-solar__times">
                    <div>
                      <span>{translate(locale, 'prayerSunrise')}</span>
                      <strong>
                        {prayerBoardData.solarEvents.sunriseLocalMinutes === null
                          ? '—'
                          : formatLocalTime(
                              prayerBoardData.solarEvents.sunriseLocalMinutes,
                              locale,
                              settings.timeFormat,
                            )}
                      </strong>
                    </div>
                    <div>
                      <span>{contextualCopy.sunset}</span>
                      <strong>
                        {prayerBoardData.solarEvents.sunsetLocalMinutes === null
                          ? '—'
                          : formatLocalTime(
                              prayerBoardData.solarEvents.sunsetLocalMinutes,
                              locale,
                              settings.timeFormat,
                            )}
                      </strong>
                    </div>
                  </div>
                </section>
              )}

              {modules.jumuah && prayerBoardData.jumuahSessions.length > 0 && (
                <section className="today-jumuah" aria-labelledby="today-jumuah-title">
                  <div className="today-section-heading">
                    <div>
                      <p>{translate(locale, 'today')}</p>
                      <h2 id="today-jumuah-title">{translate(locale, 'jumuah')}</h2>
                    </div>
                  </div>
                  <div className="today-jumuah__sessions">
                    {prayerBoardData.jumuahSessions.map((session) => (
                      <div key={session.label}>
                        <strong>
                          <BidiText>{session.label}</BidiText>
                        </strong>
                        <span>
                          {translate(locale, 'khutbah')} ·{' '}
                          {formatLocalTime(
                            session.khutbahLocalMinutes,
                            locale,
                            settings.timeFormat,
                          )}
                        </span>
                        <span>
                          {translate(locale, 'salah')} ·{' '}
                          {formatLocalTime(session.salahLocalMinutes, locale, settings.timeFormat)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <nav className="today-quick-actions" aria-label={translate(locale, 'today')}>
                <a href={destinationHref('qiblah')}>{quickLabels.qiblah}</a>
                <a href={destinationHref('mosques')}>{quickLabels.mosques}</a>
                <a href={destinationHref('settings')}>{quickLabels.settings}</a>
              </nav>

              <footer className="today-provenance">
                <span>
                  {translate(locale, 'timezone')}: <BidiText>{prayerBoardData.timeZone}</BidiText>
                </span>
                {modules['mosque-branding'] && prayerBoardData.mosqueName !== null && (
                  <span>
                    {translate(locale, 'selectedMosque')}:{' '}
                    <BidiText>{prayerBoardData.mosqueName}</BidiText>
                  </span>
                )}
              </footer>
            </div>
          </details>
        </>
      )}
    </main>
  );
}
