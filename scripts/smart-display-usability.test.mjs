import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/smart-display.css', import.meta.url), 'utf8');

describe('smart display long-running usability CSS', () => {
  it('applies a slow bounded stepped pixel shift to long-lived display regions', () => {
    expect(css).toContain('@keyframes smart-display-pixel-shift');
    expect(css).toContain('animation: smart-display-pixel-shift 60min steps(1, end) infinite');
    expect(css).toContain('translate3d(4px, -3px, 0)');
    expect(css).toContain('translate3d(-4px, 3px, 0)');
  });

  it('disables the pixel shift when reduced motion is requested', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none');
  });
});
