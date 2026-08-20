import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { managedDisplayRuntimeCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadManagedDisplayConnection,
  MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT,
} from '../platform/managedDisplayConnectionStorage';
import { createManagedDisplayClient } from '../platform/managedAdminTransport';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const APP_VERSION = '1.1.0';
const SYNC_INTERVAL_MS = 60_000;

const copy = managedDisplayRuntimeCopy;

type RemoteRuntimeState = 'connected' | 'syncing' | 'offline' | 'revoked';

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function readConnection() {
  try {
    return loadManagedDisplayConnection(getApplicationStorage());
  } catch {
    return null;
  }
}

function applyManagedTheme(theme: string): void {
  document.documentElement.dataset.managedDisplayTheme = theme;
}

function clearManagedTheme(): void {
  delete document.documentElement.dataset.managedDisplayTheme;
}

export function ManagedDisplayRemoteController() {
  const [connection, setConnection] = useState(readConnection);
  const [runtimeState, setRuntimeState] = useState<RemoteRuntimeState>('syncing');
  const locale = readLocale();
  const enabled = smartDisplayModeRequested(window.location.search) && connection !== null;

  useEffect(() => {
    const refreshConnection = () => {
      setConnection(readConnection());
    };
    window.addEventListener(MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT, refreshConnection);
    return () => {
      window.removeEventListener(MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT, refreshConnection);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearManagedTheme();
      return;
    }

    const client = createManagedDisplayClient(connection);

    const synchronize = async () => {
      setRuntimeState('syncing');
      try {
        const config = await client.getConfig();
        if (config.revoked) {
          setRuntimeState('revoked');
          return;
        }
        applyManagedTheme(config.displayTheme);
        await client.heartbeat({
          appVersion: APP_VERSION,
          contentRevision: config.contentRevision,
          seenAt: new Date().toISOString(),
        });
        setRuntimeState('connected');
      } catch {
        setRuntimeState('offline');
      }
    };

    void synchronize();
    const timer = window.setInterval(() => {
      void synchronize();
    }, SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [connection, enabled]);

  useEffect(() => {
    return () => {
      clearManagedTheme();
    };
  }, []);

  if (!enabled) return null;

  return (
    <aside
      className="managed-display-remote-status"
      data-state={runtimeState}
      role="status"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {copy[locale][runtimeState]}
    </aside>
  );
}
