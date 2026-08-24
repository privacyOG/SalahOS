import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defaultNotificationPreferences } from '../domain/notificationPreferences';
import { LocalAdhanAudioSettings } from './LocalAdhanAudioSettings';

const props = {
  date: '2026-08-17',
  localMinutes: 330,
  prayers: [{ name: 'fajr', localMinutes: 330 }] as const,
  notifications: defaultNotificationPreferences,
};

describe('LocalAdhanAudioSettings', () => {
  it('renders packaged, default, per-prayer, volume and local-audio controls in English', () => {
    const markup = renderToStaticMarkup(<LocalAdhanAudioSettings locale="en" {...props} />);

    expect(markup).toContain('Adhan audio library');
    expect(markup).toContain('Beautiful Adhan');
    expect(markup).toContain('Fajr Adhan — Malmö Mosque');
    expect(markup).toContain('CC0-1.0');
    expect(markup).toContain('CC-BY-3.0');
    expect(markup).toContain('data-testid="adhan-default-source"');
    expect(markup).toContain('data-adhan-prayer="fajr"');
    expect(markup).toContain('type="range"');
    expect(markup).toContain('Notification only');
    expect(markup).toContain('type="file"');
    expect(markup).toContain('No local recording selected.');
    expect(markup).toContain('Background or terminated delivery');
  });

  it('renders the same library controls and lifecycle boundary in Arabic', () => {
    const markup = renderToStaticMarkup(<LocalAdhanAudioSettings locale="ar" {...props} />);

    expect(markup).toContain('مكتبة أصوات الأذان');
    expect(markup).toContain('التسجيلات المضمّنة');
    expect(markup).toContain('الأذان الافتراضي');
    expect(markup).toContain('صوت لكل صلاة');
    expect(markup).toContain('إشعار فقط');
    expect(markup).toContain('type="file"');
    expect(markup).toContain('في الخلفية');
  });
});
