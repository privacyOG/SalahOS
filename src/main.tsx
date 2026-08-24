import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SmartDisplayApplication } from './ui/SmartDisplayApplication';
import {
  flushApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { AdminDisplayThemeManagement } from './ui/AdminDisplayThemeManagement';
import { AdminOverviewDashboard } from './ui/AdminOverviewDashboard';
import { AdminShell } from './ui/AdminShell';
import { AustralianMosqueDirectoryPanel } from './ui/AustralianMosqueDirectoryPanel';
import { CommunityScreen } from './ui/CommunityScreen';
import { CommunityUpdatesPanel } from './ui/CommunityUpdatesPanel';
import { CongregationShell } from './ui/CongregationShell';
import { ManagedDisplayConnectionSettings } from './ui/ManagedDisplayConnectionSettings';
import { ManagedDisplayRemoteController } from './ui/ManagedDisplayRemoteController';
import { MobilePrayerThemeSurface } from './ui/MobilePrayerThemeSurface';
import { MosquesScreen } from './ui/MosquesScreen';
import { PrayerBoardAnnouncementSettings } from './ui/PrayerBoardAnnouncementSettings';
import { PrayerBoardWeatherSettings } from './ui/PrayerBoardWeatherSettings';
import { QiblaFinder } from './ui/QiblaFinder';
import { QiblaPermissionOnboarding } from './ui/QiblaPermissionOnboarding';
import { RamadanModePanel } from './ui/RamadanModePanel';
import { SettingsScreen } from './ui/SettingsScreen';
import { smartDisplayModeRequested } from './ui/SmartDisplay';
import { TaraweehPanel } from './ui/TaraweehPanel';
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
import './admin-display-theme-management.css';
import './today-screen.css';
import './settings-screen.css';
import './responsive-hardening.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './smart-display-themes.css';
import './device-ux-refinement.css';
import './family-classroom-4k.css';
import './managed-display-remote.css';
import './remote-display-admin.css';
import './managed-display-assignment.css';
import './ramadan-mode.css';
import './taraweeh-panel.css';
import './qibla-compass.css';
import './qibla-compass-premium.css';
import './qiblah-v2.css';
import './qibla-permission-onboarding.css';
import './mosques-community-v2.css';
import './accessibility-rtl-refinement.css';

function CongregationRoute({ destination }: Readonly<{ destination: CongregationDestination }>) {
  switch (destination) {
    case 'mosques':
      return (
        <div className="congregation-route congregation-route--mosques">
          <MosquesScreen />
          <AustralianMosqueDirectoryPanel />
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
    <>
      <QiblaPermissionOnboarding />
      <CongregationShell>
        {(destination) => <CongregationRoute destination={destination} />}
      </CongregationShell>
    </>
  );
}

type AdminSectionLandingProps = Readonly<{
  title: string;
  description: string;
  note: string;
}>;

function AdminSectionLanding({ title, description, note }: AdminSectionLandingProps) {
  return (
    <section className="admin-section-landing">
      <p className="admin-overview__eyebrow">SalahOS</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <aside>{note}</aside>
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
    case 'prayer-iqamah':
      return (
        <AdminSectionLanding
          title="Prayer & Iqamah"
          description="The administration workspace keeps mosque publishing separate from personal prayer settings."
          note="The existing managed prayer-publication domain remains authoritative for draft, publication and rollback provenance. The Stage 24 overview reports that state without changing local prayer calculations."
        />
      );
    case 'jumuah-ramadan':
      return (
        <div className="admin-section-stack">
          <AdminSectionLanding
            title="Jumu'ah & Ramadan"
            description="Seasonal and Friday context has its own administration destination instead of increasing daily prayer-setting density."
            note="Current Ramadan and Taraweeh tools remain local-first while the managed publication workflow is progressively migrated into this surface."
          />
          <RamadanModePanel />
          <TaraweehPanel />
        </div>
      );
    case 'community':
      return (
        <div className="admin-section-stack">
          <AdminSectionLanding
            title="Community content"
            description="Prepare announcements and events away from the congregation reading experience."
            note="Published content continues to use the existing validated local community-content library and display-surface rules."
          />
          <CommunityUpdatesPanel />
        </div>
      );
    case 'displays':
      return (
        <div className="admin-section-stack admin-section-stack--displays">
          <AdminDisplayThemeManagement />
          <ManagedDisplayConnectionSettings />
          <PrayerBoardWeatherSettings />
          <PrayerBoardAnnouncementSettings />
          <ManagedDisplayRemoteController />
        </div>
      );
    case 'integrations':
      return (
        <AdminSectionLanding
          title="Integrations"
          description="Optional external connections are isolated from prayer calculation and normal congregation use."
          note="Home Assistant, calendar and managed-service integrations retain their existing privacy and network gates while their administration controls are consolidated here."
        />
      );
    case 'members':
      return (
        <AdminSectionLanding
          title="Members & permissions"
          description="Administrative responsibility belongs in a dedicated access-management destination."
          note="Authentication and role enforcement remain separate from the local-first prayer engine; no account is required for core congregation prayer functionality."
        />
      );
    case 'settings':
      return (
        <AdminSectionLanding
          title="Administration settings"
          description="Administration-specific defaults are kept separate from personal SalahOS preferences."
          note="Display credentials, fleet controls and publication tools remain inside the administration surface and are not mounted in congregation pages."
        />
      );
    case 'overview':
    default:
      return <AdminOverviewDashboard navigate={navigate} />;
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
        <SmartDisplayApplication />
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
