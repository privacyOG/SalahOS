import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import {
  flushApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { CongregationShell } from './ui/CongregationShell';
import { QiblaCompassPanel } from './ui/QiblaCompassPanel';
import { RamadanModePanel } from './ui/RamadanModePanel';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import './styles.css';
import './design-system.css';
import './prayer-first-home.css';
import './congregation-shell.css';
import './responsive-hardening.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './ramadan-mode.css';
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
          <RamadanModePanel />
          <QiblaCompassPanel />
        </CongregationShell>
      ) : (
        <TouchDisplayFixture {...touchDisplayFixtureConfig} />
      )}
    </StrictMode>,
  );
}

void bootstrap();
