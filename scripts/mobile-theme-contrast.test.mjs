import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const modulesCss = readFileSync(new URL('../src/mobile-prayer-modules.css', import.meta.url), 'utf8');

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function luminance(hex) {
  const channels = rgb(hex).map((component) => {
    const value = component / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function templateRule(template) {
  return modulesCss.match(
    new RegExp(
      `\\.mobile-prayer-theme-surface\\[data-mobile-prayer-template='${template}'\\]\\s*\\{[^}]*\\}`,
      's',
    ),
  )?.[0];
}

describe('mobile prayer theme contrast hardening', () => {
  it.each([
    ['minimal-modern', '#65736f', '#ffffff'],
    ['structured-split-board', '#5d6a79', '#f5f5f4'],
    ['family-classroom', '#5c6974', '#fffdf8'],
  ])('%s keeps tertiary metadata at WCAG AA contrast', (template, foreground, background) => {
    const rule = templateRule(template);
    expect(rule).toBeDefined();
    expect(rule).toContain(`--mobile-theme-tertiary: ${foreground}`);
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('uses mobile theme surfaces and content colours for contextual cards', () => {
    expect(modulesCss).toMatch(
      /\.mobile-prayer-theme-surface \.today-context-state,[\s\S]*\.today-community-preview article\s*\{[^}]*background:\s*var\(--mobile-theme-surface\)/,
    );
    expect(modulesCss).toMatch(
      /\.today-community-preview article\s*\{[^}]*color:\s*var\(--mobile-theme-fg\)/,
    );
    expect(modulesCss).toMatch(
      /\.today-community-preview article > p,[\s\S]*\.today-community-preview dd\s*\{[^}]*color:\s*var\(--mobile-theme-secondary\)/,
    );
    expect(modulesCss).toMatch(
      /\.today-community-preview header p,[\s\S]*\.today-community-preview dt\s*\{[^}]*color:\s*var\(--mobile-theme-tertiary\)/,
    );
  });
});
