export function smartDisplayModeRequested(search: string): boolean {
  return new URLSearchParams(search).get('mode') === 'smart-display';
}
