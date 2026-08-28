import { lazy, StrictMode, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  flushApplicationStorage,
  getApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { installAutomaticLocationSync } from './platform/automaticLocationSync';
import { LOCATION_CONTEXT_CHANGE_EVENT } from './platform/bestAvailableLocation';
import { installPrivacyDiagnostics } from './platform/privacyDiagnostics';
import { loadPersistedSettings } from './platform/settingsStorage';
import { installThemePreference } from './platform/themePreference';
import { applyThemePalette } from './platform/themePalette';
import { CongregationShell } from './ui/CongregationShell';
import { MobilePrayerThemeSurface } from './ui/MobilePrayerThemeSurface';
import { QiblaPermissionOnboarding } from './ui/QiblaPermissionOnboarding';
import { TodayScreen } from './ui/TodayScreen';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import { readProductSurface, type CongregationDestination } from './ui/applicationRoute';
import { smartDisplayModeRequested } from './ui/smartDisplayRouting';

import './styles.css';
import './design-system.css';
import './design-system-primitives.css';
import './theme-palettes.css';
import './congregation-shell.css';
import './admin-shell.css';
import './admin-display-theme-management.css';
import './today-screen.css';
import './prayer-calendar.css';
import './settings-screen.css';
import './responsive-hardening.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './smart-display-themes.css';
import './mosque-display-theme.css';
import './device-ux-refinement.css';
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
import './shared-mosque-directory.css';
import './islamic-knowledge.css';
import './quran-offline-reader.css';
import './accessibility-rtl-refinement.css';
import './theme-contrast-guard.css';

const AdministrationApplication = lazy(async () => ({
  default: (await import('./ui/AdministrationApplication')).AdministrationApplication,
}));
const SmartDisplayRoot = lazy(async () => ({
  default: (await import('./ui/SmartDisplayRoot')).SmartDisplayRoot,
}));
const PrayerCalendarScreen = lazy(async () => ({
  default: (await import('./ui/PrayerCalendarScreen')).PrayerCalendarScreen,
}));
const MosquesRoute = lazy(async () => ({
  default: (await import('./ui/MosquesRoute')).MosquesRoute,
}));
const QiblaFinder = lazy(async () => ({
  default: (await import('./ui/QiblaFinder')).QiblaFinder,
}));
const KnowledgeExperience = lazy(async () => ({
  default: (await import('./ui/KnowledgeExperience')).KnowledgeExperience,
}));
const CommunityScreen = lazy(async () => ({
  default: (await import('./ui/CommunityScreen')).CommunityScreen,
}));
const SettingsScreen = lazy(async () => ({
  default: (await import('./ui/SettingsScreen')).SettingsScreen,
}));

function LoadingSurface() {
  return (
    <div className="surface-entry-card" role="status" aria-live="polite">
      <p className="surface-entry-card__eyebrow">SalahOS</p>
      <p>Loading…</p>
    </div>
  );
}

function CongregationRoute({ destination }: Readonly<{ destination: CongregationDestination }>) {
  switch (destination) {
    case 'calendar':
      return (
        <div className="congregation-route congregation-route--calendar">
          <Suspense fallback={<LoadingSurface />}>
            <PrayerCalendarScreen />
          </Suspense>
        </div>
      );
    case 'mosques':
      return (
        <div className="congregation-route congregation-route--mosques">
          <Suspense fallback={<LoadingSurface />}>
            <MosquesRoute />
          </Suspense>
        </div>
      );
    case 'qiblah':
      return (
        <div className="congregation-route congregation-route--qiblah">
          <Suspense fallback={<LoadingSurface />}>
            <QiblaFinder />
          </Suspense>
        </div>
      );
    case 'knowledge':
      return (
        <div className="congregation-route congregation-route--knowledge">
          <Suspense fallback={<LoadingSurface />}>
            <KnowledgeExperience />
          </Suspense>
        </div>
      );
    case 'community':
      return (
        <div className="congregation-route congregation-route--community">
          <Suspense fallback={<LoadingSurface />}>
            <CommunityScreen />
          </Suspense>
        </div>
      );
    case 'settings':
      return (
        <div className="congregation-route congregation-route--settings">
          <Suspense fallback={<LoadingSurface />}>
            <SettingsScreen />
          </Suspense>
        </div>
      );
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
  const [locationRevision, setLocationRevision] = useState(0);

  useEffect(() => {
    const handleLocationChange = () => setLocationRevision((current) => current + 1);
    window.addEventListener(LOCATION_CONTEXT_CHANGE_EVENT, handleLocationChange);
    const stopAutomaticLocationSync = installAutomaticLocationSync();
    return () => {
      stopAutomaticLocationSync();
      window.removeEventListener(LOCATION_CONTEXT_CHANGE_EVENT, handleLocationChange);
    };
  }, []);

  return (
    <>
      <QiblaPermissionOnboarding />
      <CongregationShell key={locationRevision}>
        {(destination) => <CongregationRoute destination={destination} />}
      </CongregationShell>
    </>
  );
}

function RootApplication() {
  const fixture = readTouchDisplayFixtureConfig(window.location.search);
  if (fixture !== null) return <TouchDisplayFixture {...fixture} />;
  if (smartDisplayModeRequested(window.location.search)) {
    return (
      <Suspense fallback={<LoadingSurface />}>
        <SmartDisplayRoot />
      </Suspense>
    );
  }
  if (readProductSurface(window.location.search) === 'admin') {
    return (
      <Suspense fallback={<LoadingSurface />}>
        <AdministrationApplication />
      </Suspense>
    );
  }
  return <CongregationApplication />;
}

async function bootstrap(): Promise<void> {
  const root = document.getElementById('root');
  if (root === null) throw new Error('SalahOS root element is missing');

  await initializeApplicationStorage(window.localStorage);
  installPrivacyDiagnostics(getApplicationStorage());
  const settings = loadPersistedSettings(getApplicationStorage());
  applyThemePalette(settings.palette, document);
  installThemePreference(settings.theme, { documentTarget: document, windowTarget: window });

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    void navigator.serviceWorker.register('/sw.js');
  }

  const flushStorage = () => {
    void flushApplicationStorage();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushStorage();
  });
  window.addEventListener('pagehide', flushStorage);

  createRoot(root).render(
    <StrictMode>
      <RootApplication />
    </StrictMode>,
  );
}

void bootstrap();
