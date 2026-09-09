import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(playwrightModule).href);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function settings(location = null) {
  return {
    version: 2,
    locale: 'en',
    theme: 'light',
    palette: 'salah-classic',
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: 'calculated',
    location,
    mosqueTimetable: null,
    notifications: {},
  };
}

async function seed(page, persisted) {
  await page.addInitScript((value) => {
    localStorage.setItem('salahos.settings', JSON.stringify(value));
  }, persisted);
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, settings(null));
    await page.goto(`${baseUrl}/?view=mosques`, { waitUntil: 'networkidle' });

    const directory = page.locator('.australian-mosque-directory');
    await directory.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      return (
        document
          .querySelector('.australian-mosque-directory')
          ?.getAttribute('data-directory-record-count') === '254'
      );
    });

    const nearest = directory.getByRole('button', { name: 'Nearest first' });
    assert(await nearest.isDisabled(), 'Nearest-first remained enabled without a saved location');
    const privacyText =
      (await directory.locator('.australian-mosque-directory__privacy-note').textContent()) ?? '';
    assert(
      privacyText.trim().length > 0,
      'Mosque directory did not explain why nearest-first is unavailable without location',
    );

    const search = directory.locator('input[type="search"]');
    await search.fill('zzzz-no-such-mosque-v160');
    await directory.locator('.mosques-screen__empty').waitFor({ state: 'visible' });
    const countText =
      (await directory.locator('.australian-mosque-directory__result-count').textContent()) ?? '';
    assert(/^\s*0\b/u.test(countText), `No-match search did not report zero results: ${countText}`);

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Mosque no-location/no-match state overflowed mobile viewport: ${String(metrics.scrollWidth)} > ${String(metrics.innerWidth)}`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'v160-ui08-mosque-no-location-empty.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'mosque-no-location-no-match', ...metrics });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, settings(null));
    await page.goto(`${baseUrl}/?view=settings`, { waitUntil: 'networkidle' });

    const settingsScreen = page.locator('.settings-screen');
    await settingsScreen.waitFor({ state: 'visible' });
    await settingsScreen.getByRole('button', { name: /Privacy & data/u }).click();
    await page.waitForFunction(
      () => new URLSearchParams(location.search).get('settingsView') === 'privacy-data',
    );

    const payload = page.locator('.settings-data-panel textarea');
    await payload.waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Export settings' }).click();
    const exported = await payload.inputValue();
    assert(
      exported.includes('"version":2'),
      'Settings export did not expose the persisted settings payload',
    );
    await page.getByRole('button', { name: 'Import settings' }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Reset to defaults' }).waitFor({ state: 'visible' });

    await page.getByRole('button', { name: 'All settings' }).click();
    await settingsScreen.getByRole('button', { name: /Adhan/u }).click();
    await page.waitForFunction(
      () => new URLSearchParams(location.search).get('settingsView') === 'adhan',
    );
    await page.locator('.notification-fieldset').first().waitFor({ state: 'visible' });
    const onboarding = page.locator('.notification-onboarding-settings-entry');
    await onboarding.waitFor({ state: 'visible' });
    await onboarding.getByRole('button', { name: 'Review notification setup' }).waitFor({
      state: 'visible',
    });

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      settingsView: new URLSearchParams(location.search).get('settingsView'),
    }));
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Settings discoverability state overflowed mobile viewport: ${String(metrics.scrollWidth)} > ${String(metrics.innerWidth)}`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'v160-ui08-settings-notifications.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'settings-import-export-notifications', ...metrics });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'v160-ui08-results.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(JSON.stringify(results, null, 2));
