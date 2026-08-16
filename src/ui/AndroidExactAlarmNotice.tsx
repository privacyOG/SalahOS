import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../i18n/translations';
import {
  openAndroidExactAlarmSettings,
  readAndroidExactAlarmCapability,
  type AndroidExactAlarmCapability,
} from '../platform/androidNotificationScheduler';

export const ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT = 'salahos-exact-alarm-capability-change';

const copy: Readonly<
  Record<
    Locale,
    {
      readonly message: string;
      readonly action: string;
    }
  >
> = {
  en: {
    message:
      'Android precise alarm access is off. Prayer notifications remain scheduled, but Android may deliver them later than the requested time.',
    action: 'Allow precise prayer alarms',
  },
  ar: {
    message:
      'إذن المنبّهات الدقيقة في أندرويد غير مفعّل. ستبقى تنبيهات الصلاة مجدولة، لكن قد يؤخر أندرويد وصولها عن الوقت المطلوب.',
    action: 'السماح بمنبّهات الصلاة الدقيقة',
  },
};

export interface AndroidExactAlarmNoticeProps {
  readonly locale: Locale;
}

export function AndroidExactAlarmNotice({ locale }: AndroidExactAlarmNoticeProps) {
  const [capability, setCapability] = useState<AndroidExactAlarmCapability | null>(null);
  const previousCapability = useRef<AndroidExactAlarmCapability | null>(null);

  const applyCapability = (next: AndroidExactAlarmCapability) => {
    const previous = previousCapability.current;
    previousCapability.current = next;
    setCapability(next);
    if (previous !== null && previous !== next) {
      window.dispatchEvent(new Event(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT));
    }
  };

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const next = await readAndroidExactAlarmCapability();
        if (active) applyCapability(next);
      } catch {
        if (active) applyCapability('unsupported');
      }
    };
    const handleFocus = () => {
      void refresh();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    void refresh();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (capability !== 'inexact') return null;

  const openSettings = async () => {
    try {
      applyCapability(await openAndroidExactAlarmSettings());
    } catch {
      // Keep the honest inexact-delivery notice visible when settings cannot be opened.
    }
  };

  return (
    <div className="inline-message" role="status">
      <p>{copy[locale].message}</p>
      <button type="button" onClick={() => void openSettings()}>
        {copy[locale].action}
      </button>
    </div>
  );
}
