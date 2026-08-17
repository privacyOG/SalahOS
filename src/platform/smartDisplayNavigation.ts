const EXIT_KEYS = new Set(['Escape', 'Backspace', 'BrowserBack', 'GoBack']);

export function smartDisplayExitPath(currentUrl: string, key: string): string | null {
  if (!EXIT_KEYS.has(key)) {
    return null;
  }

  const url = new URL(currentUrl, 'file:///');
  if (url.searchParams.get('mode') !== 'smart-display') {
    return null;
  }

  url.searchParams.delete('mode');
  const search = url.searchParams.toString();
  return `${url.pathname}${search.length === 0 ? '' : `?${search}`}${url.hash}`;
}
