import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const designSystemCss = readFileSync(new URL('../src/design-system.css', import.meta.url), 'utf8');

describe('mobile safe-area contract', () => {
  it('opts the viewport into display-cutout safe-area values', () => {
    expect(indexHtml).toContain('viewport-fit=cover');
  });

  it('keeps the shared application shell clear of every exposed safe-area edge', () => {
    expect(designSystemCss).toContain('env(safe-area-inset-top)');
    expect(designSystemCss).toContain('env(safe-area-inset-right)');
    expect(designSystemCss).toContain('env(safe-area-inset-bottom)');
    expect(designSystemCss).toContain('env(safe-area-inset-left)');
    expect(designSystemCss).toMatch(
      /padding-block-start:\s*calc\([^;]*env\(safe-area-inset-top\)\)/,
    );
    expect(designSystemCss).toMatch(
      /padding-block-end:\s*calc\([^;]*env\(safe-area-inset-bottom\)\)/,
    );
  });
});
