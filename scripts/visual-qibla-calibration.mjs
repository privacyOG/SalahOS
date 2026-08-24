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

async function seedExistingInstall(page) {
  await page.addInitScript((settings) => {
    localStorage.setItem('salahos.settings', JSON.stringify(settings));
    localStorage.setItem(
      'salahos.qibla-permission-onboarding',
      JSON.stringify({ version: 1, completed: true }),
    );
  }, persistedSettings());
}

async function installOrientationMock(page, permissionResult = null) {
  await page.addInitScript(({ result }) => {
    class MockDeviceOrientationEvent extends Event {}
    if (result !== null) {
      MockDeviceOrientationEvent.requestPermission = () => Promise.resolve(result);
    }
    globalThis.DeviceOrientationEvent = MockDeviceOrientationEvent;
  }, { result: permissionResult });
}

async function emitHeading(page, accuracyDegrees) {
  await page.evaluate((accuracy) => {
    const event = new Event('deviceorientationabsolute');
    Object.assign(event, {
      alpha: null,
      absolute: true,
      webkitCompassHeading: 82.5,
      webkitCompassAccuracy: accuracy,
    });
    window.dispatchEvent(event);
  }, accuracyDegrees);
}

async function waitForCompassState(page, state) {
  await page.waitForFunction((expected) => {
    return document.querySelector('.qibla-finder')?.getAttribute('data-compass-state') === expected;
  }, state);
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
    await installOrientationMock(page);
    await seedExistingInstall(page);
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
    await waitForCompassState(page, 'active');

    await emitHeading(page, 38);
    const dialog = page.locator('[data-qibla-calibration-dialog]');
    await dialog.waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: 'Compass accuracy is low' }).waitFor();
    assert(
      (await page.locator('[data-qibla-calibration-state="prompt"]').count()) === 1,
      'Poor compass accuracy did not trigger the recalibration prompt',
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage45-qiblah-calibration-prompt.png'),
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByRole('button', { name: 'Start recalibration' }).click();
    await page.getByRole('heading', { name: 'Recalibrate your compass' }).waitFor();
    await waitForCompassState(page, 'active');
    await emitHeading(page, 8);
    await page.getByRole('heading', { name: 'Compass accuracy improved' }).waitFor();

    const success = await page.locator('[data-qibla-calibration-state="success"]').evaluate((element) => ({
      needed: element.getAttribute('data-qibla-calibration-needed'),
      text: element.textContent ?? '',
    }));
    assert(success.needed === 'false', 'Fresh accurate heading did not clear calibration-needed state');
    assert(success.text.includes('±8°'), 'Recalibration success did not report the fresh accuracy');

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage45-qiblah-calibration-success.png'),
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Recalibrate compass' }).click();
    await page.getByRole('heading', { name: 'Recalibrate your compass' }).waitFor();
    await waitForCompassState(page, 'active');
    await emitHeading(page, 7);
    await page.getByRole('heading', { name: 'Compass accuracy improved' }).waitFor();
    results.push({ name: 'poor-accuracy-prompt-manual-recalibration-success', ...success });
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
    await installOrientationMock(page, 'denied');
    await seedExistingInstall(page);
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
    await waitForCompassState(page, 'denied');

    const denied = await page.locator('.qibla-guidance-column').evaluate((element) => ({
      text: element.textContent ?? '',
      recalibrateDisabled: element.querySelector('.qibla-recalibration-control button')?.disabled ?? false,
    }));
    assert(denied.recalibrateDisabled, 'Recalibration remained enabled after compass permission denial');
    assert(denied.text.includes('Compass access was denied'), 'Denied compass fallback was not visible');
    results.push({ name: 'denied-compass-fallback', ...denied });
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
    await page.addInitScript(() => {
      Reflect.deleteProperty(globalThis, 'DeviceOrientationEvent');
    });
    await seedExistingInstall(page);
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
    await waitForCompassState(page, 'unsupported');

    const unsupported = await page.locator('.qibla-guidance-column').evaluate((element) => ({
      text: element.textContent ?? '',
      recalibrateDisabled: element.querySelector('.qibla-recalibration-control button')?.disabled ?? false,
    }));
    assert(
      unsupported.recalibrateDisabled,
      'Recalibration remained enabled on a device without compass support',
    );
    assert(unsupported.text.includes('no usable compass sensor'), 'Unsupported compass fallback was not visible');
    results.push({ name: 'unsupported-compass-fallback', ...unsupported });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage45-qiblah-calibration-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 45 Qiblah compass recalibration acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
