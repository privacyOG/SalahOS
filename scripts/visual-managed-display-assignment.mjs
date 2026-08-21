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
const managedOrigin = applicationOrigin;
const adminToken = 'a'.repeat(48);
const deviceToken = 'd'.repeat(48);

function settingsFor(locale = 'en') {
  return {
    version: 2,
    locale,
    theme: locale === 'ar' ? 'dark' : 'light',
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

function board(templateId, accentPreset = 'neutral', mosqueName = 'Stage 23 Managed Masjid') {
  const artwork = {
    'heritage-classic': 'geometric-heritage',
    'minimal-modern': 'quiet-grid',
    'bold-countdown-focus': 'countdown-field',
    'structured-split-board': 'structured-lines',
    'scenic-spiritual': 'scenic-gradient',
    'family-classroom': 'classroom-pattern',
  }[templateId];
  return {
    version: 1,
    templateId,
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset,
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
    branding: { mosqueName: { en: mosqueName }, logo: null },
    background: { kind: 'builtin', artworkId: artwork },
  };
}

function status({
  displayId = 'display:lobby',
  orientation = 'landscape',
  resolutionProfile = '1920x1080',
  revision = 4,
  reportedRevision = 4,
  config = board('heritage-classic', 'emerald'),
  assignment = 'mosque-default',
  reportedTemplate = 'heritage-classic',
} = {}) {
  return {
    identity: {
      displayId,
      organizationId: 'org:example',
      mosqueId: 'mosque:example',
      locationId: `location:${displayId.split(':')[1]}`,
      orientation,
      resolutionProfile,
      playlistId: null,
    },
    lastSeenAt: '2026-08-22T00:00:00.000Z',
    appVersion: '1.2.0',
    reportedContentRevision: reportedRevision,
    reportedPrayerBoardTemplateId: reportedTemplate,
    syncState: reportedRevision === revision ? 'current' : 'syncing',
    remoteConfig: {
      displayId,
      contentRevision: revision,
      playlistId: null,
      displayTheme:
        config.accentPreset === 'midnight'
          ? 'midnight'
          : config.accentPreset === 'sandstone'
            ? 'sandstone'
            : config.accentPreset === 'neutral'
              ? 'classic'
              : 'emerald',
      prayerBoardConfig: config,
      prayerBoardAssignment: assignment,
      revoked: false,
      updatedAt: '2026-08-22T00:00:00.000Z',
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

async function fulfillJson(route, body, statusCode = 200) {
  await route.fulfill({
    status: statusCode,
    contentType: 'application/json',
    headers: corsHeaders(),
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function fulfillPreflight(route) {
  await route.fulfill({
    status: 204,
    headers: corsHeaders(),
    body: '',
  });
}

async function seed(page, { locale = 'en', connection = false, draft = null } = {}) {
  await page.addInitScript(
    ({ serializedSettings, serializedConnection, serializedDraft }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      if (serializedConnection !== null) {
        localStorage.setItem('salahos.managedDisplayConnection', serializedConnection);
      }
      if (
        serializedDraft !== null &&
        localStorage.getItem('salahos.prayerBoardDisplayConfig') === null
      ) {
        localStorage.setItem('salahos.prayerBoardDisplayConfig', serializedDraft);
      }
    },
    {
      serializedSettings: JSON.stringify(settingsFor(locale)),
      serializedConnection: connection
        ? JSON.stringify({
            version: 1,
            connection: {
              baseUrl: managedOrigin,
              displayId: 'display:lobby',
              deviceToken,
            },
          })
        : null,
      serializedDraft: draft === null ? null : JSON.stringify(draft),
    },
  );
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function validateAdminAssignment(browser) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const draft = board('minimal-modern', 'neutral');
  let lobby = status();
  const foyer = status({
    displayId: 'display:foyer',
    orientation: 'portrait',
    resolutionProfile: '1080x1920',
    revision: 0,
    reportedRevision: 0,
    assignment: 'service-default',
  });
  let publishedBody = null;

  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await fulfillPreflight(route);
      return;
    }
    const url = new URL(request.url());
    const authorization = request.headers().authorization;
    if (authorization !== `Bearer ${adminToken}`) {
      await fulfillJson(route, '{"error":"Not authorized"}', 401);
      return;
    }

    if (url.pathname === '/v1/admin/displays' && request.method() === 'GET') {
      await fulfillJson(route, { displays: [lobby, foyer] });
      return;
    }
    if (url.pathname === '/v1/admin/mosque-defaults' && request.method() === 'GET') {
      await fulfillJson(route, { defaults: [] });
      return;
    }
    if (
      url.pathname === '/v1/admin/displays/display%3Alobby/config' &&
      request.method() === 'PUT'
    ) {
      publishedBody = request.postDataJSON();
      lobby = status({
        revision: 5,
        reportedRevision: 4,
        config: publishedBody.prayerBoardConfig,
        assignment: 'display-override',
        reportedTemplate: 'heritage-classic',
      });
      await fulfillJson(route, lobby);
      return;
    }
    await fulfillJson(route, '{"error":"Not found"}', 404);
  });

  try {
    await seed(page, { draft });
    await page.goto(`${baseUrl}/?surface=admin&adminView=remote`, { waitUntil: 'networkidle' });
    await page.locator('.remote-display-admin-panel').waitFor({ state: 'visible' });
    await page.getByLabel('Managed service URL').fill(managedOrigin);
    await page.getByLabel('Admin token').fill(adminToken);
    await page.getByRole('button', { name: 'Connect / refresh fleet' }).click();
    await page.waitForFunction(() => {
      const fleetCard = document.querySelector('.remote-display-card');
      const statusText =
        document.querySelector('.remote-display-admin-panel__status')?.textContent ?? '';
      return fleetCard !== null || statusText.includes('failed');
    });
    if ((await page.locator('.remote-display-card').count()) === 0) {
      const statusText = await page.locator('.remote-display-admin-panel__status').textContent();
      throw new Error(`managed fleet did not load: ${statusText ?? 'unknown status'}`);
    }

    if ((await page.locator('.remote-display-card').count()) !== 2) {
      throw new Error('managed fleet did not render both target profiles');
    }
    const publish = page.getByRole('button', { name: 'Publish display override' }).first();
    if (!(await publish.isDisabled())) {
      throw new Error('managed publication must be disabled before exact target preview');
    }
    const blockedCard = page.locator('.remote-display-card').nth(1);
    if ((await blockedCard.locator('[data-compatible="false"]').count()) !== 1) {
      throw new Error('portrait target was not visibly blocked from prayer-board publication');
    }

    await capture(page, 'managed-display-assignment-fleet-en');

    await page.getByRole('button', { name: 'Preview draft on target' }).first().click();
    const preview = page.locator('.managed-target-preview');
    await preview.waitFor({ state: 'visible' });
    if (
      (await preview.getAttribute('data-target-width')) !== '1920' ||
      (await preview.getAttribute('data-target-height')) !== '1080'
    ) {
      throw new Error('exact managed target preview did not resolve 1920x1080');
    }
    if ((await preview.locator('[data-prayer-board-template="minimal-modern"]').count()) !== 1) {
      throw new Error('managed target preview did not render the configured prayer-board template');
    }
    await capture(page, 'managed-display-assignment-preview-1080p-en');
    await page.getByRole('button', { name: 'Close preview' }).click();

    if (await publish.isDisabled()) {
      throw new Error('managed publication did not unlock after exact target preview');
    }
    await publish.click();
    await page.getByText('Managed prayer-board revision published.').waitFor({ state: 'visible' });

    if (
      publishedBody?.expectedRevision !== 4 ||
      publishedBody?.contentRevision !== 5 ||
      publishedBody?.prayerBoardConfig?.templateId !== 'minimal-modern'
    ) {
      throw new Error(`managed publication body was incorrect: ${JSON.stringify(publishedBody)}`);
    }
    if (!(await page.locator('body').textContent()).includes('Display override')) {
      throw new Error('fleet did not show the published display-override source');
    }
    if (errors.length > 0) throw new Error(`managed admin page errors: ${errors.join(' | ')}`);

    await capture(page, 'managed-display-assignment-published-en');
    return { target: '1920x1080', publishedTemplate: 'minimal-modern', blockedPortrait: true };
  } finally {
    await context.close();
  }
}

async function validateManagedOfflineCache(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const managedConfig = board('family-classroom', 'emerald', 'Managed Offline Masjid');
  let offline = false;

  await page.route('**/v1/**', async (route) => {
    if (offline) {
      await route.abort('failed');
      return;
    }
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await fulfillPreflight(route);
      return;
    }
    const url = new URL(request.url());
    if (request.headers().authorization !== `Bearer ${deviceToken}`) {
      await fulfillJson(route, '{"error":"Not authorized"}', 401);
      return;
    }
    if (url.pathname === '/v1/device/config' && request.method() === 'GET') {
      await fulfillJson(
        route,
        status({
          revision: 7,
          reportedRevision: 6,
          config: managedConfig,
          assignment: 'display-override',
          reportedTemplate: 'minimal-modern',
        }).remoteConfig,
      );
      return;
    }
    if (url.pathname === '/v1/device/heartbeat' && request.method() === 'POST') {
      const heartbeat = request.postDataJSON();
      await fulfillJson(
        route,
        status({
          revision: 7,
          reportedRevision: heartbeat.contentRevision,
          config: managedConfig,
          assignment: 'display-override',
          reportedTemplate: heartbeat.prayerBoardTemplateId,
        }),
      );
      return;
    }
    await fulfillJson(route, '{"error":"Not found"}', 404);
  });

  try {
    await seed(page, { connection: true });
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const display = page.locator('.smart-display');
    await display.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const root = document.querySelector('.smart-display');
      return (
        root?.getAttribute('data-managed-prayer-board') === 'on' &&
        root?.getAttribute('data-display-template') === 'family-classroom'
      );
    });

    const cached = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.managedPrayerBoardCache');
      return raw === null ? null : JSON.parse(raw);
    });
    if (cached?.contentRevision !== 7 || cached?.config?.templateId !== 'family-classroom') {
      throw new Error(`managed known-good cache was not persisted: ${JSON.stringify(cached)}`);
    }
    await capture(page, 'managed-display-assignment-device-online-en');

    offline = true;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.smart-display').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const root = document.querySelector('.smart-display');
      return (
        root?.getAttribute('data-managed-prayer-board') === 'on' &&
        root?.getAttribute('data-display-template') === 'family-classroom'
      );
    });
    await page.locator('.managed-display-remote-status[data-state="offline"]').waitFor({
      state: 'visible',
    });
    if (!(await page.locator('body').textContent()).includes('Managed Offline Masjid')) {
      throw new Error('offline managed display did not preserve cached mosque branding');
    }
    if (errors.length > 0) throw new Error(`managed device page errors: ${errors.join(' | ')}`);

    await capture(page, 'managed-display-assignment-device-offline-cache-en');
    return { cachedRevision: 7, cachedTemplate: 'family-classroom', offlineFallback: true };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await validateAdminAssignment(browser),
    await validateManagedOfflineCache(browser),
  ];
  await writeFile(
    path.join(artifactDirectory, 'managed-display-assignment-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Managed display assignment visual checks passed: ${results.length} flows`);
} finally {
  await browser.close();
}
