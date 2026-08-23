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
const fixtureOrigin = 'https://stage24-themes.fixture.invalid';
const fixtureToken = 'stage24-theme-fixture-token'.padEnd(48, 'x');

function settings(locale) {
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

function board(
  templateId = 'heritage-classic',
  artworkId = 'geometric-heritage',
  mosqueName = 'Stage 24 Masjid',
) {
  return {
    version: 1,
    templateId,
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
    branding: { mosqueName: { en: mosqueName }, logo: null },
    background: { kind: 'builtin', artworkId },
  };
}

function displayTheme(config) {
  if (config.accentPreset === 'midnight') return 'midnight';
  if (config.accentPreset === 'sandstone') return 'sandstone';
  if (config.accentPreset === 'neutral') return 'classic';
  return 'emerald';
}

function displayStatus({
  displayId,
  resolutionProfile,
  orientation = 'landscape',
  revision,
  config,
  assignment,
  reportedRevision = revision,
}) {
  return {
    identity: {
      displayId,
      organizationId: 'org:stage24',
      mosqueId: 'mosque:stage24',
      locationId: `location:${displayId.split(':')[1]}`,
      orientation,
      resolutionProfile,
      playlistId: null,
    },
    lastSeenAt: '2026-08-23T06:00:00.000Z',
    appVersion: '1.2.1',
    reportedContentRevision: reportedRevision,
    reportedPrayerBoardTemplateId: config.templateId,
    syncState: reportedRevision === revision ? 'current' : 'syncing',
    remoteConfig: {
      displayId,
      contentRevision: revision,
      playlistId: null,
      displayTheme: displayTheme(config),
      prayerBoardConfig: config,
      prayerBoardAssignment: assignment,
      revoked: false,
      updatedAt: '2026-08-23T06:00:00.000Z',
    },
  };
}

function createFixtureState() {
  const original = board('heritage-classic', 'geometric-heritage', 'Stage 24 Masjid');
  return {
    displays: [
      displayStatus({
        displayId: 'display:lobby',
        resolutionProfile: '1920x1080',
        revision: 5,
        config: original,
        assignment: 'display-override',
      }),
      displayStatus({
        displayId: 'display:hall',
        resolutionProfile: '3840x2160',
        revision: 4,
        config: original,
        assignment: 'mosque-default',
      }),
      displayStatus({
        displayId: 'display:portrait',
        resolutionProfile: '1080x1920',
        orientation: 'portrait',
        revision: 2,
        config: original,
        assignment: 'service-default',
      }),
    ],
    mosqueDefault: {
      mosqueId: 'mosque:stage24',
      revision: 3,
      prayerBoardConfig: original,
      updatedAt: '2026-08-23T05:00:00.000Z',
    },
    displayPublications: [],
    mosquePublications: [],
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

async function installFixtureRoutes(page, state) {
  await page.route(`${fixtureOrigin}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(), body: '' });
      return;
    }
    if (request.headers().authorization !== `Bearer ${fixtureToken}`) {
      await fulfillJson(route, { error: 'Not authorized' }, 401);
      return;
    }

    const url = new URL(request.url());
    if (url.pathname === '/v1/admin/displays' && request.method() === 'GET') {
      await fulfillJson(route, { displays: state.displays });
      return;
    }
    if (url.pathname === '/v1/admin/mosque-defaults' && request.method() === 'GET') {
      await fulfillJson(route, { defaults: [state.mosqueDefault] });
      return;
    }
    if (
      url.pathname.startsWith('/v1/admin/displays/') &&
      url.pathname.endsWith('/config') &&
      request.method() === 'PUT'
    ) {
      const encodedId = url.pathname.slice('/v1/admin/displays/'.length, -'/config'.length);
      const displayId = decodeURIComponent(encodedId);
      const index = state.displays.findIndex((display) => display.identity.displayId === displayId);
      if (index < 0) {
        await fulfillJson(route, { error: 'Unknown display' }, 404);
        return;
      }
      const previous = state.displays[index];
      const update = request.postDataJSON();
      state.displayPublications.push({ displayId, update });
      const config = update.prayerBoardConfig ?? state.mosqueDefault.prayerBoardConfig;
      state.displays[index] = displayStatus({
        displayId,
        resolutionProfile: previous.identity.resolutionProfile,
        orientation: previous.identity.orientation,
        revision: update.contentRevision,
        reportedRevision: previous.reportedContentRevision,
        config,
        assignment: update.prayerBoardConfig === null ? 'mosque-default' : 'display-override',
      });
      await fulfillJson(route, state.displays[index]);
      return;
    }
    if (
      url.pathname === '/v1/admin/mosques/mosque%3Astage24/prayer-board-default' &&
      request.method() === 'PUT'
    ) {
      const update = request.postDataJSON();
      state.mosquePublications.push(update);
      state.mosqueDefault = {
        mosqueId: 'mosque:stage24',
        revision: update.revision,
        prayerBoardConfig: update.prayerBoardConfig,
        updatedAt: `2026-08-23T06:${String(10 + state.mosquePublications.length).padStart(2, '0')}:00.000Z`,
      };
      await fulfillJson(route, state.mosqueDefault);
      return;
    }
    await fulfillJson(route, { error: 'Not found' }, 404);
  });
}

async function seed(page, locale) {
  await page.addInitScript((serializedSettings) => {
    localStorage.setItem('salahos.settings', serializedSettings);
  }, JSON.stringify(settings(locale)));
}

async function assertContained(page, name) {
  const geometry = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.admin-display-theme-studio button'));
    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowButtons: buttons.filter((button) => {
        const bounds = button.getBoundingClientRect();
        return bounds.left < -1 || bounds.right > innerWidth + 1;
      }).length,
    };
  });
  if (geometry.scrollWidth > geometry.width || geometry.overflowButtons > 0) {
    throw new Error(`${name} overflowed its viewport: ${JSON.stringify(geometry)}`);
  }
}

async function closeTargetPreview(page) {
  const preview = page.locator('.managed-target-preview');
  await preview.waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /Close preview|إغلاق المعاينة/u }).click();
  await preview.waitFor({ state: 'hidden' });
}

async function previewCompatibleTargets(page) {
  const compatibleCards = page.locator('.admin-theme-display-card[data-compatible="true"]');
  for (let index = 0; index < (await compatibleCards.count()); index += 1) {
    await compatibleCards.nth(index).getByRole('button', { name: 'Preview exact target' }).click();
    const preview = page.locator('.managed-target-preview');
    await preview.waitFor({ state: 'visible' });
    const width = await preview.getAttribute('data-target-width');
    const expected = index === 0 ? '1920' : '3840';
    if (width !== expected) {
      throw new Error(`exact target preview ${String(index)} resolved ${String(width)}, expected ${expected}`);
    }
    await closeTargetPreview(page);
  }
}

async function captureDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1100 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const state = createFixtureState();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await installFixtureRoutes(page, state);
  await seed(page, 'en');

  try {
    await page.goto(`${baseUrl}/?surface=admin&adminView=displays&adminFixture=stage24themes`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.admin-display-theme-studio').waitFor({ state: 'visible' });
    await page.getByText('Managed fleet loaded.').waitFor({ state: 'visible' });

    if ((await page.locator('[data-template-card]').count()) !== 6) {
      throw new Error('Stage 24.3 gallery did not expose all six display themes');
    }
    if ((await page.locator('.admin-theme-display-card').count()) !== 3) {
      throw new Error('Stage 24.3 fixture fleet did not render all display targets');
    }
    if ((await page.locator('.admin-theme-display-card[data-compatible="false"]').count()) !== 1) {
      throw new Error('unsupported portrait target was not visibly blocked');
    }
    const blockedCheckbox = page
      .locator('.admin-theme-display-card[data-compatible="false"] input[type="checkbox"]')
      .first();
    if (!(await blockedCheckbox.isDisabled())) {
      throw new Error('unsupported portrait target remained assignable');
    }

    await page.locator('[data-template-card="minimal-modern"]').click();
    await page.getByLabel('Built-in background').selectOption('geometric-heritage');
    await page.locator('.admin-theme-branding input').first().fill('Stage 24 Preview Masjid');
    if (
      (await page.locator('.admin-theme-live-preview [data-prayer-board-template="minimal-modern"]').count()) !==
      1
    ) {
      throw new Error('live preview did not update to Minimal Modern');
    }
    if (
      (await page.getByLabel('Built-in background').inputValue()) !== 'geometric-heritage'
    ) {
      throw new Error('first-party built-in background selection did not persist in the draft');
    }

    await page.getByRole('button', { name: 'Select compatible displays' }).click();
    const publishBulk = page.getByRole('button', { name: 'Publish override to selected' });
    if (!(await publishBulk.isDisabled())) {
      throw new Error('bulk publication unlocked before exact target previews');
    }
    await previewCompatibleTargets(page);
    if (await publishBulk.isDisabled()) {
      throw new Error('bulk publication did not unlock after both exact target previews');
    }

    await assertContained(page, 'admin-theme-desktop-before-publish');
    await page.screenshot({
      path: path.join(artifactDirectory, 'admin-theme-desktop-en.png'),
      fullPage: true,
      animations: 'disabled',
    });

    await publishBulk.click();
    await page.getByText('Theme revision published.').waitFor({ state: 'visible' });
    if (state.displayPublications.length !== 2) {
      throw new Error(`bulk assignment published ${String(state.displayPublications.length)} displays`);
    }
    for (const publication of state.displayPublications) {
      if (
        publication.update.prayerBoardConfig?.templateId !== 'minimal-modern' ||
        publication.update.prayerBoardConfig?.background?.artworkId !== 'geometric-heritage' ||
        publication.update.prayerBoardConfig?.branding?.mosqueName?.en !== 'Stage 24 Preview Masjid'
      ) {
        throw new Error(`bulk publication lost theme draft data: ${JSON.stringify(publication)}`);
      }
    }

    const publishMosque = page.getByRole('button', { name: 'Publish mosque default' });
    if (await publishMosque.isDisabled()) {
      throw new Error('mosque publication did not remain preview-authorized for both target sizes');
    }
    await publishMosque.click();
    await page.getByText('Theme revision published.').waitFor({ state: 'visible' });
    if (state.mosqueDefault.revision !== 4) {
      throw new Error(`mosque default did not advance 3 → 4: ${String(state.mosqueDefault.revision)}`);
    }

    const historySelect = page.locator('.admin-theme-history select');
    await historySelect.selectOption('mosque-default|mosque:stage24');
    await page.locator('.admin-theme-history__list article').nth(1).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Load as rollback draft' }).click();
    await page.getByText(/Rollback draft loaded/u).waitFor({ state: 'visible' });
    if ((await page.locator('[data-template-card="heritage-classic"]').getAttribute('aria-pressed')) !== 'true') {
      throw new Error('rollback did not restore the earlier Heritage Classic draft');
    }
    if (!(await publishMosque.isDisabled())) {
      throw new Error('rollback publication did not require fresh exact-target preview');
    }

    await previewCompatibleTargets(page);
    await publishMosque.click();
    await page.getByText('Theme revision published.').waitFor({ state: 'visible' });
    if (
      state.mosqueDefault.revision !== 5 ||
      state.mosqueDefault.prayerBoardConfig.templateId !== 'heritage-classic'
    ) {
      throw new Error(`rollback was not republished monotonically as revision 5: ${JSON.stringify(state.mosqueDefault)}`);
    }

    await page.screenshot({
      path: path.join(artifactDirectory, 'admin-theme-rollback-published-en.png'),
      fullPage: true,
      animations: 'disabled',
    });
    if (pageErrors.length > 0) throw new Error(`desktop page errors: ${pageErrors.join(' | ')}`);

    return {
      galleryThemes: 6,
      compatibleTargets: 2,
      blockedTargets: 1,
      bulkPublications: state.displayPublications.length,
      mosqueRevision: state.mosqueDefault.revision,
      rollbackTemplate: state.mosqueDefault.prayerBoardConfig.templateId,
    };
  } finally {
    await context.close();
  }
}

async function captureResponsive(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const state = createFixtureState();
  await installFixtureRoutes(page, state);
  await seed(page, scenario.locale);

  try {
    await page.goto(`${baseUrl}/?surface=admin&adminView=displays&adminFixture=stage24themes`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.admin-display-theme-studio').waitFor({ state: 'visible' });
    await page.locator('.admin-theme-display-card').first().waitFor({ state: 'visible' });
    if ((await page.locator('[data-template-card]').count()) !== 6) {
      throw new Error(`${scenario.name} lost theme gallery entries`);
    }
    if (
      scenario.locale === 'ar' &&
      (await page.locator('.admin-display-theme-studio').getAttribute('dir')) !== 'rtl'
    ) {
      throw new Error('Arabic tablet theme studio did not render RTL');
    }
    await assertContained(page, scenario.name);
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name: scenario.name, rtl: scenario.locale === 'ar', contained: true };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const desktop = await captureDesktop(browser);
  const responsive = [];
  for (const scenario of [
    { name: 'admin-theme-tablet-ar-rtl', width: 1024, height: 1366, locale: 'ar' },
    { name: 'admin-theme-narrow-en', width: 390, height: 844, locale: 'en' },
  ]) {
    responsive.push(await captureResponsive(browser, scenario));
  }
  await writeFile(
    path.join(artifactDirectory, 'admin-display-theme-management-results.json'),
    `${JSON.stringify({ desktop, responsive }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
