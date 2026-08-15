import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('SalahOS root element is missing');
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('/sw.js');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
