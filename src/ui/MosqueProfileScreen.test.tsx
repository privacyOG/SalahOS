import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MosqueProfileScreen } from './MosqueProfileScreen';

const baseProps = {
  mosqueName: 'Example Masjid',
  address: '1 Example Street, Sydney NSW',
  sourceLabel: 'Mosque-published timetable',
  freshnessLabel: 'Updated 5 minutes ago',
  nextPrayerName: 'Asr',
  nextPrayerCountdown: '01:24:16',
  prayers: [
    { name: 'Fajr', start: '05:21', iqamah: '05:45' },
    { name: 'Dhuhr', start: '12:04', iqamah: '12:30' },
    { name: 'Asr', start: '15:11', iqamah: '15:30', active: true },
  ],
  jumuahSessions: [{ label: 'First Jumu’ah', khutbah: '12:20', start: '12:30' }],
  communityItems: [
    { id: 'announcement-1', kind: 'announcement' as const, title: 'Community dinner', meta: 'Friday' },
    { id: 'event-1', kind: 'event' as const, title: 'Weekend class', meta: 'Saturday 10:00' },
  ],
  facilities: [{ id: 'parking', label: 'Parking' }],
};

describe('MosqueProfileScreen', () => {
  it('renders prayer, Jumuah, community and mosque details', () => {
    const html = renderToStaticMarkup(
      <MosqueProfileScreen
        {...baseProps}
        contactLabel="info@example.org"
        supportUrl="https://example.org/support"
        timetableUrl="https://example.org/timetable"
      />,
    );

    expect(html).toContain('Example Masjid');
    expect(html).toContain('Next prayer');
    expect(html).toContain('01:24:16');
    expect(html).toContain('First Jumu’ah');
    expect(html).toContain('Community dinner');
    expect(html).toContain('Weekend class');
    expect(html).toContain('Parking');
    expect(html).toContain('Monthly timetable');
    expect(html).toContain('Support this mosque');
  });

  it('omits optional sections and actions when unpublished', () => {
    const html = renderToStaticMarkup(
      <MosqueProfileScreen
        {...baseProps}
        communityItems={[]}
        facilities={[]}
        jumuahSessions={[]}
      />,
    );

    expect(html).not.toContain('Jumu’ah</h2>');
    expect(html).not.toContain('Community</h2>');
    expect(html).not.toContain('Monthly timetable');
    expect(html).not.toContain('Support this mosque');
  });
});
