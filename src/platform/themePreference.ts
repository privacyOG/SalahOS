export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = Exclude<ThemePreference, 'system'>;

interface ThemeDocumentElement {
  readonly dataset: DOMStringMap;
}

interface ThemeDocument {
  readonly documentElement: ThemeDocumentElement;
}

interface ThemeMediaQueryList {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface ThemeWindow {
  matchMedia(query: string): ThemeMediaQueryList;
}

function applyEffectiveTheme(documentTarget: ThemeDocument, theme: EffectiveTheme): void {
  documentTarget.documentElement.dataset.theme = theme;
}

export function installThemePreference(
  preference: ThemePreference,
  targets: { readonly documentTarget: ThemeDocument; readonly windowTarget: ThemeWindow },
): () => void {
  if (preference !== 'system') {
    applyEffectiveTheme(targets.documentTarget, preference);
    return () => undefined;
  }

  const media = targets.windowTarget.matchMedia('(prefers-color-scheme: dark)');
  const refresh = () => {
    applyEffectiveTheme(targets.documentTarget, media.matches ? 'dark' : 'light');
  };

  refresh();
  media.addEventListener('change', refresh);

  return () => {
    media.removeEventListener('change', refresh);
  };
}
