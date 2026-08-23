import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsSource = readFileSync(new URL('./SettingsScreen.tsx', import.meta.url), 'utf8');
const migrationSource = readFileSync(new URL('./SettingsMigrationPanels.tsx', import.meta.url), 'utf8');
const settingsStyles = readFileSync(new URL('../settings-screen.css', import.meta.url), 'utf8');

function sourceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('Settings progressive disclosure and Stage 27 ownership', () => {
  it('keeps the eight category destinations explicit and reloadable', () => {
    for (const category of [
      'prayer',
      'location',
      'mosque',
      'notifications',
      'appearance',
      'data-privacy',
      'display-themes',
      'advanced',
    ]) {
      expect(settingsSource).toContain(`id: '${category}'`);
    }
    expect(settingsSource).toContain('readSettingsCategory(window.location.search)');
    expect(settingsSource).toContain('searchForSettingsCategory(window.location.search, category)');
  });

  it('owns mosque selection directly without manual authoring or timetable import', () => {
    const mosquePanel = sourceBetween(
      migrationSource,
      'export function MosqueIqamahSettingsPanel',
      'export function AdvancedPrayerSettingsPanel',
    );

    expect(settingsSource).toContain("category === 'mosque'");
    expect(settingsSource).toContain('<MosqueIqamahSettingsPanel');
    expect(mosquePanel).toContain('mosque-library-row');
    expect(mosquePanel).toContain('selectMosqueTimetable');
    expect(mosquePanel).not.toContain('manual-mosque-fieldset');
    expect(mosquePanel).not.toContain('mosque-import-grid');
    expect(mosquePanel).not.toContain('importMosqueTimetable');
  });

  it('keeps manual timetable authoring, import and prayer offsets in Advanced only', () => {
    const advancedPanel = sourceBetween(
      migrationSource,
      'export function AdvancedPrayerSettingsPanel',
      'export type SettingsNotificationRuntime',
    );

    expect(settingsSource).toContain("category === 'advanced'");
    expect(settingsSource).toContain('<AdvancedPrayerSettingsPanel');
    expect(advancedPanel).toContain('manual-mosque-fieldset');
    expect(advancedPanel).toContain('mosque-import-grid');
    expect(advancedPanel).toContain('importMosqueTimetable');
    expect(advancedPanel).toContain('offsets-fieldset');
    expect(advancedPanel).toContain('updatePrayerOffset');
    expect(advancedPanel).not.toContain('notification-fieldset');
    expect(advancedPanel).not.toContain('settings-transfer');
  });

  it('keeps data transfer and notification controls owned by focused categories', () => {
    expect(settingsSource).toContain("category === 'data-privacy'");
    expect(settingsSource).toContain('settings-data-panel');
    expect(settingsSource).toContain("category === 'notifications'");
    expect(settingsSource).toContain('<NotificationAdhanSettingsPanel');
    expect(migrationSource).toContain('export function NotificationAdhanSettingsPanel');
    expect(migrationSource).toContain('notification-fieldset');
  });

  it('does not rely on legacy Settings wrappers or destination-hiding CSS', () => {
    expect(settingsSource).not.toContain("from '../App'");
    expect(settingsSource).not.toContain('<App />');
    expect(settingsSource).not.toContain('settings-screen__legacy');
    expect(settingsSource).not.toContain('legacy-core-route');
    expect(settingsStyles).not.toContain('settings-screen__legacy');
    expect(settingsStyles).not.toContain('data-settings-category');
    expect(settingsStyles).not.toContain('legacy-core-route');
  });
});
