import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  clearManagedDisplayConnection,
  loadManagedDisplayConnection,
  MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT,
  saveManagedDisplayConnection,
} from '../platform/managedDisplayConnectionStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = {
  en: {
    title: 'Managed display connection',
    subtitle:
      'Provision this device once with the managed-service endpoint, display ID and one-time device credential.',
    endpoint: 'Managed service URL',
    displayId: 'Display ID',
    credential: 'Device credential',
    save: 'Save managed connection',
    clear: 'Clear managed connection',
    saved: 'Managed display connection saved locally.',
    cleared: 'Managed display connection removed.',
    invalid: 'The managed display connection is invalid and was not saved.',
    security:
      'The device credential is a revocable secret stored only in SalahOS application storage on this device. Do not share it or place it in a URL.',
  },
  ar: {
    title: 'اتصال شاشة العرض المُدارة',
    subtitle: 'جهّز هذا الجهاز مرة واحدة برابط خدمة الإدارة ومعرّف الشاشة وبيانات اعتماد الجهاز.',
    endpoint: 'رابط خدمة الإدارة',
    displayId: 'معرّف الشاشة',
    credential: 'بيانات اعتماد الجهاز',
    save: 'حفظ اتصال الشاشة',
    clear: 'حذف اتصال الشاشة',
    saved: 'تم حفظ اتصال الشاشة المُدارة محلياً.',
    cleared: 'تم حذف اتصال الشاشة المُدارة.',
    invalid: 'اتصال الشاشة غير صالح ولم يتم حفظه.',
    security:
      'بيانات اعتماد الجهاز سر قابل للإلغاء وتحفظ فقط في تخزين التطبيق على هذا الجهاز. لا تشاركها ولا تضعها في رابط.',
  },
} as const;

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

export function ManagedDisplayConnectionSettings() {
  const locale = readLocale();
  const text = copy[locale];
  const initial = (() => {
    try {
      return loadManagedDisplayConnection(getApplicationStorage());
    } catch {
      return null;
    }
  })();
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '');
  const [displayId, setDisplayId] = useState(initial?.displayId ?? '');
  const [deviceToken, setDeviceToken] = useState(initial?.deviceToken ?? '');
  const [message, setMessage] = useState<'saved' | 'cleared' | 'invalid' | null>(null);

  useEffect(() => {
    const refresh = () => {
      try {
        const connection = loadManagedDisplayConnection(getApplicationStorage());
        setBaseUrl(connection?.baseUrl ?? '');
        setDisplayId(connection?.displayId ?? '');
        setDeviceToken(connection?.deviceToken ?? '');
      } catch {
        setBaseUrl('');
        setDisplayId('');
        setDeviceToken('');
      }
    };
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) return null;

  const notifyChange = () => {
    window.dispatchEvent(new Event(MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT));
  };

  const save = () => {
    try {
      saveManagedDisplayConnection(getApplicationStorage(), { baseUrl, displayId, deviceToken });
      setMessage('saved');
      notifyChange();
    } catch {
      setMessage('invalid');
    }
  };

  const clear = () => {
    clearManagedDisplayConnection(getApplicationStorage());
    setBaseUrl('');
    setDisplayId('');
    setDeviceToken('');
    setMessage('cleared');
    notifyChange();
  };

  return (
    <section
      className="managed-display-connection-settings"
      aria-labelledby="managed-display-connection-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header>
        <h2 id="managed-display-connection-title">{text.title}</h2>
        <p>{text.subtitle}</p>
      </header>
      <p className="managed-display-connection-settings__security">{text.security}</p>
      <div className="managed-display-connection-settings__grid">
        <label>
          <span>{text.endpoint}</span>
          <input
            type="url"
            value={baseUrl}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setBaseUrl(event.target.value);
            }}
          />
        </label>
        <label>
          <span>{text.displayId}</span>
          <input
            value={displayId}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setDisplayId(event.target.value);
            }}
          />
        </label>
        <label>
          <span>{text.credential}</span>
          <input
            type="password"
            value={deviceToken}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setDeviceToken(event.target.value);
            }}
          />
        </label>
      </div>
      <div className="managed-display-connection-settings__actions">
        <button type="button" onClick={save}>
          {text.save}
        </button>
        <button type="button" onClick={clear}>
          {text.clear}
        </button>
      </div>
      {message !== null && (
        <p className="managed-display-connection-settings__message" role="status">
          {text[message]}
        </p>
      )}
    </section>
  );
}
