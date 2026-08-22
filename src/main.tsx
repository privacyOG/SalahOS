import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import {
  flushApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { AdminShell } from './ui/AdminShell';
import { CommunityScreen } from './ui/CommunityScreen';
import { CongregationShell } from './ui/CongregationShell';
import { ManagedDisplayConnectionSettings } from './ui/ManagedDisplayConnectionSettings';
import { ManagedDisplayRemoteController } from './ui/ManagedDisplayRemoteController';
import { MobilePrayerThemeSettings } from './ui/MobilePrayerThemeSettings';
import { MobilePrayerThemeSurface } from './ui/MobilePrayerThemeSurface';
import { MosquesScreen } from './ui/MosquesScreen';
import { QiblaFinder } from './ui/QiblaFinder';
import { RemoteDisplayAdminPanel } from './ui/RemoteDisplayAdminPanel';
import { SettingsScreen } from './ui/SettingsScreen';
import { smartDisplayModeRequested } from './ui/SmartDisplay';
import { SmartDisplayThemeSettings } from './ui/SmartDisplayThemeSettings';
import { TodayScreen } from './ui/TodayScreen';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import {
  readProductSurface,
  type AdminDestination,
  type CongregationDestination,
} from './ui/applicationRoute';
import './styles.css';
import './design-system.css';
import './design-system-primitives.css';
import './congregation-shell.css';
import './admin-shell.css';
import './today-screen.css';
import './settings-screen.css';
import './responsive-hardening.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './smart-display-themes.css';
import './family-classroom-4k.css';
import './managed-display-remote.css';
import './remote-display-admin.css';
import './managed-display-assignment.css';
import './ramadan-mode.css';
import './taraweeh-panel.css';
import './qibla-compass.css';
import './qibla-compass-premium.css';
import './qiblah-v2.css';
import './mosques-community-v2.css';

function CongregationRoute({ destination }: Readonly<{ destination: CongregationDestination }>) {
  switch (destination) {
    case 'mosques':
      return (
        <div className="congregation-route congregation-route--mosques">
          <MosquesScreen />
        </div>
      );
    case 'qiblah':
      return (
        <div className="congregation-route congregation-route--qiblah">
          <QiblaFinder />
        </div>
      );
    case 'community':
      return (
        <div className="congregation-route congregation-route--community">
          <CommunityScreen />
        </div>
      );
    case 'settings':
      return (
        <div className="congregation-route congregation-route--settings">
          <SettingsScreen />
        </div>
      );
    case 'today':
    default:
      return (
        <div className="congregation-route congregation-route--today">
          <MobilePrayerThemeSurface>
            <div className="app-shell today-route-shell">
              <TodayScreen />
            </div>
          </MobilePrayerThemeSurface>
        </div>
      );
  }
}

function CongregationApplication() {
  return (
    <CongregationShell>
      {(destination) => <CongregationRoute destination={destination} />}
    </CongregationShell>
  );
}

function AdminOverview({
  navigate,
}: Readonly<{ navigate: (destination: AdminDestination) => void }>) {
  return (
    <section className="admin-overview" aria-labelledby="admin-overview-title">
      <div>
        <p className="admin-overview__eyebrow">SalahOS</p>
        <h2 id="admin-overview-title">Administration overview</h2>
        <p>
          Managed display operations are isolated here so daily prayer use stays focused and
          uncluttered.
        </p>
      </div>
      <div className="admin-overview__actions">
        <button
          type="button"
          onClick={() => {
            navigate('displays');
          }}
        >
          Display connections
        </button>
        <button
          type="button"
          onClick={() => {
            navigate('themes');
          }}
        >
          Display themes
        </button>
        <button
          type="button"
          onClick={() => {
            navigate('remote');
          }}
        >
          Remote administration
        </button>
      </div>
    </section>
  );
}

function AdministrationRoute({
  destination,
  navigate,
}: Readonly<{
  destination: AdminDestination;
  navigate: (destination: AdminDestination) => void;
}>) {
  switch (destination) {
    case 'displays':
      return <ManagedDisplayConnectionSettings />;
    case 'themes':
      return (
        <>
          <MobilePrayerThemeSettings />
          <SmartDisplayThemeSettings />
        </>
      );
    case 'remote':
      return (
        <>
          <ManagedDisplayRemoteController />
          <RemoteDisplayAdminPanel />
        </>
      );
    case 'overview':
    default:
      return <AdminOverview navigate={navigate} />;
  }
}

function AdministrationApplication() {
  return (
    <AdminShell>
      {(destination, navigate) => (
        <AdministrationRoute destination={destination} navigate={navigate} />
      )}
    </AdminShell>
  );
}

function RootApplication() {
  const touchDisplayFixtureConfig = readTouchDisplayFixtureConfig(window.location.search);

  if (touchDisplayFixtureConfig !== null) {
    return <TouchDisplayFixture {...touchDisplayFixtureConfig} />;
  }

  if (smartDisplayModeRequested(window.location.search)) {
    return (
      <>
        <ManagedDisplayRemoteController />
        <App />
      </>
    );
  }

  if (readProductSurface(window.location.search) === 'admin') {
    return <AdministrationApplication />;
  }

  return <CongregationApplication />;
}

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root');

  if (rootElement === null) {
    throw new Error('SalahOS root element is missing');
  }

  await initializeApplicationStorage(window.localStorage);

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    void navigator.serviceWorker.register('/sw.js');
  }

  const flushStorage = () => {
    void flushApplicationStorage();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushStorage();
    }
  });
  window.addEventListener('pagehide', flushStorage);

  createRoot(rootElement).render(
    <StrictMode>
      <RootApplication />
    </StrictMode>,
  );
}

void bootstrap();
