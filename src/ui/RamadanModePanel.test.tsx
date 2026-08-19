import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ramadanTranslations } from '../i18n/ramadanTranslations';
import { RamadanMealTimeCard } from './RamadanModePanel';

describe('Ramadan meal time presentation', () => {
  it('renders a source-aware English Suhur time', () => {
    const markup = renderToStaticMarkup(
      <RamadanMealTimeCard
        label={ramadanTranslations.en.suhurEnd}
        localMinutes={315}
        help={ramadanTranslations.en.suhurHelp}
        source="local-mosque"
        locale="en"
        timeFormat="h23"
        text={ramadanTranslations.en}
      />,
    );

    expect(markup).toContain('Suhur ends');
    expect(markup).toContain('05:15');
    expect(markup).toContain('Local mosque timetable');
    expect(markup).toContain('Fasting begins at the displayed Fajr time.');
  });

  it('renders Arabic Iftar copy and adjusted source provenance', () => {
    const markup = renderToStaticMarkup(
      <RamadanMealTimeCard
        label={ramadanTranslations.ar.iftar}
        localMinutes={1_050}
        help={ramadanTranslations.ar.iftarHelp}
        source="calculated-adjustments"
        locale="ar"
        timeFormat="h23"
        text={ramadanTranslations.ar}
      />,
    );

    expect(markup).toContain('الإفطار');
    expect(markup).toContain('17:30');
    expect(markup).toContain('محسوب محلياً مع التعديلات');
  });

  it('shows an explicit unavailable state instead of inventing a time', () => {
    const markup = renderToStaticMarkup(
      <RamadanMealTimeCard
        label={ramadanTranslations.en.iftar}
        localMinutes={null}
        help={ramadanTranslations.en.iftarHelp}
        source="calculated"
        locale="en"
        timeFormat="h12"
        text={ramadanTranslations.en}
      />,
    );

    expect(markup).toContain('Unavailable');
    expect(markup).toContain('Calculated locally');
  });
});
