import { useEffect, useMemo, useState } from 'react';

import { formatCountdown } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import { readSystemTime } from '../platform/systemTime';
import { todayLiveTickIntervalMilliseconds } from './todayPrayerDashboardScheduler';

function remainingSeconds(
  secondsUntilNextPrayer: number | null,
  generatedAtMilliseconds: number,
  now: Date | null,
): number | null {
  if (secondsUntilNextPrayer === null || now === null) return secondsUntilNextPrayer;
  const targetMilliseconds = generatedAtMilliseconds + secondsUntilNextPrayer * 1_000;
  return Math.max(0, Math.round((targetMilliseconds - now.getTime()) / 1_000));
}

export function TodayPrayerCountdown(props: {
  readonly secondsUntilNextPrayer: number | null;
  readonly generatedAt: Date;
  readonly locale: Locale;
  readonly clockVisible: boolean;
}) {
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const generatedAtMilliseconds = props.generatedAt.getTime();
  const secondsRemaining = useMemo(
    () => remainingSeconds(props.secondsUntilNextPrayer, generatedAtMilliseconds, now),
    [generatedAtMilliseconds, now, props.secondsUntilNextPrayer],
  );
  const tickIntervalMilliseconds = todayLiveTickIntervalMilliseconds({
    secondsUntilNextPrayer: secondsRemaining,
    clockVisible: props.clockVisible,
  });

  useEffect(() => {
    const refreshNow = () => {
      setNow(readSystemTime());
    };
    refreshNow();
    const timer = window.setInterval(refreshNow, tickIntervalMilliseconds);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, [generatedAtMilliseconds, props.secondsUntilNextPrayer, tickIntervalMilliseconds]);

  return (
    <strong>
      {secondsRemaining === null ? '—' : formatCountdown(secondsRemaining, props.locale)}
    </strong>
  );
}
