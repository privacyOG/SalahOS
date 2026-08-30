import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);
const expectedAustralianMosqueRecords = 254;

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(playwrightModule).href);

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function seed(page) {
  await page.addInitScript((value) => {
    localStorage.setItem('salahos.settings', JSON.stringify(value));
    localStorage.setItem(
      'salahos.qiblaPermissionOnboarding',
      JSON.stringify({ version: 2, dismissed: true, autoLocation: false }),
    );
  }, settings());
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  await seed(page);
  await page.goto(`${baseUrl}/?view=mosques`, { waitUntil: 'networkidle' });

  const panel = page.locator('.australian-mosque-directory');
  await panel.waitFor({ state: 'visible' });
  await panel.locator('input[type="search"]').fill('Al Hijrah Mosque');
  const card = panel.locator('[data-directory-mosque-id="osm-node-3318094580"]');
  await card.waitFor({ state: 'visible' });

  const quality = Number(await card.getAttribute('data-directory-quality'));
  const freshness = await card.getAttribute('data-directory-freshness');
  assert(
    Number.isFinite(quality) && quality > 0,
    'enriched mosque card did not expose data quality',
  );
  assert(freshness === 'fresh', `expected fresh OSM data, received ${String(freshness)}`);
  await card.locator('[data-directory-verification]').waitFor({ state: 'visible' });

  const directions = card.getByRole('link', { name: 'Directions' });
  const directionsHref = await directions.getAttribute('href');
  assert(
    directionsHref?.startsWith('https://www.google.com/maps/dir/?api=1&destination=') === true,
    'mosque card did not expose a usable directions action',
  );
  assert(
    (await card.locator('[data-directory-report-edit="true"]').getAttribute('href')) ===
      '#shared-mosque-directory-title',
    'mosque card report/edit action did not target the shared correction workflow',
  );

  const favourite = card.locator('[data-directory-favourite-toggle="true"]');
  await favourite.click();
  await card.getByRole('button', { name: 'Remove favourite' }).waitFor({ state: 'visible' });
  const library = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('salahos.mosqueProfileLibrary') ?? '{}'),
  );
  assert(
    library.profiles?.some((profile) => profile.id === 'osm-node-3318094580') === true,
    'favourite mosque was not persisted in the followed-mosque library',
  );
  assert(
    library.selectedProfileId === null,
    'favouriting a mosque unexpectedly changed the selected prayer-time mosque',
  );

  await page.reload({ waitUntil: 'networkidle' });
  const reloadedCard = page.locator('[data-directory-mosque-id="osm-node-3318094580"]');
  await page.locator('.australian-mosque-directory input[type="search"]').fill('Al Hijrah Mosque');
  await reloadedCard
    .getByRole('button', { name: 'Remove favourite' })
    .waitFor({ state: 'visible' });

  const packs = await page.evaluate(async () => {
    const manifestResponse = await fetch('/mosque-packs/manifest.json');
    const countryResponse = await fetch('/mosque-packs/au/au.json');
    return {
      manifestStatus: manifestResponse.status,
      countryStatus: countryResponse.status,
      manifest: await manifestResponse.json(),
      country: await countryResponse.json(),
    };
  });
  assert(packs.manifestStatus === 200, 'global mosque pack manifest was not deployable');
  assert(packs.countryStatus === 200, 'Australia mosque pack was not deployable');
  assert(packs.manifest.scope === 'global', 'mosque pack manifest did not use global scope');
  assert(
    packs.manifest.recordCount === expectedAustralianMosqueRecords,
    `mosque pack manifest record count drifted: expected ${String(expectedAustralianMosqueRecords)}, received ${String(packs.manifest.recordCount)}`,
  );
  assert(
    packs.manifest.countries?.[0]?.regions?.length === 8,
    'regional AU pack index is incomplete',
  );
  assert(
    packs.country.recordCount === expectedAustralianMosqueRecords,
    `Australia mosque pack record count drifted: expected ${String(expectedAustralianMosqueRecords)}, received ${String(packs.country.recordCount)}`,
  );
  assert(
    packs.country.records?.every((record) => Array.isArray(record.provenance)) === true,
    'downloadable mosque pack records are missing provenance',
  );

  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `enriched mosque actions caused horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
  );

  await page.screenshot({
    path: path.join(artifactDirectory, 'stage53-mosque-directory-enrichment-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const result = {
    quality,
    freshness,
    favouritePersisted: true,
    globalManifestRecords: packs.manifest.recordCount,
    regionalPackCount: packs.manifest.countries[0].regions.length,
    ...metrics,
  };
  await writeFile(
    path.join(artifactDirectory, 'stage53-mosque-directory-enrichment-results.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log('Stage 53 mosque directory enrichment visual acceptance passed.');
  await context.close();
} finally {
  await browser.close();
}
