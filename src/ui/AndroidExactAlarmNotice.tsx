import { useEffect, useState } from 'react';
import type { Locale } from '../i18n/translations';
import {
  openAndroidExactAlarmSettings,
  readAndroidExactAlarmCapability,
  type AndroidExactAlarmCapability,
} from '../platform/androidNotificationScheduler';

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
  readonly onCapabilityChange?: (capability: AndroidExactAlarmCapability) => void;
}

export function AndroidExactAlarmNotice({
  locale,
  onCapabilityChange,
}: AndroidExactAlarmNoticeProps) {
  const [capability, setCapability] = useState<AndroidExactAlarmCapability | null>(null);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const next = await readAndroidExactAlarmCapability();
        if (!active) return;
        setCapability(next);
        onCapabilityChange?.(next);
      } catch {
        if (!active) return;
        setCapability('unsupported');
        onCapabilityChange?.('unsupported');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    void refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onCapabilityChange]);

  if (capability !== 'inexact') return null;

  const openSettings = async () => {
    try {
      const next = await openAndroidExactAlarmSettings();
      setCapability(next);
      onCapabilityChange?.(next);
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