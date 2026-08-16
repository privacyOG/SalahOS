import { describe, expect, it } from 'vitest';
import { smartDisplayExitPath } from './smartDisplayNavigation';

describe('smartDisplayExitPath', () => {
  it('returns to the standard app for practical keyboard and remote back keys', () => {
    for (const key of ['Escape', 'Backspace', 'BrowserBack', 'GoBack']) {
      expect(smartDisplayExitPath('/?mode=smart-display', key)).toBe('/');
    }
  });

  it('preserves unrelated query parameters and the hash while removing display mode', () => {
    expect(
      smartDisplayExitPath('/display?foo=1&mode=smart-display&lang=ar#prayers', 'Escape'),
    ).toBe('/display?foo=1&lang=ar#prayers');
  });

  it('ignores unrelated keys and standard-mode pages', () => {
    expect(smartDisplayExitPath('/?mode=smart-display', 'ArrowLeft')).toBeNull();
    expect(smartDisplayExitPath('/?foo=1', 'Escape')).toBeNull();
  });
});
