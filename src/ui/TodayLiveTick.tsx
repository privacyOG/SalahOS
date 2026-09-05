import { useEffect, useMemo, useRef, useState } from 'react';

import { formatCountdown } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import type { PersistedSettings } from '../platform/settingsStorage';
import { readSystemTime } from '../platform/systemTime';
import {
  countdownTargetEpochMilliseconds,
  remainingCountdownSeconds,
  TODAY_CLOCK_HIDDEN_MEDIA_QUERY,
  todayCountdownTickMilliseconds,
} from './todayLiveTickModel';

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

function viewportClockHidden(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(TODAY_CLOCK_HIDDEN_MEDIA_QUERY).matches
    : false;
}

function useClockHidden(): boolean {
  const [hidden, setHidden] = useState(viewportClockHidden);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;

    const media = window.matchMedia(TODAY_CLOCK_HIDDEN_MEDIA_QUERY);
    const update = () => {
      setHidden(media.matches);
    };
    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  return hidden;
}

export interface TodayAppBarClockProps {
  readonly locale: Locale;
  readonly timeFormat: PersistedSettings['timeFormat'];
  readonly timeZone: string | null;
  readonly ariaLabel: string;
}

export function TodayAppBarClock({
  locale,
  timeFormat,
  timeZone,
  ariaLabel,
}: TodayAppBarClockProps) {
  const clockHidden = useClockHidden();
  const [now, setNow] = useState<Date | null>(() => readSystemTime());

  useEffect(() => {
    if (clockHidden) return undefined;

    const refreshNow = () => {
      setNow(readSystemTime());
    };
    refreshNow();
    const timer = window.setInterval(refreshNow, 1_000);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, [clockHidden]);

  const clock = useMemo(() => {
    if (now === null) return '—';
    return new Intl.DateTimeFormat(localeClockTag(locale), {
      ...(timeZone === null ? {} : { timeZone }),
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: timeFormat,
    }).format(now);
  }, [locale, now, timeFormat, timeZone]);

  return (
    <span
      className="today-appbar__clock"
      aria-label={ariaLabel}
      data-today-clock-tick={clockHidden ? 'paused-hidden' : '1s'}
    >
      {clock}
    </span>
  );
}

export interface TodayCountdownProps {
  readonly generatedAt: Date;
  readonly secondsUntilNextPrayer: number | null;
  readonly locale: Locale;
  readonly onElapsed: () => void;
}

export function TodayCountdown({
  generatedAt,
  secondsUntilNextPrayer,
  locale,
  onElapsed,
}: TodayCountdownProps) {
  const clockHidden = useClockHidden();
  const targetEpochMilliseconds = useMemo(
    () => countdownTargetEpochMilliseconds(generatedAt, secondsUntilNextPrayer),
    [generatedAt, secondsUntilNextPrayer],
  );
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const remainingSeconds =
    now === null ? null : remainingCountdownSeconds(targetEpochMilliseconds, now);
  const tickMilliseconds = todayCountdownTickMilliseconds(remainingSeconds, clockHidden);
  const elapsedTarget = useRef<number | null>(null);

  useEffect(() => {
    if (targetEpochMilliseconds === null || tickMilliseconds === null) return undefined;

    const refreshNow = () => {
      setNow(readSystemTime());
    };
    const timer = window.setInterval(refreshNow, tickMilliseconds);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, [targetEpochMilliseconds, tickMilliseconds]);

  useEffect(() => {
    if (
      targetEpochMilliseconds !== null &&
      remainingSeconds === 0 &&
      elapsedTarget.current !== targetEpochMilliseconds
    ) {
      elapsedTarget.current = targetEpochMilliseconds;
      onElapsed();
    }
  }, [onElapsed, remainingSeconds, targetEpochMilliseconds]);

  return (
    <strong data-today-countdown-tick-ms={tickMilliseconds ?? 'idle'}>
      {remainingSeconds === null ? '—' : formatCountdown(remainingSeconds, locale)}
    </strong>
  );
}
