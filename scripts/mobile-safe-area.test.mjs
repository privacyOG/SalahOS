import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const designSystemCss = readFileSync(new URL('../src/design-system.css', import.meta.url), 'utf8');
const congregationShellCss = readFileSync(
  new URL('../src/congregation-shell.css', import.meta.url),
  'utf8',
);

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

  it('does not erase the top or horizontal safe-area contract on the Today route', () => {
    const todayRouteRule = congregationShellCss.match(
      /\.app-shell\.today-route-shell\s*\{[^}]*\}/s,
    )?.[0];
    expect(todayRouteRule).toBeDefined();
    expect(todayRouteRule).toContain('padding-block-start: env(safe-area-inset-top)');
    expect(todayRouteRule).toContain('padding-inline-start: env(safe-area-inset-left)');
    expect(todayRouteRule).toContain('padding-inline-end: env(safe-area-inset-right)');
    expect(todayRouteRule).not.toMatch(/\bpadding:\s*0\s*;/);
  });
});
