import { useEffect, useState } from 'react';

import { translate } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import type { PersistedSettings } from '../platform/settingsStorage';
import { readSystemTime } from '../platform/systemTime';
import { TODAY_LIVE_FAST_TICK_MS } from './todayPrayerDashboardScheduler';

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

function formatClock(
  instant: Date,
  locale: Locale,
  hourCycle: PersistedSettings['timeFormat'],
  timeZone: string | null,
): string {
  return new Intl.DateTimeFormat(localeClockTag(locale), {
    ...(timeZone === null ? {} : { timeZone }),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle,
  }).format(instant);
}

export function TodayAppBarClock(props: {
  readonly locale: Locale;
  readonly timeFormat: PersistedSettings['timeFormat'];
  readonly timeZone: string | null;
  readonly visible: boolean;
}) {
  const [now, setNow] = useState<Date | null>(() => readSystemTime());

  useEffect(() => {
    if (!props.visible) return undefined;

    const refreshNow = () => {
      setNow(readSystemTime());
    };
    const timer = window.setInterval(refreshNow, TODAY_LIVE_FAST_TICK_MS);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, [props.visible]);

  if (!props.visible) return null;

  return (
    <span className="today-appbar__clock" aria-label={translate(props.locale, 'currentTime')}>
      {now === null ? '—' : formatClock(now, props.locale, props.timeFormat, props.timeZone)}
    </span>
  );
}
