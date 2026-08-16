import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { readTouchDisplayFixtureConfig, TouchDisplayFixture } from './ui/TouchDisplayFixture';
import './styles.css';
import './touch-display-fixture.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('SalahOS root element is missing');
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('/sw.js');
}

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
