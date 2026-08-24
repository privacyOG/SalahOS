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

const records = [
  {
    id: 'stage48-lakemba',
    name: 'Lakemba Shared Mosque',
    nameAr: 'مسجد لاكمبا المشترك',
    address: 'Lakemba NSW 2195, Australia',
    countryCode: 'AU',
    latitude: -33.9195,
    longitude: 151.075,
    timeZone: 'Australia/Sydney',
    website: 'https://example.invalid/lakemba',
    phone: null,
    source: 'community',
    verification: {
      state: 'claimed',
      verifiedAt: '2026-08-20T00:00:00Z',
      claimedAt: '2026-08-21T00:00:00Z',
    },
    revision: 3,
    updatedAt: '2026-08-23T00:00:00Z',
  },
  {
    id: 'stage48-bankstown',
    name: 'Bankstown Community Masjid',
    nameAr: null,
    address: 'Bankstown NSW 2200, Australia',
    countryCode: 'AU',
    latitude: -33.9173,
    longitude: 151.0349,
    timeZone: 'Australia/Sydney',
    website: null,
    phone: null,
    source: 'community',
    verification: {
      state: 'verified',
      verifiedAt: '2026-08-20T00:00:00Z',
      claimedAt: null,
    },
    revision: 2,
    updatedAt: '2026-08-22T00:00:00Z',
  },
  {
    id: 'stage48-parramatta',
    name: 'Parramatta Shared Musalla',
    nameAr: null,
    address: 'Parramatta NSW 2150, Australia',
    countryCode: 'AU',
    latitude: -33.815,
    longitude: 151.0011,
    timeZone: 'Australia/Sydney',
    website: null,
    phone: null,
    source: 'community',
    verification: {
      state: 'unverified',
      verifiedAt: null,
      claimedAt: null,
    },
    revision: 1,
    updatedAt: '2026-08-21T00:00:00Z',
  },
];

function persistedSettings(locale = 'en') {
  return {
    version: 2,
    locale,
    theme: 'light',
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: 'calculated',
    location: {
      coordinates: { latitude: -33.91, longitude: 151.05 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

async function seed(page, locale = 'en', withCache = false) {
  await page.addInitScript(
    ({ settings, cacheRecords, cache }) => {
      localStorage.setItem('salahos.settings', JSON.stringify(settings));
      if (cache) {
        localStorage.setItem(
          'salahos.sharedMosqueDirectoryCache.v1',
          JSON.stringify({
            version: 1,
            cachedAt: '2026-08-24T00:00:00Z',
            records: cacheRecords,
          }),
        );
      }
    },
    { settings: persistedSettings(locale), cacheRecords: records, cache: withCache },
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function distanceFromCard(text) {
  const match = text.match(/Distance:\s*([\d,.]+)\s*km/iu);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

async function installMockService(page) {
  await page.route('**/api/v1/shared-mosques**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'GET') {
      const query = (url.searchParams.get('q') ?? '').toLocaleLowerCase('en-AU');
      const matches = records.filter((record) =>
        [record.name, record.nameAr ?? '', record.address]
          .join(' ')
          .toLocaleLowerCase('en-AU')
          .includes(query),
      );
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(matches) });
      return;
    }
    if (url.pathname.endsWith('/submissions')) {
      const body = request.postDataJSON();
      if (String(body.name ?? '').includes('Lakemba Shared Mosque')) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Potential duplicate mosque', duplicateId: 'stage48-lakemba' }),
        });
        return;
      }
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'contribution-submission',
          kind: 'submission',
          mosqueId: null,
          state: 'pending',
          submittedAt: '2026-08-24T00:00:00Z',
          payload: body,
        }),
      });
      return;
    }
    const kind = url.pathname.endsWith('/claims') ? 'claim' : 'edit-suggestion';
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `contribution-${kind}`,
        kind,
        mosqueId: 'stage48-lakemba',
        state: 'pending',
        submittedAt: '2026-08-24T00:00:00Z',
        payload: request.postDataJSON(),
      }),
    });
  });
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
    await seed(page);
    await installMockService(page);
    await page.goto(`${baseUrl}/?view=mosques`, { waitUntil: 'networkidle' });

    const panel = page.locator('.shared-mosque-directory');
    await panel.waitFor({ state: 'visible' });
    await page.waitForFunction(() =>
      document.querySelector('.shared-mosque-directory')?.getAttribute('data-shared-directory-connection') === 'online',
    );

    const search = panel.locator('input[type="search"]');
    await search.fill('Lakemba');
    await panel.getByRole('button', { name: 'Search', exact: true }).click();
    const lakemba = panel.locator('[data-shared-mosque-id="stage48-lakemba"]');
    await lakemba.waitFor({ state: 'visible' });
    assert((await panel.locator('[data-shared-mosque-id]').count()) === 1, 'Shared search did not narrow results');
    assert((await lakemba.getAttribute('data-verification-state')) === 'claimed', 'Claim state badge is missing');

    await lakemba.getByRole('button', { name: 'Use mosque' }).click();
    await lakemba.getByRole('button', { name: 'Selected' }).waitFor();
    const library = await page.evaluate(() => JSON.parse(localStorage.getItem('salahos.mosqueProfileLibrary') ?? '{}'));
    assert(library.selectedProfileId === 'shared-stage48-lakemba', 'Shared mosque selection was not persisted');

    await search.fill('');
    await panel.getByRole('button', { name: 'Search', exact: true }).click();
    await panel.getByRole('button', { name: 'Near me' }).click();
    const cardText = await panel.locator('[data-shared-mosque-id]').allTextContents();
    const distances = cardText.map(distanceFromCard).filter((value) => value !== null);
    assert(distances.length === 3, 'Nearby shared search did not expose distances');
    assert(
      distances.every((value, index) => index === 0 || value >= distances[index - 1] - 0.05),
      'Nearby shared results are not ordered by distance',
    );

    const lakembaAgain = panel.locator('[data-shared-mosque-id="stage48-lakemba"]');
    await lakembaAgain.getByRole('button', { name: 'Suggest edit' }).click();
    const editForm = lakembaAgain.locator('[data-shared-edit-form="true"]');
    await editForm.locator('input').fill('Updated Lakemba address');
    await editForm.getByRole('button', { name: 'Send for review' }).click();
    await panel.getByText('Received for moderation.').waitFor();

    await lakembaAgain.getByRole('button', { name: 'Request claim' }).click();
    const claimForm = lakembaAgain.locator('[data-shared-claim-form="true"]');
    await claimForm.locator('input').fill('admin@example.invalid');
    await claimForm.getByRole('button', { name: 'Send for review' }).click();
    await panel.getByText('Received for moderation.').waitFor();

    await panel.getByRole('button', { name: 'Submit a mosque' }).click();
    const submission = panel.locator('[data-shared-submission-form="true"]');
    const fields = submission.locator('input');
    await fields.nth(0).fill('Lakemba Shared Mosque');
    await fields.nth(1).fill('Lakemba NSW 2195, Australia');
    await fields.nth(2).fill('-33.9195');
    await fields.nth(3).fill('151.075');
    await submission.getByRole('button', { name: 'Submit for review' }).click();
    await panel.getByText('A likely duplicate already exists in the directory.').waitFor();
    await fields.nth(0).fill('New Stage 48 Masjid');
    await fields.nth(1).fill('88 New Street, Sydney NSW 2000');
    await fields.nth(2).fill('-33.87');
    await fields.nth(3).fill('151.21');
    await submission.getByRole('button', { name: 'Submit for review' }).click();
    await panel.getByText('Received for moderation.').waitFor();

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cacheCount: JSON.parse(localStorage.getItem('salahos.sharedMosqueDirectoryCache.v1') ?? '{}').records?.length ?? 0,
    }));
    assert(metrics.scrollWidth <= metrics.innerWidth + 1, 'Shared directory caused mobile overflow');
    assert(metrics.cacheCount >= 3, 'Shared search results were not cached locally');
    await page.screenshot({
      path: path.join(artifactDirectory, 'stage48-shared-directory-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'online-search-nearby-contributions', distances, ...metrics });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 360, height: 780 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, 'ar', true);
    await page.route('**/api/v1/shared-mosques**', (route) => route.abort('failed'));
    await page.goto(`${baseUrl}/?view=mosques`, { waitUntil: 'networkidle' });

    const panel = page.locator('.shared-mosque-directory');
    await page.waitForFunction(() =>
      document.querySelector('.shared-mosque-directory')?.getAttribute('data-shared-directory-connection') === 'offline',
    );
    await panel.locator('input[type="search"]').fill('Bankstown');
    await panel.getByRole('button', { name: 'بحث', exact: true }).click();
    await panel.locator('[data-shared-mosque-id="stage48-bankstown"]').waitFor({ state: 'visible' });

    const metrics = await page.evaluate(() => ({
      htmlDir: document.documentElement.dir,
      panelDir: document.querySelector('.shared-mosque-directory')?.getAttribute('dir'),
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(metrics.htmlDir === 'rtl', 'Shared directory RTL fixture did not set document direction');
    assert(metrics.panelDir === 'rtl', 'Shared directory did not retain RTL direction');
    assert(metrics.scrollWidth <= metrics.innerWidth + 1, 'Offline RTL shared directory overflowed viewport');
    await page.screenshot({
      path: path.join(artifactDirectory, 'stage48-shared-directory-offline-rtl.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'offline-cache-rtl', ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage48-shared-directory-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 48 shared mosque directory acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
