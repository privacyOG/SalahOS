import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defaultNotificationPreferences } from '../domain/notificationPreferences';
import { LocalAdhanAudioSettings } from './LocalAdhanAudioSettings';

function render(locale: 'en' | 'ar'): string {
  return renderToStaticMarkup(
    <LocalAdhanAudioSettings
      locale={locale}
      date={null}
      localMinutes={null}
      prayers={[]}
      notifications={defaultNotificationPreferences}
    />,
  );
}

describe('LocalAdhanAudioSettings', () => {
  it('renders local-only and foreground-only disclosure in English', () => {
    const markup = render('en');

    expect(markup).toContain('Local Adhan audio');
    expect(markup).toContain('Choose local audio');
    expect(markup).toContain('stays on this device');
    expect(markup).toContain('does not upload or bundle it');
    expect(markup).toContain('only while the app is open and visible');
    expect(markup).toContain('accept="audio/*"');
  });

  it('renders the local-only and lifecycle disclosure in Arabic', () => {
    const markup = render('ar');

    expect(markup).toContain('صوت أذان محلي');
    expect(markup).toContain('اختر ملفاً صوتياً محلياً');
    expect(markup).toContain('يبقى التسجيل المختار على هذا الجهاز');
    expect(markup).toContain('لا يرفعه صلاح أو إس');
    expect(markup).toContain('عندما يكون التطبيق مفتوحاً وظاهراً');
  });
});
