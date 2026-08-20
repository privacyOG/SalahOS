import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PrimaryNavigation } from './PrimaryNavigation';

describe('PrimaryNavigation', () => {
  it('renders only supplied destinations with icons and marks the current destination', () => {
    const markup = renderToStaticMarkup(
      <PrimaryNavigation
        ariaLabel="Primary navigation"
        items={[
          { id: 'today', icon: 'today', label: 'Today', current: true, onSelect: vi.fn() },
          { id: 'settings', icon: 'settings', label: 'Settings', onSelect: vi.fn() },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('congregation-nav-icon');
    expect(markup).toContain('<svg');
    expect(markup).toContain('Today');
    expect(markup).toContain('Settings');
    expect(markup).not.toContain('Mosques');
    expect(markup).not.toContain('Calendar');
    expect(markup).not.toContain('Community');
  });
});
