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

function persistedSettings() {
  return {
    version: 2,
    locale: 'en',
    theme: 'light',
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: 'calculated',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

async function installOrientationMock(page, permissionApi) {
  await page.addInitScript(({ permissionApiEnabled }) => {
    globalThis.__salahosOrientationPermissionRequests = 0;
    class MockDeviceOrientationEvent extends Event {}
    if (permissionApiEnabled) {
      MockDeviceOrientationEvent.requestPermission = () => {
        globalThis.__salahosOrientationPermissionRequests += 1;
        return Promise.resolve('granted');
      };
    }
    globalThis.DeviceOrientationEvent = MockDeviceOrientationEvent;
  }, { permissionApiEnabled: permissionApi });
}

async function seedExistingInstall(page) {
  await page.addInitScript((settings) => {
    localStorage.setItem('salahos.settings', JSON.stringify(settings));
  }, persistedSettings());
}

async function emitSydneyAlignedHeading(page) {
  await page.evaluate(() => {
    const event = new Event('deviceorientationabsolute');
    Object.assign(event, { alpha: 82.5, absolute: true });
    window.dispatchEvent(event);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ['geolocation'],
      geolocation: { latitude: -33.8688, longitude: 151.2093, accuracy: 8 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await installOrientationMock(page, false);
    await seedExistingInstall(page);
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });

    const finder = page.locator('.qibla-finder');
    await finder.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const element = document.querySelector('.qibla-finder');
      return element?.getAttribute('data-location-state') === 'live';
    });
    await page.waitForFunction(() => {
      const element = document.querySelector('.qibla-finder');
      return element?.getAttribute('data-compass-state') === 'active';
    });
    await emitSydneyAlignedHeading(page);
    await page.locator('.qibla-heading-readout').waitFor({ state: 'visible' });
    await page.locator('.qibla-turn-guidance.is-aligned').waitFor({ state: 'visible' });

    const metrics = await finder.evaluate((element) => ({
      locationState: element.getAttribute('data-location-state'),
      compassState: element.getAttribute('data-compass-state'),
      coordinates: document.querySelector('.qibla-location-bar')?.textContent ?? '',
      warningCount: document.querySelectorAll('.qibla-warning').length,
      startCompassText: document.querySelector('.qibla-compass-actions')?.textContent ?? '',
    }));
    assert(metrics.locationState === 'live', 'Qiblah did not automatically acquire live location');
    assert(metrics.compassState === 'active', 'Qiblah did not automatically start the compass');
    assert(metrics.coordinates.includes('-33.86880'), 'Live latitude was not rendered');
    assert(metrics.warningCount === 0, 'Live Qiblah unexpectedly rendered a location warning');
    assert(
      /stop/i.test(metrics.startCompassText),
      'Compass control did not transition to the active/stop state',
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage44-qiblah-auto-live.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'auto-live-location-heading', ...metrics });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await installOrientationMock(page, false);
    await seedExistingInstall(page);
    await page.addInitScript(() => {
      const deniedError = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition(_success, failure) {
            failure(deniedError);
          },
          watchPosition(_success, failure) {
            failure(deniedError);
            return 1;
          },
          clearWatch() {},
        },
      });
    });
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });

    const finder = page.locator('.qibla-finder');
    await finder.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const element = document.querySelector('.qibla-finder');
      return element?.getAttribute('data-location-state') === 'error';
    });
    await page.waitForFunction(() => {
      const element = document.querySelector('.qibla-finder');
      return element?.getAttribute('data-compass-state') === 'active';
    });
    await emitSydneyAlignedHeading(page);
    await page.locator('.qibla-heading-readout').waitFor({ state: 'visible' });
    await page.locator('.qibla-warning').waitFor({ state: 'visible' });

    const metrics = await finder.evaluate((element) => ({
      locationState: element.getAttribute('data-location-state'),
      compassState: element.getAttribute('data-compass-state'),
      warning: document.querySelector('.qibla-warning')?.textContent ?? '',
      bearingVisible: document.querySelector('.qibla-bearing-summary') !== null,
    }));
    assert(metrics.locationState === 'error', 'Denied location did not enter the fallback state');
    assert(metrics.compassState === 'active', 'Saved-location compass fallback did not stay active');
    assert(metrics.bearingVisible, 'Saved-location Qiblah bearing disappeared after location denial');

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage44-qiblah-saved-fallback.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'saved-location-fallback', ...metrics });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ['geolocation'],
      geolocation: { latitude: -33.8688, longitude: 151.2093, accuracy: 8 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await installOrientationMock(page, true);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const dialog = page.locator('[data-qibla-permission-onboarding]');
    await dialog.waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Enable location & compass' }).click();
    await dialog.waitFor({ state: 'detached' });

    const onboardingState = await page.evaluate(() => ({
      stored: localStorage.getItem('salahos.qibla-permission-onboarding'),
      orientationPermissionRequests: globalThis.__salahosOrientationPermissionRequests,
    }));
    assert(
      onboardingState.stored === JSON.stringify({ version: 1, completed: true }),
      'First-run Qiblah permission completion was not persisted',
    );
    assert(
      onboardingState.orientationPermissionRequests >= 1,
      'First-run onboarding did not request browser orientation permission from the user gesture',
    );

    const qiblahNavigation = page.locator('.congregation-nav button').filter({ hasText: 'Qiblah' });
    await qiblahNavigation.click();
    const finder = page.locator('.qibla-finder');
    await finder.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const element = document.querySelector('.qibla-finder');
      return element?.getAttribute('data-location-state') === 'live';
    });
    await page.waitForFunction(() => {
      const element = document.querySelector('.qibla-finder');
      return element?.getAttribute('data-compass-state') === 'active';
    });
    await emitSydneyAlignedHeading(page);
    await page.locator('.qibla-heading-readout').waitFor({ state: 'visible' });

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage44-qiblah-first-run.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'first-run-permission-to-live-qiblah', ...onboardingState });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage44-qiblah-auto-live-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 44 automatic live Qiblah acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
