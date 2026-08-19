import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createMosqueId } from '../domain/mosqueIdentity';
import { MosqueDirectoryResults } from './MosqueDirectoryResults';

describe('MosqueDirectoryResults', () => {
  it('renders provenance, freshness and follow state without requiring a map', () => {
    const markup = renderToStaticMarkup(
      <MosqueDirectoryResults
        results={[
          {
            mosqueId: createMosqueId('lakemba-mosque'),
            name: { en: 'Lakemba Mosque', ar: 'مسجد لاكيمبا' },
            areaLabel: 'Lakemba, NSW',
            addressLabel: 'Example Street, Lakemba',
            prayerSourceLabel: 'Managed timetable',
            synchronizedAt: '2026-08-19T10:00:00.000Z',
            followed: true,
          },
        ]}
      />,
    );

    expect(markup).toContain('Lakemba Mosque');
    expect(markup).toContain('Managed timetable');
    expect(markup).toContain('Updated 2026-08-19T10:00:00.000Z');
    expect(markup).toContain('Following');
    expect(markup).not.toContain('map');
  });

  it('renders a clear empty state', () => {
    const markup = renderToStaticMarkup(<MosqueDirectoryResults results={[]} />);
    expect(markup).toContain('No mosques matched this search.');
  });
});
