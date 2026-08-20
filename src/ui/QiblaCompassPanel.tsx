import { useEffect, useRef, useState } from 'react';

import { calculateQiblaBearing } from '../domain/qibla';
import { signedTurnToQibla } from '../domain/qiblaGuidance';
import type { Locale } from '../i18n/translations';
import { qiblaCompassCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  installCompassHeadingListener,
  requestCompassPermission,
  type CompassHeadingSample,
  type CompassPermissionState,
} from '../platform/deviceCompass';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = qiblaCompassCopy;

function readPanelState() {
  const settings = loadPersistedSettings(getApplicationStorage());
  return {
    locale: settings.locale,
    coordinates: settings.location?.coordinates ?? null,
  };
}

export function QiblaCompassPanel() {
  const [panelState, setPanelState] = useState(readPanelState);
  const [heading, setHeading] = useState<CompassHeadingSample | null>(null);
  const [permission, setPermission] = useState<CompassPermissionState | null>(null);
  const [compassActive, setCompassActive] = useState(false);
  const removeListenerRef = useRef<(() => void) | null>(null);
  const locale: Locale = panelState.locale;
  const text = copy[locale];
  const coordinates = panelState.coordinates;
  const qibla = coordinates === null ? null : calculateQiblaBearing(coordinates);
  const turn = getTurn(qibla?.degreesFromTrueNorth, heading?.headingDegrees);

  useEffect(() => {
    const refresh = () => {
      setPanelState(readPanelState());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      removeListenerRef.current?.();
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) {
    return null;
  }

  const stopCompass = () => {
    removeListenerRef.current?.();
    removeListenerRef.current = null;
    setCompassActive(false);
    setHeading(null);
  };

  const startCompass = async () => {
    stopCompass();
    const state = await requestCompassPermission();
    setPermission(state);

    if (state === 'denied' || state === 'unsupported') {
      return;
    }

    removeListenerRef.current = installCompassHeadingListener(window, setHeading);
    setCompassActive(true);
  };

  const refreshPanel = () => {
    setPanelState(readPanelState());
  };
  const toggleCompass = () => {
    if (compassActive) {
      stopCompass();
      return;
    }
    void startCompass();
  };

  return (
    <section
      className="qibla-panel"
      aria-labelledby="qibla-panel-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="qibla-panel-heading">
        <h2 id="qibla-panel-title">{text.title}</h2>
        <p>{text.privacy}</p>
      </div>

      {qibla === null ? (
        <p className="inline-message">{text.noLocation}</p>
      ) : (
        <>
          <div className="qibla-bearing" dir="ltr">
            <span>{text.bearing}</span>
            <strong>{formatDegrees(qibla.degreesFromTrueNorth)}</strong>
          </div>

          <div className="qibla-actions">
            <button type="button" onClick={refreshPanel}>
              {text.refresh}
            </button>
            <button type="button" onClick={toggleCompass}>
              {compassActive ? text.stop : text.start}
            </button>
          </div>

          {permission === 'unsupported' && <p className="inline-message">{text.unsupported}</p>}
          {permission === 'denied' && <p className="inline-message">{text.denied}</p>}
          {compassActive && heading === null && <p className="inline-message">{text.waiting}</p>}

          {heading !== null && turn !== null && (
            <div className="qibla-live-guidance" role="status">
              <span dir="ltr">
                {text.heading}: {formatDegrees(heading.headingDegrees)}
              </span>
              <strong>{formatTurn(turn, text)}</strong>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function formatDegrees(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

function getTurn(
  qiblaDegrees: number | undefined,
  headingDegrees: number | undefined,
): number | null {
  if (qiblaDegrees === undefined || headingDegrees === undefined) {
    return null;
  }
  return signedTurnToQibla(qiblaDegrees, headingDegrees);
}

function formatTurn(turn: number, text: (typeof copy)[Locale]): string {
  if (Math.abs(turn) <= 5) {
    return text.aligned;
  }

  const direction = turn > 0 ? text.clockwise : text.counterclockwise;
  return `${direction} ${formatDegrees(Math.abs(turn))}`;
}
