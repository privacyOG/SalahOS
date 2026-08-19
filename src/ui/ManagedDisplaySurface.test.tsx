import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ManagedDisplaySurface } from './ManagedDisplaySurface';

const prayers = [
  { name: 'Fajr', adhan: '05:18', iqamah: '05:35' },
  { name: 'Dhuhr', adhan: '12:07', iqamah: '12:30' },
  { name: 'Asr', adhan: '15:21', iqamah: '15:45', active: true },
  { name: 'Maghrib', adhan: '17:42', iqamah: '17:49' },
  { name: 'Isha', adhan: '19:01', iqamah: '19:20' },
] as const;

describe('ManagedDisplaySurface', () => {
  it('renders the 16:9 prayer-board profile with readable prayer rows', () => {
    const html = renderToStaticMarkup(
      <ManagedDisplaySurface
        profile="tv-16x9"
        mosqueName="Salah Mosque"
        localDateLabel="Wednesday 19 August"
        currentTimeLabel="20:15"
        prayers={prayers}
      />,
    );

    expect(html).toContain('data-profile="tv-16x9"');
    expect(html).toContain('Salah Mosque');
    expect(html).toContain('Fajr');
    expect(html).toContain('Iqamah');
    expect(html).toContain('Esc / Back to exit display mode');
  });

  it('renders portrait and Touch Display 2 profiles', () => {
    const portrait = renderToStaticMarkup(
      <ManagedDisplaySurface
        profile="portrait-foyer"
        mosqueName="Salah Mosque"
        localDateLabel="19 August"
        currentTimeLabel="20:15"
        prayers={prayers}
      />,
    );
    const touch = renderToStaticMarkup(
      <ManagedDisplaySurface
        profile="touch-display-2"
        mosqueName="Salah Mosque"
        localDateLabel="19 August"
        currentTimeLabel="20:15"
        prayers={prayers}
        burnInShift={2}
      />,
    );

    expect(portrait).toContain('data-profile="portrait-foyer"');
    expect(touch).toContain('data-profile="touch-display-2"');
    expect(touch).toContain('data-burn-in-shift="2"');
  });
});
