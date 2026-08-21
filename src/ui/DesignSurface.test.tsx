import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  AnnouncementPreview,
  DesignButton,
  DesignSurface,
  EmptyState,
  FormField,
  MosqueSummary,
  NextPrayerSummary,
  PrayerRow,
  StateBanner,
  StatusPill,
} from './DesignSurface';

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

  it('renders all supported button variants through one contract', () => {
    for (const variant of ['primary', 'secondary', 'quiet', 'destructive', 'icon'] as const) {
      const markup = renderToStaticMarkup(<DesignButton variant={variant}>Action</DesignButton>);
      expect(markup).toContain(`ds-button--${variant}`);
      expect(markup).toContain('type="button"');
    }
  });

  it('renders a labelled form field and supporting hint', () => {
    const markup = renderToStaticMarkup(
      <FormField htmlFor="mosque" label="Mosque" hint="Used for local Iqamah times.">
        <input id="mosque" />
      </FormField>,
    );

    expect(markup).toContain('class="ds-field"');
    expect(markup).toContain('for="mosque"');
    expect(markup).toContain('Used for local Iqamah times.');
  });

  it('renders a reusable compact status pill', () => {
    expect(renderToStaticMarkup(<StatusPill>Offline</StatusPill>)).toBe(
      '<span class="ds-status-pill">Offline</span>',
    );
  });

  it('uses assertive semantics only for actionable failure states', () => {
    expect(renderToStaticMarkup(<StateBanner state="sync-error" title="Sync failed" />)).toContain(
      'role="alert"',
    );
    expect(renderToStaticMarkup(<StateBanner state="offline" title="Working offline" />)).toContain(
      'role="status"',
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

  it('renders shared prayer and community summary primitives', () => {
    const markup = renderToStaticMarkup(
      <>
        <PrayerRow name="Fajr" startTime="05:18" iqamahTime="05:45" />
        <NextPrayerSummary name="Dhuhr" startTime="12:05" iqamahTime="12:30" countdown="01:12:09" />
        <MosqueSummary name="Masjid Al Noor" detail="Local timetable" />
        <AnnouncementPreview title="Friday parking" meta="Priority" />
      </>,
    );

    expect(markup).toContain('ds-prayer-row');
    expect(markup).toContain('ds-next-prayer');
    expect(markup).toContain('ds-type-countdown');
    expect(markup).toContain('ds-mosque-summary');
    expect(markup).toContain('ds-announcement-preview');
  });
});
