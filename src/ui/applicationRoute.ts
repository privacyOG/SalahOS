export type ProductSurface = 'congregation' | 'admin';
export type CongregationDestination =
  'today' | 'mosques' | 'qiblah' | 'knowledge' | 'community' | 'settings';
export type SettingsCategory =
  'location' | 'prayer' | 'adhan' | 'display' | 'mosques' | 'privacy-data' | 'advanced';
export type AdminDestination =
  | 'overview'
  | 'prayer-iqamah'
  | 'jumuah-ramadan'
  | 'community'
  | 'displays'
  | 'integrations'
  | 'members'
  | 'settings';

const congregationDestinations = new Set<CongregationDestination>([
  'today',
  'mosques',
  'qiblah',
  'knowledge',
  'community',
  'settings',
]);

const settingsCategories = new Set<SettingsCategory>([
  'location',
  'prayer',
  'adhan',
  'display',
  'mosques',
  'privacy-data',
  'advanced',
]);

const legacySettingsCategories: Readonly<Record<string, SettingsCategory>> = Object.freeze({
  mosque: 'mosques',
  notifications: 'adhan',
  appearance: 'display',
  'data-privacy': 'privacy-data',
  'display-themes': 'display',
});

const adminDestinations = new Set<AdminDestination>([
  'overview',
  'prayer-iqamah',
  'jumuah-ramadan',
  'community',
  'displays',
  'integrations',
  'members',
  'settings',
]);

const legacyAdminDestinations: Readonly<Record<string, AdminDestination>> = Object.freeze({
  themes: 'displays',
  remote: 'displays',
});

export function readProductSurface(search: string): ProductSurface {
  return new URLSearchParams(search).get('surface') === 'admin' ? 'admin' : 'congregation';
}

export function readCongregationDestination(search: string): CongregationDestination {
  const requested = new URLSearchParams(search).get('view');
  return requested !== null && congregationDestinations.has(requested as CongregationDestination)
    ? (requested as CongregationDestination)
    : 'today';
}

export function readSettingsCategory(search: string): SettingsCategory | null {
  const params = new URLSearchParams(search);
  if (readProductSurface(search) !== 'congregation' || params.get('view') !== 'settings') {
    return null;
  }
  const requested = params.get('settingsView');
  if (requested !== null && settingsCategories.has(requested as SettingsCategory)) {
    return requested as SettingsCategory;
  }
  return requested !== null && requested in legacySettingsCategories
    ? (legacySettingsCategories[requested] ?? null)
    : null;
}

export function readAdminDestination(search: string): AdminDestination {
  const requested = new URLSearchParams(search).get('adminView');
  if (requested !== null && adminDestinations.has(requested as AdminDestination)) {
    return requested as AdminDestination;
  }
  if (requested !== null && requested in legacyAdminDestinations) {
    return legacyAdminDestinations[requested] ?? 'overview';
  }
  return 'overview';
}

function preserveUnrelatedParameters(search: string): URLSearchParams {
  return new URLSearchParams(search);
}

export function searchForCongregationDestination(
  currentSearch: string,
  destination: CongregationDestination,
): string {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  params.delete('settingsView');
  params.set('view', destination);
  return `?${params.toString()}`;
}

export function searchForSettingsCategory(
  currentSearch: string,
  category: SettingsCategory | null,
): string {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  params.set('view', 'settings');
  if (category === null) params.delete('settingsView');
  else params.set('settingsView', category);
  return `?${params.toString()}`;
}

export function searchForAdminDestination(
  currentSearch: string,
  destination: AdminDestination,
): string {
  const params = preserveUnrelatedParameters(currentSearch);
  params.set('surface', 'admin');
  params.set('adminView', destination);
  params.delete('view');
  params.delete('settingsView');
  return `?${params.toString()}`;
}
