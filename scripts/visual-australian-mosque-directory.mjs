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
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

async function seedExistingInstall(page, locale = 'en') {
  await page.addInitScript((settings) => {
    localStorage.setItem('salahos.settings', JSON.stringify(settings));
  }, persistedSettings(locale));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseDistance(value) {
  const match = value.match(/Distance:\s*([\d,.]+)\s*km/iu);
  if (!match) return null;
  return Number(match[1].replaceAll(',', ''));
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
    await seedExistingInstall(page);
    await page.goto(`${baseUrl}/?view=mosques`, { waitUntil: 'networkidle' });

    const panel = page.locator('.australian-mosque-directory');
    await panel.waitFor({ state: 'visible' });
    assert(
      (await panel.getAttribute('data-directory-record-count')) === '106',
      'Australian mosque directory did not expose the expected 106-record snapshot',
    );
    await panel.getByRole('button', { name: 'Nearest first' }).click();
    await panel
      .getByText('Distance is calculated privately on this device from your saved location.')
      .waitFor();

    const cardText = await panel.locator('.australian-mosque-directory__card').allTextContents();
    const distances = cardText.map(parseDistance).filter((value) => value !== null);
    assert(
      distances.length >= 3,
      'Nearest-first directory did not render multiple distance values',
    );
    assert(
      distances.every((value, index) => index === 0 || value >= distances[index - 1] - 0.05),
      'Australian mosque directory distances are not ordered nearest-first',
    );

    const search = panel.locator('input[type="search"]');
    await search.fill('Al Hijrah Mosque');
    const alHijrah = panel.locator('[data-directory-mosque-id="osm-node-3318094580"]');
    await alHijrah.waitFor({ state: 'visible' });
    assert(
      (await panel.locator('.australian-mosque-directory__card').count()) === 1,
      'Name search did not narrow the Australian directory to the expected mosque',
    );
    await alHijrah.getByRole('button', { name: 'Use mosque' }).click();
    await alHijrah.getByRole('button', { name: 'Selected' }).waitFor();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.mosqueProfileLibrary');
      return raw === null ? null : JSON.parse(raw);
    });
    assert(
      stored !== null,
      'Selecting an Australian directory mosque did not persist the mosque library',
    );
    assert(
      stored.selectedProfileId === 'osm-node-3318094580',
      'Selected Australian directory mosque ID was not persisted',
    );
    assert(
      stored.profiles.some((profile) => profile.id === 'osm-node-3318094580'),
      'Selected Australian directory mosque was not upserted into the followed library',
    );
    await page
      .locator('.mosque-profile-v2')
      .getByRole('heading', { name: 'Al Hijrah Mosque' })
      .waitFor({ state: 'visible' });

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      selectedProfileId: JSON.parse(localStorage.getItem('salahos.mosqueProfileLibrary') ?? '{}')
        .selectedProfileId,
    }));
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Australian mosque directory caused mobile horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage47-australian-mosque-directory-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({
      name: 'mobile-search-nearest-selection',
      nearestDistancesKm: distances.slice(0, 5),
      ...metrics,
    });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 360, height: 780 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seedExistingInstall(page, 'ar');
    await page.goto(`${baseUrl}/?view=mosques`, { waitUntil: 'networkidle' });

    const panel = page.locator('.australian-mosque-directory');
    await panel.waitFor({ state: 'visible' });
    await panel.locator('input[type="search"]').fill('Auburn');
    await panel
      .locator('[data-directory-mosque-id="osm-way-156808623"]')
      .waitFor({ state: 'visible' });

    const metrics = await page.evaluate(() => {
      const panelElement = document.querySelector('.australian-mosque-directory');
      const card = document.querySelector('.australian-mosque-directory__card');
      const panelRect = panelElement?.getBoundingClientRect();
      const cardRect = card?.getBoundingClientRect();
      return {
        htmlDir: document.documentElement.dir,
        panelDir: panelElement?.getAttribute('dir'),
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        panelLeft: panelRect?.left ?? -1,
        panelRight: panelRect?.right ?? -1,
        cardLeft: cardRect?.left ?? -1,
        cardRight: cardRect?.right ?? -1,
      };
    });
    assert(
      metrics.htmlDir === 'rtl',
      'Arabic Stage 47 fixture did not apply RTL document direction',
    );
    assert(metrics.panelDir === 'rtl', 'Australian mosque directory did not retain RTL direction');
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `RTL Australian mosque directory caused horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );
    assert(
      metrics.panelLeft >= -1 && metrics.panelRight <= metrics.innerWidth + 1,
      'RTL Australian mosque directory panel escaped the mobile viewport',
    );
    assert(
      metrics.cardLeft >= -1 && metrics.cardRight <= metrics.innerWidth + 1,
      'RTL Australian mosque card escaped the mobile viewport',
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage47-australian-mosque-directory-rtl.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'rtl-mobile-search-overflow', ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage47-australian-mosque-directory-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(
    `Stage 47 Australian mosque directory acceptance passed: ${String(results.length)} flows.`,
  );
} finally {
  await browser.close();
}
