import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrayerCard } from './PrayerCard';

describe('PrayerCard', () => {
  it('renders current/next state, start, Iqamah and adjustment indicators', () => {
    const markup = renderToStaticMarkup(
      <PrayerCard
        prayerName="Fajr"
        isCurrent
        isNext
        isSupplementary={false}
        currentPrayerLabel="Current prayer"
        prayerStartLabel="Prayer start"
        startTime="05:12"
        iqamahLabel="Iqamah"
        iqamahTime="05:32"
        highLatitudeIndicator="High latitude · Angle based"
        manualAdjustmentIndicator="Manual offset +2 min"
      />,
    );

    expect(markup).toContain('prayer-card-current');
    expect(markup).toContain('prayer-card-next');
    expect(markup).toContain('Current prayer');
    expect(markup).toContain('Prayer start');
    expect(markup).toContain('05:12');
    expect(markup).toContain('Iqamah');
    expect(markup).toContain('05:32');
    expect(markup).toContain('high-latitude-indicator');
    expect(markup).toContain('High latitude · Angle based');
    expect(markup).toContain('manual-adjustment-indicator');
    expect(markup).toContain('Manual offset +2 min');
  });

  it('marks supplementary rows and omits Iqamah presentation', () => {
    const markup = renderToStaticMarkup(
      <PrayerCard
        prayerName="Sunrise"
        isCurrent={false}
        isNext={false}
        isSupplementary
        currentPrayerLabel="Current prayer"
        prayerStartLabel="Prayer start"
        startTime="06:31"
        iqamahLabel="Iqamah"
        iqamahTime="No Iqamah"
      />,
    );

    expect(markup).toContain('prayer-card-supplementary');
    expect(markup).toContain('Sunrise');
    expect(markup).toContain('06:31');
    expect(markup).not.toContain('Iqamah');
    expect(markup).not.toContain('current-prayer-badge');
  });
});
