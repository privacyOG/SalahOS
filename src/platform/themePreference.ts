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

type ActiveThemePreference = Readonly<{
  token: symbol;
  dispose: () => void;
}>;

const activeThemePreferences = new WeakMap<object, ActiveThemePreference>();

function applyEffectiveTheme(documentTarget: ThemeDocument, theme: EffectiveTheme): void {
  documentTarget.documentElement.dataset.theme = theme;
}

export function installThemePreference(
  preference: ThemePreference,
  targets: { readonly documentTarget: ThemeDocument; readonly windowTarget: ThemeWindow },
): () => void {
  activeThemePreferences.get(targets.documentTarget)?.dispose();

  const token = Symbol('theme-preference');
  let dispose = () => undefined;

  if (preference !== 'system') {
    applyEffectiveTheme(targets.documentTarget, preference);
  } else {
    const media = targets.windowTarget.matchMedia('(prefers-color-scheme: dark)');
    const refresh = () => {
      applyEffectiveTheme(targets.documentTarget, media.matches ? 'dark' : 'light');
    };

    refresh();
    media.addEventListener('change', refresh);
    dispose = () => {
      media.removeEventListener('change', refresh);
    };
  }

  activeThemePreferences.set(targets.documentTarget, { token, dispose });

  return () => {
    const active = activeThemePreferences.get(targets.documentTarget);
    if (active?.token !== token) return;
    active.dispose();
    activeThemePreferences.delete(targets.documentTarget);
  };
}
