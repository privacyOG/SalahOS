import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PublicEmbedConfigurator } from './PublicEmbedConfigurator';

describe('PublicEmbedConfigurator', () => {
  it('renders an English light embed configuration', () => {
    const html = renderToStaticMarkup(
      <PublicEmbedConfigurator
        config={{ mosqueId: 'masjid.one', kind: 'daily', theme: 'light', locale: 'en' }}
        mosqueName="Masjid One"
        origin="https://salahos.example"
      />,
    );

    expect(html).toContain('Website embed');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('/embed/daily/masjid.one?theme=light&amp;lang=en');
    expect(html).toContain('sandbox=&quot;allow-same-origin&quot;');
  });

  it('renders Arabic RTL configuration', () => {
    const html = renderToStaticMarkup(
      <PublicEmbedConfigurator
        config={{ mosqueId: 'masjid.one', kind: 'next-prayer', theme: 'dark', locale: 'ar' }}
        mosqueName="مسجد واحد"
        origin="https://salahos.example"
      />,
    );

    expect(html).toContain('تضمين الموقع');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('data-theme="dark"');
  });
});
