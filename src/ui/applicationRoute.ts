export type ProductSurface = 'congregation' | 'admin';

export type CongregationDestination =
  | 'today'
  | 'mosques'
  | 'qiblah'
  | 'community'
  | 'settings';

export type AdminDestination = 'overview' | 'displays' | 'themes' | 'remote';

const congregationDestinations = new Set<CongregationDestination>([
  'today',
  'mosques',
  'qiblah',
  'community',
  'settings',
]);

const adminDestinations = new Set<AdminDestination>([
  'overview',
  'displays',
  'themes',
  'remote',
]);

function paramsFromSearch(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

function serialize(params: URLSearchParams): string {
  const value = params.toString();
  return value.length === 0 ? '' : `?${value}`;
}

export function readProductSurface(search: string): ProductSurface {
  return paramsFromSearch(search).get('surface') === 'admin' ? 'admin' : 'congregation';
}

export function readCongregationDestination(search: string): CongregationDestination {
  const candidate = paramsFromSearch(search).get('view');
  return candidate !== null && congregationDestinations.has(candidate as CongregationDestination)
    ? (candidate as CongregationDestination)
    : 'today';
}

export function readAdminDestination(search: string): AdminDestination {
  const candidate = paramsFromSearch(search).get('adminView');
  return candidate !== null && adminDestinations.has(candidate as AdminDestination)
    ? (candidate as AdminDestination)
    : 'overview';
}

export function searchForCongregationDestination(
  search: string,
  destination: CongregationDestination,
): string {
  const params = paramsFromSearch(search);
  params.delete('surface');
  params.delete('adminView');
  params.set('view', destination);
  return serialize(params);
}

export function searchForAdminDestination(search: string, destination: AdminDestination): string {
  const params = paramsFromSearch(search);
  params.set('surface', 'admin');
  params.delete('view');
  params.set('adminView', destination);
  return serialize(params);
}
