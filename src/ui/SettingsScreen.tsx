import { App } from '../App';
import { RamadanModePanel } from './RamadanModePanel';
import { TaraweehPanel } from './TaraweehPanel';
import { searchForAdminDestination } from './applicationRoute';

function administrationHref(): string {
  const search = searchForAdminDestination(window.location.search, 'overview');
  return `${window.location.pathname}${search}${window.location.hash}`;
}

export function SettingsScreen() {
  return (
    <div className="settings-screen">
      <div className="legacy-core-route legacy-core-route--settings">
        <App />
      </div>
      <RamadanModePanel />
      <TaraweehPanel />
      <section className="surface-entry-card" aria-labelledby="managed-admin-entry-title">
        <p className="surface-entry-card__eyebrow">SalahOS</p>
        <h2 id="managed-admin-entry-title">Managed mosque administration</h2>
        <p>
          Display credentials, themes and remote-management controls stay outside the everyday
          prayer interface.
        </p>
        <a className="surface-entry-card__action" href={administrationHref()}>
          Open administration
        </a>
      </section>
    </div>
  );
}
