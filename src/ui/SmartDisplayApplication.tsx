import { useEffect, useMemo, useState } from 'react';

import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { calculationMethods } from '../domain/methods';
import { buildNotificationPrayerInputs } from '../domain/notificationPrayerInputs';
import { buildNotificationIntents } from '../domain/notificationSchedule';
import { resolveNotificationScheduleInstants } from '../domain/notificationInstant';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { applyDocumentLocale, formatZonedInstantTime } from '../i18n/i18n';
import { synchronizeAndroidPrayerNotifications } from '../platform/androidNotificationScheduler';
import { getApplicationStorage } from '../platform/applicationStorage';
import { createStructuredErrorLogger } from '../platform/errorLog';
import { synchronizeIosPrayerNotifications } from '../platform/iosNotificationScheduler';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';
import { createSystemClockChangeDetector } from '../platform/systemClockChange';
import { createSystemSleepWakeDetector } from '../platform/systemSleepWake';
import { readSystemTime, systemTimeFromMilliseconds } from '../platform/systemTime';
import { smartDisplayExitPath } from '../platform/smartDisplayNavigation';
import { installThemePreference } from '../platform/themePreference';
import { ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT } from './AndroidExactAlarmNotice';
import { SmartDisplay } from './SmartDisplay';

function initialSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

export function SmartDisplayApplication() {
  const settings = useMemo(initialSettings, []);
  const locale = settings.locale;
  const coordinates = settings.location?.coordinates ?? null;
  const timeZoneOverride = settings.location?.timeZone ?? null;
  const errorLogger = useMemo(() => createStructuredErrorLogger(), []);
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [notificationSyncRevision, setNotificationSyncRevision] = useState(0);

  useEffect(() => {
    applyDocumentLocale(document.documentElement, locale);
  }, [locale]);

  useEffect(() => {
    return installThemePreference(settings.theme, {
      documentTarget: document,
      windowTarget: window,
    });
  }, [settings.theme]);

  useEffect(() => {
    let clockChangeDetector: ReturnType<typeof createSystemClockChangeDetector> | null = null;
    let sleepWakeDetector: ReturnType<typeof createSystemSleepWakeDetector> | null = null;
    let invalidSystemTimeActive = false;

    const sampleNow = () => {
      const wallTimeMs = Date.now();
      const monotonicTimeMs = performance.now();
      const instant = systemTimeFromMilliseconds(wallTimeMs);
      if (instant === null || !Number.isFinite(monotonicTimeMs)) return null;
      return { wallTimeMs, monotonicTimeMs, instant };
    };

    const invalidateRuntimeClock = () => {
      if (!invalidSystemTimeActive) {
        errorLogger.log('invalid-system-time');
        invalidSystemTimeActive = true;
      }
      clockChangeDetector = null;
      sleepWakeDetector = null;
      setNow(null);
    };

    const resetFromSample = (sample: NonNullable<ReturnType<typeof sampleNow>>) => {
      invalidSystemTimeActive = false;
      if (clockChangeDetector === null) {
        clockChangeDetector = createSystemClockChangeDetector(sample);
      } else {
        clockChangeDetector.reset(sample);
      }
      if (sleepWakeDetector === null) {
        sleepWakeDetector = createSystemSleepWakeDetector({ wallTimeMs: sample.wallTimeMs });
      } else {
        sleepWakeDetector.reset({ wallTimeMs: sample.wallTimeMs });
      }
      setNow(sample.instant);
    };

    const refreshNow = () => {
      const sample = sampleNow();
      if (sample === null) {
        invalidateRuntimeClock();
        return;
      }
      resetFromSample(sample);
    };

    const tick = () => {
      const sample = sampleNow();
      if (sample === null) {
        invalidateRuntimeClock();
        return;
      }
      if (clockChangeDetector === null || sleepWakeDetector === null) {
        resetFromSample(sample);
        return;
      }
      const resumedFromSleep = sleepWakeDetector.sample({ wallTimeMs: sample.wallTimeMs });
      if (resumedFromSleep) {
        clockChangeDetector.reset(sample);
      } else {
        clockChangeDetector.sample(sample);
      }
      setNow(sample.instant);
    };

    refreshNow();
    const timer = window.setInterval(tick, 1_000);
    const refreshRuntimeAndNotifications = () => {
      refreshNow();
      setNotificationSyncRevision((current) => current + 1);
    };
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshRuntimeAndNotifications,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, [errorLogger]);

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

  useEffect(() => {
    const resynchronize = () => {
      setNotificationSyncRevision((current) => current + 1);
    };
    window.addEventListener(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT, resynchronize);
    return () => {
      window.removeEventListener(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT, resynchronize);
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
  const sourcedDashboard = useMemo(
    () =>
      dashboard === null
        ? null
        : applyPrayerSourceToDashboard({
            dashboard,
            sourceMode: settings.prayerSourceMode,
            mosqueTimetable: settings.mosqueTimetable,
          }),
    [dashboard, settings.mosqueTimetable, settings.prayerSourceMode],
  );

  useEffect(() => {
    if (calculationUnavailable) {
      errorLogger.log('prayer-calculation-unavailable');
    }
  }, [calculationUnavailable, errorLogger]);

  useEffect(() => {
    if (dashboard === null) return;
    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: settings.prayerSourceMode,
      mosqueTimetable: settings.mosqueTimetable,
    });
    const intents = buildNotificationIntents(inputs, settings.notifications);
    const resolutions = resolveNotificationScheduleInstants(intents, dashboard.timeZone);
    void synchronizeAndroidPrayerNotifications(resolutions, locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
    void synchronizeIosPrayerNotifications(resolutions, locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
  }, [
    dashboard?.today.date,
    dashboard?.tomorrow.date,
    dashboard?.timeZone,
    coordinates?.latitude,
    coordinates?.longitude,
    errorLogger,
    locale,
    notificationSyncRevision,
    settings.mosqueTimetable,
    settings.notifications,
    settings.prayerSourceMode,
  ]);

  useEffect(() => {
    const handleDisplayExitKey = (event: KeyboardEvent) => {
      const target = smartDisplayExitPath(window.location.href, event.key);
      if (target === null) return;
      event.preventDefault();
      window.location.assign(target);
    };
    window.addEventListener('keydown', handleDisplayExitKey);
    return () => {
      window.removeEventListener('keydown', handleDisplayExitKey);
    };
  }, []);

  const currentClock =
    now === null
      ? '—'
      : dashboard === null
        ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: settings.timeFormat,
          }).format(now)
        : formatZonedInstantTime(now, dashboard.timeZone, locale, settings.timeFormat);

  return (
    <SmartDisplay
      locale={locale}
      currentClock={currentClock}
      dashboard={sourcedDashboard}
      timeFormat={settings.timeFormat}
      hijriCorrectionDays={settings.hijriCorrectionDays}
      offline={!online}
      systemTimeUnavailable={now === null}
      calculationUnavailable={calculationUnavailable}
    />
  );
}
