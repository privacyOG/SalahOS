import { useEffect, useMemo, useRef, useState } from 'react';

import { calculateQiblaBearing } from '../domain/qibla';
import { signedTurnToQibla } from '../domain/qiblaGuidance';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  installCompassHeadingListener,
  requestCompassPermission,
  type CompassHeadingSample,
  type CompassPermissionState,
} from '../platform/deviceCompass';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from '../platform/smartDisplayNavigation';

const copy = {
  en: {
    title: 'Qibla direction',
    noLocation: 'Set a location above to calculate the Qibla direction.',
    bearing: 'Bearing from true north',
    refresh: 'Refresh from selected location',
    start: 'Use device compass',
    stop: 'Stop compass',
    unsupported: 'A north-referenced device compass is not available here. Use the bearing shown above.',
    denied: 'Compass permission was not granted. Use the bearing shown above.',
    waiting: 'Move the device gently while waiting for a reliable north-referenced heading.',
    heading: 'Device heading',
    aligned: 'Aligned with Qibla',
    clockwise: 'Turn clockwise',
    counterclockwise: 'Turn counter-clockwise',
    degrees: '°',
    privacy: 'Bearing and compass processing stay on this device.',
  },
  ar: {
    title: 'اتجاه القبلة',
    noLocation: 'حدّد موقعاً أعلاه لحساب اتجاه القبلة.',
    bearing: 'الاتجاه من الشمال الحقيقي',
    refresh: 'تحديث من الموقع المحدد',
    start: 'استخدام بوصلة الجهاز',
    stop: 'إيقاف البوصلة',
    unsupported: 'لا تتوفر هنا بوصلة جهاز مرتبطة بالشمال. استخدم زاوية الاتجاه الظاهرة أعلاه.',
    denied: 'لم يتم منح إذن البوصلة. استخدم زاوية الاتجاه الظاهرة أعلاه.',
    waiting: 'حرّك الجهاز برفق أثناء انتظار قراءة موثوقة مرتبطة بالشمال.',
    heading: 'اتجاه الجهاز',
    aligned: 'محاذٍ للقبلة',
    clockwise: 'استدر مع عقارب الساعة',
    counterclockwise: 'استدر عكس عقارب الساعة',
    degrees: '°',
    privacy: 'يتم حساب القبلة والبوصلة محلياً على هذا الجهاز.',
  },
} as const;

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

  const qibla = useMemo(
    () =>
      panelState.coordinates === null ? null : calculateQiblaBearing(panelState.coordinates),
    [panelState.coordinates],
  );

  const turn =
    qibla === null || heading === null
      ? null
      : signedTurnToQibla(qibla.degreesFromTrueNorth, heading.headingDegrees);

  useEffect(() => {
    const refresh = () => {
      setPanelState(readPanelState());
    };
    const visibleRefresh = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
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

  return (
    <section className="qibla-panel" aria-labelledby="qibla-panel-title" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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
            <strong>{qibla.degreesFromTrueNorth.toFixed(1)}{text.degrees}</strong>
          </div>
          <div className="qibla-actions">
            <button type="button" onClick={() => setPanelState(readPanelState())}>{text.refresh}</button>
            <button
              type="button"
              onClick={() => {
                if (compassActive) {
                  stopCompass();
                } else {
                  void startCompass();
                }
              }}
            >
              {compassActive ? text.stop : text.start}
            </button>
          </div>

          {permission === 'unsupported' && <p className="inline-message">{text.unsupported}</p>}
          {permission === 'denied' && <p className="inline-message">{text.denied}</p>}
          {compassActive && heading === null && <p className="inline-message">{text.waiting}</p>}

          {heading !== null && turn !== null && (
            <div className="qibla-live-guidance" role="status">
              <span dir="ltr">{text.heading}: {heading.headingDegrees.toFixed(1)}{text.degrees}</span>
              <strong>
                {Math.abs(turn) <= 5
                  ? text.aligned
                  : `${turn > 0 ? text.clockwise : text.counterclockwise} ${Math.abs(turn).toFixed(1)}${text.degrees}`}
              </strong>
            </div>
          )}
        </>
      )}
    </section>
  );
}
