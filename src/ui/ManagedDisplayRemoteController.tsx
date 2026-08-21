import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { managedDisplayRuntimeCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadManagedDisplayConnection,
  MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT,
} from '../platform/managedDisplayConnectionStorage';
import { createManagedDisplayClient } from '../platform/managedAdminTransport';
import {
  loadManagedPrayerBoardCache,
  MANAGED_PRAYER_BOARD_CACHE_CHANGE_EVENT,
  reconcileManagedPrayerBoardRevision,
  saveManagedPrayerBoardCache,
} from '../platform/managedPrayerBoardCache';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const APP_VERSION = '1.2.0';
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

function dispatchManagedPrayerBoardChange(): void {
  window.dispatchEvent(new Event(MANAGED_PRAYER_BOARD_CACHE_CHANGE_EVENT));
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
    if (!smartDisplayModeRequested(window.location.search) || connection === null) return;

    const client = createManagedDisplayClient(connection);

    const synchronize = async () => {
      setRuntimeState('syncing');
      try {
        const config = await client.getConfig();
        if (config.revoked) {
          setRuntimeState('revoked');
          return;
        }

        const storage = getApplicationStorage();
        const cached = loadManagedPrayerBoardCache(storage);
        const local = cached?.displayId === connection.displayId ? cached : null;
        const action = reconcileManagedPrayerBoardRevision(
          local,
          config.contentRevision,
          config.prayerBoardConfig,
        );

        if (action === 'report-conflict') {
          if (local !== null) {
            await client.heartbeat({
              appVersion: APP_VERSION,
              contentRevision: local.contentRevision,
              prayerBoardTemplateId: local.config.templateId,
              seenAt: new Date().toISOString(),
            });
          }
          setRuntimeState('offline');
          return;
        }

        const applied =
          action === 'apply-remote'
            ? saveManagedPrayerBoardCache(storage, {
                displayId: connection.displayId,
                contentRevision: config.contentRevision,
                config: config.prayerBoardConfig,
                cachedAt: new Date().toISOString(),
              })
            : local;

        if (action === 'apply-remote') dispatchManagedPrayerBoardChange();
        if (applied === null) throw new Error('Managed prayer-board cache is unavailable');

        await client.heartbeat({
          appVersion: APP_VERSION,
          contentRevision: applied.contentRevision,
          prayerBoardTemplateId: applied.config.templateId,
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
  }, [connection]);

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
