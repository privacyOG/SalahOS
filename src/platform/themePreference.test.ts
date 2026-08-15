import { describe, expect, it } from 'vitest';
import { installThemePreference } from './themePreference';

class FakeMediaQueryList {
  matches: boolean;
  listener: (() => void) | null = null;

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: 'change', listener: () => void): void {
    this.listener = listener;
  }

  removeEventListener(_type: 'change', listener: () => void): void {
    if (this.listener === listener) {
      this.listener = null;
    }
  }

  emit(matches: boolean): void {
    this.matches = matches;
    this.listener?.();
  }
}

function createTargets(initialDark = false) {
  const dataset: DOMStringMap = {};
  const media = new FakeMediaQueryList(initialDark);
  return {
    dataset,
    media,
    targets: {
      documentTarget: { documentElement: { dataset } },
      windowTarget: { matchMedia: () => media },
    },
  };
}

describe('runtime theme preference', () => {
  it('applies explicit light theme without installing a system listener', () => {
    const { dataset, media, targets } = createTargets(true);
    const cleanup = installThemePreference('light', targets);

    expect(dataset.theme).toBe('light');
    expect(media.listener).toBeNull();
    cleanup();
  });

  it('applies explicit dark theme without installing a system listener', () => {
    const { dataset, media, targets } = createTargets(false);
    installThemePreference('dark', targets);

    expect(dataset.theme).toBe('dark');
    expect(media.listener).toBeNull();
  });

  it('resolves system preference and responds to later changes', () => {
    const { dataset, media, targets } = createTargets(false);
    const cleanup = installThemePreference('system', targets);

    expect(dataset.theme).toBe('light');
    expect(media.listener).not.toBeNull();

    media.emit(true);
    expect(dataset.theme).toBe('dark');

    media.emit(false);
    expect(dataset.theme).toBe('light');

    cleanup();
    expect(media.listener).toBeNull();
  });
});
