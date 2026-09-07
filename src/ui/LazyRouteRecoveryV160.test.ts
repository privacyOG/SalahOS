import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const boundary = readFileSync(new URL('./LazyRouteBoundary.tsx', import.meta.url), 'utf8');
const application = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');

describe('V1.6.0 lazy-route recovery', () => {
  it('renders a visible alert with an explicit reload action after a deferred route fails', () => {
    expect(boundary).toContain('getDerivedStateFromError');
    expect(boundary).toContain('data-lazy-route-failure');
    expect(boundary).toContain('role="alert"');
    expect(boundary).toContain('data-lazy-route-retry');
    expect(boundary).toContain('window.location.reload()');
    expect(boundary).toContain("retry: 'Reload and try again'");
  });

  it('keeps recovery copy available for every supported application locale', () => {
    expect(boundary).toContain("language.startsWith('ar')");
    expect(boundary).toContain("language.startsWith('tr')");
    expect(boundary).toContain("language.startsWith('id')");
    expect(boundary).toContain('إعادة التحميل والمحاولة مجدداً');
    expect(boundary).toContain('Yeniden yükle ve tekrar dene');
    expect(boundary).toContain('Muat ulang dan coba lagi');
  });

  it('wraps the shared deferred surface so every lazy application route gets the recovery boundary', () => {
    expect(application).toContain("import { LazyRouteBoundary } from './ui/LazyRouteBoundary';");
    expect(application).toContain('<LazyRouteBoundary>');
    expect(application).toContain('<Suspense fallback={<LoadingSurface />}>{children}</Suspense>');

    for (const route of [
      'AdministrationApplication',
      'SmartDisplayRoot',
      'PrayerCalendarScreen',
      'MosquesRoute',
      'QiblaFinder',
      'KnowledgeExperience',
      'CommunityScreen',
      'SettingsScreen',
    ]) {
      expect(application).toContain(`const ${route} = lazy(`);
      expect(application).toContain(`<${route} />`);
    }
  });
});
