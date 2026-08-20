import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SmartDisplay } from './SmartDisplay';

describe('SmartDisplay theme integration', () => {
  it('renders the deterministic Classic preset when no persisted theme is available', () => {
    const html = renderToStaticMarkup(
      <SmartDisplay
        locale="en"
        currentClock="10:00:00"
        dashboard={null}
        timeFormat="h23"
        hijriCorrectionDays={0}
        offline={false}
        systemTimeUnavailable={false}
        calculationUnavailable={false}
      />,
    );

    expect(html).toContain('data-display-theme="classic"');
  });
});
