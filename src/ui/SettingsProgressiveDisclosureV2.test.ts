import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsSource = readFileSync(new URL('./SettingsScreen.tsx', import.meta.url), 'utf8');
const settingsStyles = readFileSync(new URL('../settings-screen.css', import.meta.url), 'utf8');

describe('Stage 22.6 Settings progressive disclosure', () => {
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

  it('keeps manual mosque authoring and timetable import out of ordinary mosque settings', () => {
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='mosque'] .manual-mosque-fieldset",
    );
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='mosque'] .mosque-import-grid",
    );
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='mosque'] .mosque-import-payload",
    );
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='mosque'] .mosque-library-controls > button",
    );
  });

  it('limits Advanced to uncommon timetable and prayer-offset workflows', () => {
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='advanced'] .mosque-library-row",
    );
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='advanced'] .notification-fieldset",
    );
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='advanced'] .settings-transfer",
    );
    expect(settingsStyles).not.toContain(
      ".settings-screen__legacy[data-settings-category='advanced'] .manual-mosque-fieldset",
    );
    expect(settingsStyles).not.toContain(
      ".settings-screen__legacy[data-settings-category='advanced'] .offsets-fieldset,",
    );
  });

  it('keeps settings export/import and notification controls owned by their focused categories', () => {
    expect(settingsSource).toContain("category === 'data-privacy'");
    expect(settingsSource).toContain("category === 'notifications'");
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='notifications'] .mosque-library-controls",
    );
    expect(settingsStyles).toContain(
      ".settings-screen__legacy[data-settings-category='notifications'] .settings-transfer",
    );
  });
});
