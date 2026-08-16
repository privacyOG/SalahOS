import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NextPrayerBlock } from './NextPrayerBlock';

describe('NextPrayerBlock', () => {
  it('renders the next prayer, countdown and tomorrow marker', () => {
    const markup = renderToStaticMarkup(
      <NextPrayerBlock
        nextPrayerLabel="Fajr"
        countdown="01:12:03"
        tomorrow
        nextPrayerText="Next prayer"
        notConfiguredText="Not configured"
        tomorrowText="Tomorrow"
      />,
    );

    expect(markup).toContain('next-prayer-block');
    expect(markup).toContain('Next prayer');
    expect(markup).toContain('<strong>Fajr</strong>');
    expect(markup).toContain('countdown');
    expect(markup).toContain('01:12:03');
    expect(markup).toContain('Tomorrow');
  });

  it('renders the configured fallback without a tomorrow marker', () => {
    const markup = renderToStaticMarkup(
      <NextPrayerBlock
        nextPrayerLabel={null}
        countdown="—"
        tomorrow={false}
        nextPrayerText="Next prayer"
        notConfiguredText="Not configured"
        tomorrowText="Tomorrow"
      />,
    );

    expect(markup).toContain('<strong>Not configured</strong>');
    expect(markup).toContain('>—</p>');
    expect(markup).not.toContain('Tomorrow');
  });
});
