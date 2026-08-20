import { describe, expect, it } from 'vitest';

import {
  readAdminDestination,
  readCongregationDestination,
  readProductSurface,
  readSettingsCategory,
  searchForAdminDestination,
  searchForCongregationDestination,
  searchForSettingsCategory,
} from './applicationRoute';

describe('applicationRoute', () => {
  it('defaults unknown and absent congregation destinations to Today', () => {
    expect(readProductSurface('')).toBe('congregation');
    expect(readCongregationDestination('')).toBe('today');
    expect(readCongregationDestination('?view=unknown')).toBe('today');
  });

  it('reads every supported congregation destination from a reloadable URL', () => {
    for (const destination of ['today', 'mosques', 'qiblah', 'community', 'settings'] as const) {
      expect(readCongregationDestination(`?view=${destination}`)).toBe(destination);
    }
  });

  it('creates congregation links while preserving unrelated query state', () => {
    const search = searchForCongregationDestination(
      '?surface=admin&adminView=remote&settingsView=prayer&debug=1',
      'qiblah',
    );
    const params = new URLSearchParams(search);

    expect(params.get('view')).toBe('qiblah');
    expect(params.get('debug')).toBe('1');
    expect(params.has('surface')).toBe(false);
    expect(params.has('adminView')).toBe(false);
    expect(params.has('settingsView')).toBe(false);
  });

  it('creates, reads and clears reloadable Settings category links', () => {
    for (const category of [
      'prayer',
      'location',
      'mosque',
      'notifications',
      'appearance',
      'data-privacy',
      'display-themes',
      'advanced',
    ] as const) {
      const search = searchForSettingsCategory('?view=settings&debug=1', category);
      expect(readCongregationDestination(search)).toBe('settings');
      expect(readSettingsCategory(search)).toBe(category);
      expect(new URLSearchParams(search).get('debug')).toBe('1');
    }

    const fromAdmin = searchForSettingsCategory(
      '?surface=admin&adminView=remote&debug=1',
      'appearance',
    );
    const adminParams = new URLSearchParams(fromAdmin);
    expect(readProductSurface(fromAdmin)).toBe('congregation');
    expect(readCongregationDestination(fromAdmin)).toBe('settings');
    expect(readSettingsCategory(fromAdmin)).toBe('appearance');
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

  it('creates and reads managed-administration deep links', () => {
    const search = searchForAdminDestination(
      '?view=settings&settingsView=appearance&debug=1',
      'themes',
    );
    const params = new URLSearchParams(search);

    expect(readProductSurface(search)).toBe('admin');
    expect(readAdminDestination(search)).toBe('themes');
    expect(params.get('debug')).toBe('1');
    expect(params.has('view')).toBe(false);
    expect(params.has('settingsView')).toBe(false);
  });

  it('defaults unknown administration destinations to Overview', () => {
    expect(readProductSurface('?surface=admin')).toBe('admin');
    expect(readAdminDestination('?surface=admin&adminView=unknown')).toBe('overview');
  });
});
