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
const deviceToken = 'd'.repeat(48);

function settingsFor() {
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

function board() {
  return {
    version: 1,
    templateId: 'family-classroom',
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
    branding: { mosqueName: { en: 'Managed Offline Masjid' }, logo: null },
    background: { kind: 'builtin', artworkId: 'classroom-pattern' },
  };
}

function status({ revision, reportedRevision, config }) {
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
    lastSeenAt: '2026-08-23T06:00:00.000Z',
    appVersion: '1.2.1',
    reportedContentRevision: reportedRevision,
    reportedPrayerBoardTemplateId: 'family-classroom',
    syncState: reportedRevision === revision ? 'current' : 'syncing',
    remoteConfig: {
      displayId: 'display:lobby',
      contentRevision: revision,
      playlistId: null,
      displayTheme: 'emerald',
      prayerBoardConfig: config,
      prayerBoardAssignment: 'display-override',
      revoked: false,
      updatedAt: '2026-08-23T06:00:00.000Z',
    },
  };
}

async function fulfillJson(route, body, statusCode = 200) {
  await route.fulfill({
    status: statusCode,
    contentType: 'application/json',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function seed(page) {
  await page.addInitScript(
    ({ serializedSettings, serializedConnection }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.managedDisplayConnection', serializedConnection);
    },
    {
      serializedSettings: JSON.stringify(settingsFor()),
      serializedConnection: JSON.stringify({
        version: 1,
        connection: {
          baseUrl,
          displayId: 'display:lobby',
          deviceToken,
        },
      }),
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

async function validateManagedOfflineCache(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const managedConfig = board();
  let offline = false;

  await page.route('**/v1/**', async (route) => {
    if (offline) {
      await route.abort('failed');
      return;
    }
    const request = route.request();
    const url = new URL(request.url());
    if (request.headers().authorization !== `Bearer ${deviceToken}`) {
      await fulfillJson(route, '{"error":"Not authorized"}', 401);
      return;
    }
    if (url.pathname === '/v1/device/config' && request.method() === 'GET') {
      await fulfillJson(
        route,
        status({ revision: 7, reportedRevision: 6, config: managedConfig }).remoteConfig,
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
        }),
      );
      return;
    }
    await fulfillJson(route, '{"error":"Not found"}', 404);
  });

  try {
    await seed(page);
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
    if (!(await page.locator('body').textContent()).includes('Managed Offline Masjid')) {
      throw new Error('online managed display did not render managed mosque branding');
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
  const result = await validateManagedOfflineCache(browser);
  await writeFile(
    path.join(artifactDirectory, 'managed-display-assignment-results.json'),
    `${JSON.stringify([result], null, 2)}\n`,
  );
  console.log('Managed display offline-cache visual check passed.');
} finally {
  await browser.close();
}
