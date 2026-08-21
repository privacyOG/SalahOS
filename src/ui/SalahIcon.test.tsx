import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SalahIcon, type SalahIconName } from './SalahIcon';

const iconNames: readonly SalahIconName[] = [
  'today',
  'mosques',
  'qiblah',
  'community',
  'settings',
  'prayer',
  'iqamah',
  'location',
  'display',
  'administration',
];

describe('SalahIcon', () => {
  it('renders the complete shared icon family as decorative SVG by default', () => {
    for (const name of iconNames) {
      const markup = renderToStaticMarkup(<SalahIcon name={name} />);
      expect(markup).toContain('class="salah-icon"');
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('<svg');
    }
  });

  it('supports an accessible title when the icon conveys standalone meaning', () => {
    const markup = renderToStaticMarkup(<SalahIcon name="location" title="Location" />);
    expect(markup).toContain('role="img"');
    expect(markup).toContain('<title>Location</title>');
    expect(markup).not.toContain('aria-hidden="true"');
  });
});
