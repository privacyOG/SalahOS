import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import {
  flushApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { AdminShell } from './ui/AdminShell';
import { CommunityUpdatesPanel } from './ui/CommunityUpdatesPanel';
import { CongregationShell } from './ui/CongregationShell';
import { ManagedDisplayConnectionSettings } from './ui/ManagedDisplayConnectionSettings';
import { ManagedDisplayRemoteController } from './ui/ManagedDisplayRemoteController';
import { MosqueProfilesPanel } from './ui/MosqueProfilesPanel';
import { QiblaFinder } from './ui/QiblaFinder';
import { RamadanModePanel } from './ui/RamadanModePanel';
import { RemoteDisplayAdminPanel } from './ui/RemoteDisplayAdminPanel';
import { smartDisplayModeRequested } from './ui/SmartDisplay';
import { SmartDisplayThemeSettings } from './ui/SmartDisplayThemeSettings';
import { TaraweehPanel } from './ui/TaraweehPanel';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import {
  readProductSurface,
  searchForAdminDestination,
  type AdminDestination,
  type CongregationDestination,
} from './ui/applicationRoute';
import './styles.css';
import './design-system.css';
import './prayer-first-home.css';
import './congregation-shell.css';
import './admin-shell.css';
import './responsive-hardening.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './smart-display-themes.css';
import './managed-display-remote.css';
import './remote-display-admin.css';
import './ramadan-mode.css';
import './taraweeh-panel.css';
import './community-updates-panel.css';
import './mosque-profiles-panel.css';
import './qibla-compass.css';

function administrationHref(): string {
  const search = searchForAdminDestination(window.location.search, 'overview');
  return `${window.location.pathname}${search}${window.location.hash}`;
}

function CongregationRoute({ destination }: Readonly<{ destination: CongregationDestination }>) {
  switch (destination) {
    case 'mosques':
      return (
        <div className="congregation-route congregation-route--mosques">
          <MosqueProfilesPanel />
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
          <CommunityUpdatesPanel />
        </div>
      );
    case 'settings':
      return (
        <div className="congregation-route congregation-route--settings">
          <div className="legacy-core-route legacy-core-route--settings">
            <App />
          </div>
          <RamadanModePanel />
          <TaraweehPanel />
          <section className="surface-entry-card" aria-labelledby="managed-admin-entry-title">
            <p className="surface-entry-card__eyebrow">SalahOS</p>
            <h2 id="managed-admin-entry-title">Managed mosque administration</h2>
            <p>
              Display credentials, themes and remote-management controls are kept outside the
              everyday prayer interface.
            </p>
            <a className="surface-entry-card__action" href={administrationHref()}>
              Open administration
            </a>
          </section>
        </div>
      );
    case 'today':
    default:
      return (
        <div className="congregation-route congregation-route--today">
          <div className="legacy-core-route legacy-core-route--today">
            <App />
          </div>
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
        <button type="button" onClick={() => navigate('displays')}>
          Display connections
        </button>
        <button type="button" onClick={() => navigate('themes')}>
          Display themes
        </button>
        <button type="button" onClick={() => navigate('remote')}>
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
      return <SmartDisplayThemeSettings />;
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
    return <App />;
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
