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
const applicationOrigin = new URL(baseUrl).origin;
const adminToken = 'a'.repeat(48);

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

function prayerBoardConfig() {
  return {
    version: 1,
    templateId: 'heritage-classic',
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: 'emerald',
    moduleVisibility: {
      'current-time': true,
      dates: true,
      'next-prayer': true,
      countdown: true,
      'prayer-timetable': true,
      jumuah: true,
      'sunrise-sunset': true,
      'mosque-branding': true,
      announcements: false,
      weather: false,
    },
    branding: { mosqueName: { en: 'Stage 24 Managed Masjid' }, logo: null },
    background: { kind: 'builtin', artworkId: 'geometric-heritage' },
  };
}

function displayStatus(revoked = false) {
  return {
    identity: {
      displayId: 'display:lobby',
      organizationId: 'org:example',
      mosqueId: 'mosque:example',
      locationId: 'location:lobby',
      orientation: 'landscape',
      resolutionProfile: '1920x1080',
      playlistId: null,
    },
    lastSeenAt: '2026-08-23T03:00:00.000Z',
    appVersion: '1.2.1',
    reportedContentRevision: 4,
    reportedPrayerBoardTemplateId: 'heritage-classic',
    syncState: 'current',
    remoteConfig: {
      displayId: 'display:lobby',
      contentRevision: 4,
      playlistId: null,
      displayTheme: 'emerald',
      prayerBoardConfig: prayerBoardConfig(),
      prayerBoardAssignment: 'mosque-default',
      revoked,
      updatedAt: '2026-08-23T03:00:00.000Z',
    },
  };
}

function corsHeaders() {
  return {
    'access-control-allow-origin': applicationOrigin,
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
  };
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders(),
    body: JSON.stringify(body),
  });
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
});
const page = await context.newPage();
let revokeRequests = 0;
let revoked = false;
let dismissedConfirmation = '';
let acceptedConfirmation = '';

await page.addInitScript((persistedSettings) => {
  localStorage.setItem('salahos.settings', persistedSettings);
}, JSON.stringify(settings()));

await page.route('**/v1/**', async (route) => {
  const request = route.request();
  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders(), body: '' });
    return;
  }
  if (request.headers().authorization !== `Bearer ${adminToken}`) {
    await fulfillJson(route, { error: 'Not authorized' }, 401);
    return;
  }

  const url = new URL(request.url());
  if (url.pathname === '/v1/admin/displays' && request.method() === 'GET') {
    await fulfillJson(route, { displays: [displayStatus(revoked)] });
    return;
  }
  if (url.pathname === '/v1/admin/mosque-defaults' && request.method() === 'GET') {
    await fulfillJson(route, { defaults: [] });
    return;
  }
  if (
    url.pathname === '/v1/admin/displays/display%3Alobby/revoke' &&
    request.method() === 'POST'
  ) {
    revokeRequests += 1;
    revoked = true;
    await fulfillJson(route, displayStatus(true));
    return;
  }
  await fulfillJson(route, { error: 'Not found' }, 404);
});

try {
  await page.goto(`${baseUrl}/?surface=admin&adminView=displays`, { waitUntil: 'networkidle' });
  const adminPanel = page.locator('.remote-display-admin-panel');
  await adminPanel.waitFor({ state: 'visible' });
  await adminPanel.getByLabel('Managed service URL').fill(applicationOrigin);
  await adminPanel.getByLabel('Admin token').fill(adminToken);
  await adminPanel.getByRole('button', { name: 'Connect / refresh fleet' }).click();

  const revokeButton = adminPanel.getByRole('button', { name: 'Revoke' });
  await revokeButton.waitFor({ state: 'visible' });
  await page.waitForFunction(() =>
    document
      .querySelector('.remote-display-card__actions button')
      ?.classList.contains('ds-button--destructive'),
  );

  page.once('dialog', async (dialog) => {
    dismissedConfirmation = dialog.message();
    await dialog.dismiss();
  });
  await revokeButton.click();
  if (revokeRequests !== 0) {
    throw new Error('dismissed destructive confirmation still sent a revoke request');
  }
  if (!dismissedConfirmation.includes('Revoke this display?')) {
    throw new Error(`unexpected revoke confirmation copy: ${dismissedConfirmation}`);
  }

  page.once('dialog', async (dialog) => {
    acceptedConfirmation = dialog.message();
    await dialog.accept();
  });
  await revokeButton.click();
  await page.waitForFunction(
    () => document.querySelector('.remote-display-card__actions button')?.disabled,
  );
  if (revokeRequests !== 1 || !revoked) {
    throw new Error(`accepted destructive confirmation sent ${String(revokeRequests)} requests`);
  }
  if (acceptedConfirmation !== dismissedConfirmation) {
    throw new Error('destructive confirmation copy changed between attempts');
  }

  await page.screenshot({
    path: path.join(artifactDirectory, 'admin-destructive-confirmation-en.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await writeFile(
    path.join(artifactDirectory, 'admin-destructive-confirmation-results.json'),
    `${JSON.stringify(
      {
        destructiveClass: true,
        dismissedRequestCount: 0,
        acceptedRequestCount: revokeRequests,
        confirmation: acceptedConfirmation,
      },
      null,
      2,
    )}\n`,
  );
  console.log('Stage 24 destructive admin confirmation acceptance passed.');
} finally {
  await context.close();
  await browser.close();
}
