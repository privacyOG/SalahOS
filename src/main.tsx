import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import {
  flushApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { CommunityUpdatesPanel } from './ui/CommunityUpdatesPanel';
import { CongregationShell } from './ui/CongregationShell';
import { MosqueProfilesPanel } from './ui/MosqueProfilesPanel';
import { QiblaCompassPanel } from './ui/QiblaCompassPanel';
import { RamadanModePanel } from './ui/RamadanModePanel';
import { SmartDisplayThemeSettings } from './ui/SmartDisplayThemeSettings';
import { TaraweehPanel } from './ui/TaraweehPanel';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import './styles.css';
import './design-system.css';
import './prayer-first-home.css';
import './congregation-shell.css';
import './responsive-hardening.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './smart-display-themes.css';
import './ramadan-mode.css';
import './taraweeh-panel.css';
import './community-updates-panel.css';
import './mosque-profiles-panel.css';
import './qibla-compass.css';

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

  const touchDisplayFixtureConfig = readTouchDisplayFixtureConfig(window.location.search);

  createRoot(rootElement).render(
    <StrictMode>
      {touchDisplayFixtureConfig === null ? (
        <CongregationShell>
          <App />
          <SmartDisplayThemeSettings />
          <MosqueProfilesPanel />
          <RamadanModePanel />
          <TaraweehPanel />
          <CommunityUpdatesPanel />
          <QiblaCompassPanel />
        </CongregationShell>
      ) : (
        <TouchDisplayFixture {...touchDisplayFixtureConfig} />
      )}
    </StrictMode>,
  );
}

void bootstrap();
