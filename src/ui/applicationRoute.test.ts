import { describe, expect, it } from 'vitest';

import {
  readAdminDestination,
  readCongregationDestination,
  readKnowledgeView,
  readProductSurface,
  readQuranVerseKey,
  readSettingsCategory,
  searchForAdminDestination,
  searchForCongregationDestination,
  searchForKnowledgeView,
  searchForSettingsCategory,
} from './applicationRoute';

describe('applicationRoute', () => {
  it('defaults unknown and absent congregation destinations to Today', () => {
    expect(readProductSurface('')).toBe('congregation');
    expect(readCongregationDestination('')).toBe('today');
    expect(readCongregationDestination('?view=unknown')).toBe('today');
  });

  it('reads every supported congregation destination from a reloadable URL', () => {
    for (const destination of [
      'today',
      'calendar',
      'mosques',
      'qiblah',
      'knowledge',
      'community',
      'settings',
    ] as const) {
      expect(readCongregationDestination(`?view=${destination}`)).toBe(destination);
    }
  });

  it('creates congregation links while preserving unrelated query state', () => {
    const search = searchForCongregationDestination(
      '?surface=admin&adminView=displays&settingsView=prayer&debug=1',
      'knowledge',
    );
    const params = new URLSearchParams(search);
    expect(params.get('view')).toBe('knowledge');
    expect(params.get('debug')).toBe('1');
    expect(params.has('surface')).toBe(false);
    expect(params.has('adminView')).toBe(false);
    expect(params.has('settingsView')).toBe(false);
  });

  it('creates deep-linkable Knowledge sections and Qur’an ayah routes', () => {
    const quran = searchForKnowledgeView('?view=knowledge&debug=1', 'quran', '2:255');
    expect(readCongregationDestination(quran)).toBe('knowledge');
    expect(readKnowledgeView(quran)).toBe('quran');
    expect(readQuranVerseKey(quran)).toBe('2:255');
    expect(new URLSearchParams(quran).get('debug')).toBe('1');

    const hadith = searchForKnowledgeView(quran, 'hadith');
    expect(readKnowledgeView(hadith)).toBe('hadith');
    expect(readQuranVerseKey(hadith)).toBeNull();

    expect(readKnowledgeView('?view=knowledge&knowledgeView=unknown')).toBe('library');
    expect(readQuranVerseKey('?view=knowledge&knowledgeView=quran&ayah=not-an-ayah')).toBeNull();
  });

  it('clears Knowledge-specific state when leaving Knowledge', () => {
    const search = searchForCongregationDestination(
      '?view=knowledge&knowledgeView=quran&ayah=2%3A255&debug=1',
      'today',
    );
    const params = new URLSearchParams(search);
    expect(params.has('knowledgeView')).toBe(false);
    expect(params.has('ayah')).toBe(false);
    expect(params.get('debug')).toBe('1');
  });

  it('creates, reads and clears reloadable Settings category links', () => {
    for (const category of [
      'location',
      'prayer',
      'adhan',
      'display',
      'mosques',
      'privacy-data',
      'advanced',
    ] as const) {
      const search = searchForSettingsCategory('?view=settings&debug=1', category);
      expect(readCongregationDestination(search)).toBe('settings');
      expect(readSettingsCategory(search)).toBe(category);
      expect(new URLSearchParams(search).get('debug')).toBe('1');
    }

    const fromAdmin = searchForSettingsCategory(
      '?surface=admin&adminView=displays&debug=1',
      'display',
    );
    const adminParams = new URLSearchParams(fromAdmin);
    expect(readProductSurface(fromAdmin)).toBe('congregation');
    expect(readCongregationDestination(fromAdmin)).toBe('settings');
    expect(readSettingsCategory(fromAdmin)).toBe('display');
    expect(adminParams.get('view')).toBe('settings');
    expect(adminParams.get('settingsView')).toBe('display');
    expect(adminParams.has('surface')).toBe(false);
    expect(adminParams.has('adminView')).toBe(false);
    expect(adminParams.get('debug')).toBe('1');

    const cleared = searchForSettingsCategory('?view=settings&settingsView=prayer&debug=1', null);
    expect(readProductSurface(cleared)).toBe('congregation');
    expect(readCongregationDestination(cleared)).toBe('settings');
    expect(readSettingsCategory(cleared)).toBeNull();
    expect(new URLSearchParams(cleared).get('debug')).toBe('1');
    expect(readSettingsCategory('?view=settings&settingsView=unknown')).toBeNull();
  });

  it('migrates pre-Stage-8 Settings deep links into the seven canonical groups', () => {
    expect(readSettingsCategory('?view=settings&settingsView=mosque')).toBe('mosques');
    expect(readSettingsCategory('?view=settings&settingsView=notifications')).toBe('adhan');
    expect(readSettingsCategory('?view=settings&settingsView=appearance')).toBe('display');
    expect(readSettingsCategory('?view=settings&settingsView=display-themes')).toBe('display');
    expect(readSettingsCategory('?view=settings&settingsView=data-privacy')).toBe('privacy-data');
  });

  it('creates and reads every Stage 24 administration destination', () => {
    for (const destination of [
      'overview',
      'prayer-iqamah',
      'jumuah-ramadan',
      'community',
      'displays',
      'integrations',
      'members',
      'settings',
    ] as const) {
      const search = searchForAdminDestination(
        '?view=settings&settingsView=appearance&debug=1',
        destination,
      );
      const params = new URLSearchParams(search);
      expect(readProductSurface(search)).toBe('admin');
      expect(readAdminDestination(search)).toBe(destination);
      expect(params.get('debug')).toBe('1');
      expect(params.has('view')).toBe(false);
      expect(params.has('settingsView')).toBe(false);
    }
  });

  it('migrates legacy theme and remote administration deep links to Displays', () => {
    expect(readAdminDestination('?surface=admin&adminView=themes')).toBe('displays');
    expect(readAdminDestination('?surface=admin&adminView=remote')).toBe('displays');
  });

  it('defaults unknown administration destinations to Overview', () => {
    expect(readProductSurface('?surface=admin')).toBe('admin');
    expect(readAdminDestination('?surface=admin&adminView=unknown')).toBe('overview');
  });
});
