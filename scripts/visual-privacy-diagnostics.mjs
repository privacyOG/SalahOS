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
const diagnosticsKey = 'salahos.privacyDiagnostics';

function settings() {
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

async function seed(page) {
  await page.addInitScript(
    ({ serializedSettings }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem(
        'salahos.qiblaPermissionOnboarding',
        JSON.stringify({ version: 2, dismissed: true, autoLocation: false }),
      );
      localStorage.removeItem('salahos.privacyDiagnostics');
    },
    { serializedSettings: JSON.stringify(settings()) },
  );
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

async function validatePrivacyDiagnostics(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const remoteRequests = [];
  const applicationOrigin = new URL(baseUrl).origin;

  page.on('request', (request) => {
    const requestUrl = request.url();
    if (new URL(requestUrl).origin !== applicationOrigin) remoteRequests.push(requestUrl);
  });

  try {
    await seed(page);
    await page.goto(`${baseUrl}/?view=settings&settingsView=data-privacy`, {
      waitUntil: 'networkidle',
    });

    const toggle = page.locator('[data-privacy-diagnostics-toggle]');
    await toggle.waitFor({ state: 'visible' });
    if (await toggle.isChecked()) throw new Error('diagnostics were enabled by default');
    if ((await page.evaluate((key) => localStorage.getItem(key), diagnosticsKey)) !== null) {
      throw new Error('disabled diagnostics wrote storage before explicit enablement');
    }

    await page.evaluate(() => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error(
            'before-enable https://example.test/?latitude=-33.8688&longitude=151.2093',
          ),
        }),
      );
    });
    if ((await page.evaluate((key) => localStorage.getItem(key), diagnosticsKey)) !== null) {
      throw new Error('diagnostics recorded a crash while disabled');
    }

    const remoteBeforeEnable = remoteRequests.length;
    await toggle.check();
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      const error = new TypeError(
        'private-message https://example.test/?latitude=-33.8688&longitude=151.2093',
      );
      error.stack =
        'TypeError: private-message at https://example.test/app.js?latitude=-33.8688&longitude=151.2093:1:1';
      window.dispatchEvent(new ErrorEvent('error', { error }));
    });

    const stored =
      (await page.evaluate((key) => localStorage.getItem(key), diagnosticsKey)) ?? '';
    if (!stored.includes('"enabled":true')) throw new Error('diagnostics enablement was not persisted');
    for (const forbidden of ['private-message', 'example.test', '-33.8688', '151.2093']) {
      if (stored.includes(forbidden)) {
        throw new Error(`diagnostics persistence leaked forbidden value: ${forbidden}`);
      }
    }

    await page.getByRole('button', { name: 'Prepare diagnostics export' }).click();
    const exported = await page.locator('[data-privacy-diagnostics-export]').inputValue();
    for (const expected of [
      '"preciseLocationIncluded": false',
      '"urlsIncluded": false',
      '"rawErrorMessagesIncluded": false',
      '"rawStacksIncluded": false',
      '"automaticUpload": false',
    ]) {
      if (!exported.includes(expected)) throw new Error(`diagnostics export missed ${expected}`);
    }
    for (const forbidden of ['private-message', 'example.test', '-33.8688', '151.2093']) {
      if (exported.includes(forbidden)) {
        throw new Error(`diagnostics export leaked forbidden value: ${forbidden}`);
      }
    }
    if (remoteRequests.length !== remoteBeforeEnable) {
      throw new Error(
        `diagnostics triggered an implicit remote request: ${remoteRequests.slice(remoteBeforeEnable).join(', ')}`,
      );
    }

    await capture(page, 'privacy-diagnostics-mobile-en');

    await page.getByRole('button', { name: 'Clear diagnostics' }).click();
    const cleared = await page.evaluate((key) => localStorage.getItem(key), diagnosticsKey);
    if (cleared === null || !cleared.includes('"events":[]')) {
      throw new Error('diagnostics clear did not empty the local event buffer');
    }

    await page.reload({ waitUntil: 'networkidle' });
    const reloadedToggle = page.locator('[data-privacy-diagnostics-toggle]');
    await reloadedToggle.waitFor({ state: 'visible' });
    if (!(await reloadedToggle.isChecked())) {
      throw new Error('diagnostics explicit enablement did not survive reload');
    }

    return {
      defaultEnabled: false,
      rawSensitiveDataPersisted: false,
      automaticUploadRequests: 0,
      explicitEnablementPersisted: true,
      clearSupported: true,
    };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const result = await validatePrivacyDiagnostics(browser);
  await writeFile(
    path.join(artifactDirectory, 'privacy-diagnostics-results.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log('Privacy diagnostics visual acceptance passed.');
} finally {
  await browser.close();
}
