export type ProductSurface = 'congregation' | 'admin';

export type CongregationDestination = 'today' | 'mosques' | 'qiblah' | 'community' | 'settings';

export type AdminDestination = 'overview' | 'displays' | 'themes' | 'remote';

export type SettingsCategory =
  | 'prayer'
  | 'location'
  | 'mosque'
  | 'notifications'
  | 'appearance'
  | 'data-privacy'
  | 'display-themes'
  | 'advanced';

const congregationDestinations = new Set<CongregationDestination>([
  'today',
  'mosques',
  'qiblah',
  'community',
  'settings',
]);

const adminDestinations = new Set<AdminDestination>(['overview', 'displays', 'themes', 'remote']);

const settingsCategories = new Set<SettingsCategory>([
  'prayer',
  'location',
  'mosque',
  'notifications',
  'appearance',
  'data-privacy',
  'display-themes',
  'advanced',
]);

function paramsFromSearch(search: string): URLSearchParams {
  const value = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(value);
}

function serialize(params: URLSearchParams): string {
  const value = params.toString();
  return value.length === 0 ? '' : `?${value}`;
}

export function readProductSurface(search: string): ProductSurface {
  const surface = paramsFromSearch(search).get('surface');
  if (surface === 'admin') return 'admin';
  return 'congregation';
}

export function readCongregationDestination(search: string): CongregationDestination {
  const candidate = paramsFromSearch(search).get('view');
  if (candidate === null) return 'today';

  const destination = candidate as CongregationDestination;
  if (!congregationDestinations.has(destination)) return 'today';

  return destination;
}

export function readAdminDestination(search: string): AdminDestination {
  const candidate = paramsFromSearch(search).get('adminView');
  if (candidate === null) return 'overview';

  const destination = candidate as AdminDestination;
  if (!adminDestinations.has(destination)) return 'overview';

  return destination;
}

export function readSettingsCategory(search: string): SettingsCategory | null {
  const candidate = paramsFromSearch(search).get('settingsView');
  if (candidate === null) return null;

  const category = candidate as SettingsCategory;
  if (!settingsCategories.has(category)) return null;

  return category;
}

export function searchForCongregationDestination(
  search: string,
  destination: CongregationDestination,
): string {
  const params = paramsFromSearch(search);
  params.delete('surface');
  params.delete('adminView');
  params.delete('settingsView');
  params.set('view', destination);
  return serialize(params);
}

export function searchForSettingsCategory(search: string, category: SettingsCategory | null): string {
  const params = paramsFromSearch(search);
  params.delete('surface');
  params.delete('adminView');
  params.set('view', 'settings');
  if (category === null) {
    params.delete('settingsView');
  } else {
    params.set('settingsView', category);
  }
  return serialize(params);
}

export function searchForAdminDestination(search: string, destination: AdminDestination): string {
  const params = paramsFromSearch(search);
  params.set('surface', 'admin');
  params.delete('view');
  params.delete('settingsView');
  params.set('adminView', destination);
  return serialize(params);
}
