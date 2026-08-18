import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DesignSurface, EmptyState, StatusPill } from './DesignSurface';

describe('DesignSurface', () => {
  it('renders the shared surface contract and optional elevation', () => {
    const markup = renderToStaticMarkup(
      <DesignSurface elevated ariaLabel="Prayer overview" className="custom-surface">
        <p>Content</p>
      </DesignSurface>,
    );

    expect(markup).toContain('class="ds-surface ds-surface-raised custom-surface"');
    expect(markup).toContain('aria-label="Prayer overview"');
  });

  it('renders a reusable compact status pill', () => {
    expect(renderToStaticMarkup(<StatusPill>Offline</StatusPill>)).toBe(
      '<span class="ds-status-pill">Offline</span>',
    );
  });

  it('renders an accessible empty state with optional action content', () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        title="No mosque selected"
        description="Choose a mosque when you are ready."
        action={<button type="button">Choose mosque</button>}
      />,
    );

    expect(markup).toContain('class="ds-empty-state" role="status"');
    expect(markup).toContain('No mosque selected');
    expect(markup).toContain('Choose mosque');
  });
});
