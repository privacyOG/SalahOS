export type ProductSurface = 'congregation' | 'admin';
export type CongregationDestination =
  'today' | 'calendar' | 'mosques' | 'qiblah' | 'knowledge' | 'community' | 'settings';
export type KnowledgeView = 'library' | 'quran' | 'hadith';
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
  'calendar',
  'mosques',
  'qiblah',
  'knowledge',
  'community',
  'settings',
]);
const knowledgeViews = new Set<KnowledgeView>(['library', 'quran', 'hadith']);
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
const quranVerseKeyPattern = /^(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):(?:[1-9]|[1-9]\d|[1-2]\d\d)$/;

export function readProductSurface(search: string): ProductSurface {
  return new URLSearchParams(search).get('surface') === 'admin' ? 'admin' : 'congregation';
}
export function readCongregationDestination(search: string): CongregationDestination {
  const requested = new URLSearchParams(search).get('view');
  return requested !== null && congregationDestinations.has(requested as CongregationDestination)
    ? (requested as CongregationDestination)
    : 'today';
}
export function readKnowledgeView(search: string): KnowledgeView {
  if (readCongregationDestination(search) !== 'knowledge') return 'library';
  const requested = new URLSearchParams(search).get('knowledgeView');
  return requested !== null && knowledgeViews.has(requested as KnowledgeView)
    ? (requested as KnowledgeView)
    : 'library';
}
export function readQuranVerseKey(search: string): string | null {
  if (readKnowledgeView(search) !== 'quran') return null;
  const requested = new URLSearchParams(search).get('ayah');
  return requested !== null && quranVerseKeyPattern.test(requested) ? requested : null;
}
export function readSettingsCategory(search: string): SettingsCategory | null {
  const params = new URLSearchParams(search);
  if (readProductSurface(search) !== 'congregation' || params.get('view') !== 'settings')
    return null;
  const requested = params.get('settingsView');
  if (requested !== null && settingsCategories.has(requested as SettingsCategory))
    return requested as SettingsCategory;
  return requested !== null && requested in legacySettingsCategories
    ? (legacySettingsCategories[requested] ?? null)
    : null;
}
export function readAdminDestination(search: string): AdminDestination {
  const requested = new URLSearchParams(search).get('adminView');
  if (requested !== null && adminDestinations.has(requested as AdminDestination))
    return requested as AdminDestination;
  if (requested !== null && requested in legacyAdminDestinations)
    return legacyAdminDestinations[requested] ?? 'overview';
  return 'overview';
}
function preserveUnrelatedParameters(search: string) {
  return new URLSearchParams(search);
}
function clearKnowledgeParameters(params: URLSearchParams): void {
  params.delete('knowledgeView');
  params.delete('ayah');
}
export function searchForCongregationDestination(
  currentSearch: string,
  destination: CongregationDestination,
) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  params.delete('settingsView');
  if (destination !== 'knowledge') clearKnowledgeParameters(params);
  params.set('view', destination);
  return `?${params.toString()}`;
}
export function searchForKnowledgeView(
  currentSearch: string,
  knowledgeView: KnowledgeView,
  ayah: string | null = null,
) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  params.delete('settingsView');
  params.set('view', 'knowledge');
  params.set('knowledgeView', knowledgeView);
  if (knowledgeView === 'quran' && ayah !== null && quranVerseKeyPattern.test(ayah)) {
    params.set('ayah', ayah);
  } else {
    params.delete('ayah');
  }
  return `?${params.toString()}`;
}
export function searchForSettingsCategory(
  currentSearch: string,
  category: SettingsCategory | null,
) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.delete('surface');
  params.delete('adminView');
  clearKnowledgeParameters(params);
  params.set('view', 'settings');
  if (category === null) params.delete('settingsView');
  else params.set('settingsView', category);
  return `?${params.toString()}`;
}
export function searchForAdminDestination(currentSearch: string, destination: AdminDestination) {
  const params = preserveUnrelatedParameters(currentSearch);
  params.set('surface', 'admin');
  params.set('adminView', destination);
  params.delete('view');
  params.delete('settingsView');
  clearKnowledgeParameters(params);
  return `?${params.toString()}`;
}
