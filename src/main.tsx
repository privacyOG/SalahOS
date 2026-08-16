import { Capacitor } from '@capacitor/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import {
  flushApplicationStorage,
  initializeApplicationStorage,
} from './platform/applicationStorage';
import { createStructuredErrorLogger } from './platform/errorLog';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import './styles.css';
import './touch-display-fixture.css';
import './smart-display.css';
import './safe-area.css';

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root');

  if (rootElement === null) {
    throw new Error('SalahOS root element is missing');
  }

  await initializeApplicationStorage(window.localStorage);

  if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && import.meta.env.PROD) {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }

  const storageErrorLogger = createStructuredErrorLogger();
  const flushStorage = () => {
    void flushApplicationStorage().catch(() => {
      storageErrorLogger.log('storage-persistence-unavailable');
    });
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
        <App />
      ) : (
        <TouchDisplayFixture {...touchDisplayFixtureConfig} />
      )}
    </StrictMode>,
  );
}

void bootstrap();
