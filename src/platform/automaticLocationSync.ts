import { getApplicationStorage } from './applicationStorage';
import {
  LOCATION_CONTEXT_CHANGE_EVENT,
  persistBestAvailableLocation,
  resolveBestAvailableLocation,
  type LocationFallback,
} from './bestAvailableLocation';
import {
  loadQiblaPermissionOnboarding,
  LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT,
} from './qiblaPermissionOnboarding';
import { loadPersistedSettings } from './settingsStorage';

const AUTO_LOCATION_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function savedFallback(): LocationFallback | undefined {
  const settings = loadPersistedSettings(getApplicationStorage());
  return settings.location === null
    ? undefined
    : {
        coordinates: settings.location.coordinates,
        source: 'saved',
        ...(settings.location.timeZone === undefined ? {} : { timeZone: settings.location.timeZone }),
      };
}

async function refreshAutomaticLocation(): Promise<void> {
  const storage = getApplicationStorage();
  if (!loadQiblaPermissionOnboarding(storage).autoLocation) return;

  const saved = savedFallback();
  const location = await resolveBestAvailableLocation(storage, {
    ...(saved === undefined ? {} : { saved }),
  });
  if (location === null) return;
  if (persistBestAvailableLocation(storage, location)) {
    window.dispatchEvent(new Event(LOCATION_CONTEXT_CHANGE_EVENT));
  }
}

/**
 * Keep the shared foreground location current after the user opts in. The
 * synchronizer never requests background location: it refreshes while the app
 * is active, when connectivity returns and when the first-run choice changes.
 */
export function installAutomaticLocationSync(): () => void {
  let active = true;
  let inFlight = false;

  const refresh = async () => {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      await refreshAutomaticLocation();
    } finally {
      inFlight = false;
    }
  };
  const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') void refresh();
  };
  const refreshFromEvent = () => {
    void refresh();
  };

  void refresh();
  const timer = window.setInterval(refreshFromEvent, AUTO_LOCATION_REFRESH_INTERVAL_MS);
  window.addEventListener('focus', refreshFromEvent);
  window.addEventListener('online', refreshFromEvent);
  window.addEventListener(LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT, refreshFromEvent);
  document.addEventListener('visibilitychange', refreshWhenVisible);

  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener('focus', refreshFromEvent);
    window.removeEventListener('online', refreshFromEvent);
    window.removeEventListener(LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT, refreshFromEvent);
    document.removeEventListener('visibilitychange', refreshWhenVisible);
  };
}
