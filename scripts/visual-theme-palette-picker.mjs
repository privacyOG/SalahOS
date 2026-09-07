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

function settings(locale, theme, palette) {
  return {
    version: 2,
    locale,
    theme,
    palette,
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: 'calculated',
    location: null,
    mosqueTimetable: null,
    notifications: {},
  };
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const fixture of [
    { locale: 'en', theme: 'light', viewport: { width: 390, height: 844 } },
    { locale: 'ar', theme: 'dark', viewport: { width: 360, height: 780 } },
  ]) {
    const context = await browser.newContext({
      viewport: fixture.viewport,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.addInitScript(
      (value) => {
        localStorage.setItem('salahos.settings', JSON.stringify(value));
      },
      settings(fixture.locale, fixture.theme, 'royal-blue'),
    );
    await page.goto(`${baseUrl}/?view=settings&settings=display`, { waitUntil: 'networkidle' });

    const picker = page.locator('[data-theme-palette-picker]');
    await picker.waitFor({ state: 'visible' });
    const options = picker.locator('[data-theme-palette-option]');
    assert((await options.count()) === 10, 'Palette picker did not render all ten palettes');
    assert(
      (await picker
        .locator('[data-theme-palette-option="royal-blue"]')
        .getAttribute('aria-checked')) === 'true',
      'Persisted Light Blue palette was not selected',
    );

    const reset = picker.locator('[data-theme-palette-reset]');
    await reset.click();
    await page.waitForFunction(() => document.documentElement.dataset.palette === 'salah-classic');
    assert(
      (await picker
        .locator('[data-theme-palette-option="salah-classic"]')
        .getAttribute('aria-checked')) === 'true',
      'Reset did not return the palette to Standard',
    );
    assert(
      (await page.locator('html').getAttribute('data-theme')) === fixture.theme,
      'Palette reset changed the independent appearance mode',
    );

    const metrics = await page.evaluate(() => ({
      dir: document.documentElement.dir,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Palette picker caused horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );
    if (fixture.locale === 'ar') {
      assert(metrics.dir === 'rtl', 'Arabic palette fixture did not retain RTL');
    }

    await page.screenshot({
      path: path.join(
        artifactDirectory,
        `v160-theme-palette-picker-${fixture.locale}-${fixture.theme}.png`,
      ),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ ...fixture, ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'v160-theme-palette-picker-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`V1.6.0 palette picker acceptance passed: ${String(results.length)} fixtures.`);
} finally {
  await browser.close();
}
