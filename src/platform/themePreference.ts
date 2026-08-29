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

interface ActiveThemePreference {
  readonly leases: Set<symbol>;
  disposeSystemListener: () => void;
}

const activeThemePreferences = new WeakMap<object, ActiveThemePreference>();

function applyEffectiveTheme(documentTarget: ThemeDocument, theme: EffectiveTheme): void {
  documentTarget.documentElement.dataset.theme = theme;
}

function applyThemePreference(
  preference: ThemePreference,
  targets: { readonly documentTarget: ThemeDocument; readonly windowTarget: ThemeWindow },
  active: ActiveThemePreference,
): void {
  active.disposeSystemListener();
  active.disposeSystemListener = () => undefined;

  if (preference !== 'system') {
    applyEffectiveTheme(targets.documentTarget, preference);
    return;
  }

  const media = targets.windowTarget.matchMedia('(prefers-color-scheme: dark)');
  const refresh = () => {
    applyEffectiveTheme(targets.documentTarget, media.matches ? 'dark' : 'light');
  };

  refresh();
  media.addEventListener('change', refresh);
  active.disposeSystemListener = () => {
    media.removeEventListener('change', refresh);
  };
}

export function installThemePreference(
  preference: ThemePreference,
  targets: { readonly documentTarget: ThemeDocument; readonly windowTarget: ThemeWindow },
): () => void {
  let active = activeThemePreferences.get(targets.documentTarget);
  if (active === undefined) {
    active = {
      leases: new Set<symbol>(),
      disposeSystemListener: () => undefined,
    };
    activeThemePreferences.set(targets.documentTarget, active);
  }

  const token = Symbol('theme-preference');
  active.leases.add(token);
  applyThemePreference(preference, targets, active);

  return () => {
    const current = activeThemePreferences.get(targets.documentTarget);
    if (current !== active || !active.leases.delete(token)) return;
    if (active.leases.size > 0) return;

    active.disposeSystemListener();
    activeThemePreferences.delete(targets.documentTarget);
  };
}
