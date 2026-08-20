import { describe, expect, it } from 'vitest';

import {
  readAdminDestination,
  readCongregationDestination,
  readProductSurface,
  searchForAdminDestination,
  searchForCongregationDestination,
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
      '?surface=admin&adminView=remote&debug=1',
      'qiblah',
    );
    const params = new URLSearchParams(search);

    expect(params.get('view')).toBe('qiblah');
    expect(params.get('debug')).toBe('1');
    expect(params.has('surface')).toBe(false);
    expect(params.has('adminView')).toBe(false);
  });

  it('creates and reads managed-administration deep links', () => {
    const search = searchForAdminDestination('?view=settings&debug=1', 'themes');
    const params = new URLSearchParams(search);

    expect(readProductSurface(search)).toBe('admin');
    expect(readAdminDestination(search)).toBe('themes');
    expect(params.get('debug')).toBe('1');
    expect(params.has('view')).toBe(false);
  });

  it('defaults unknown administration destinations to Overview', () => {
    expect(readProductSurface('?surface=admin')).toBe('admin');
    expect(readAdminDestination('?surface=admin&adminView=unknown')).toBe('overview');
  });
});
