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
  it('renders a local-only audio chooser and lifecycle boundary in English', () => {
    const markup = renderToStaticMarkup(<LocalAdhanAudioSettings locale="en" {...props} />);

    expect(markup).toContain('Local Adhan audio');
    expect(markup).toContain('type="file"');
    expect(markup).toContain('accept="audio/*"');
    expect(markup).toContain('No local recording selected.');
    expect(markup).toContain('stays on this device');
    expect(markup).toContain('background and terminated delivery');
  });

  it('renders the same local-only control and lifecycle boundary in Arabic', () => {
    const markup = renderToStaticMarkup(<LocalAdhanAudioSettings locale="ar" {...props} />);

    expect(markup).toContain('صوت أذان محلي');
    expect(markup).toContain('type="file"');
    expect(markup).toContain('accept="audio/*"');
    expect(markup).toContain('يبقى التسجيل المختار على هذا الجهاز');
    expect(markup).toContain('في الخلفية');
  });
});
