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

const playwright = await import(pathToFileURL(playwrightModule).href);
const engines = [
  ['chromium', playwright.chromium],
  ['firefox', playwright.firefox],
  ['webkit', playwright.webkit],
];
const expectedVisibleNavigationIds = [
  'today',
  'calendar',
  'mosques',
  'qiblah',
  'knowledge',
  'settings',
];

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

await mkdir(artifactDirectory, { recursive: true });
const results = [];

for (const [engineName, engine] of engines) {
  const browser = await engine.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.addInitScript((persisted) => {
      localStorage.setItem('salahos.settings', JSON.stringify(persisted));
    }, settings());

    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });

    const visibleNavigation = page.locator(
      '.congregation-nav > .congregation-nav-item:visible',
    );
    const visibleNavigationIds = await visibleNavigation.evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-navigation-id')),
    );
    assert(
      JSON.stringify(visibleNavigationIds) === JSON.stringify(expectedVisibleNavigationIds),
      `${engineName}: visible nav mismatch: ${JSON.stringify(visibleNavigationIds)}`,
    );

    await page
      .locator(
        '.congregation-nav > .congregation-nav-item[data-navigation-id="knowledge"]:visible',
      )
      .click();
    await page.locator('[data-knowledge-screen]').waitFor({ state: 'visible' });
    assert(
      new URL(page.url()).searchParams.get('view') === 'knowledge',
      `${engineName}: route failed`,
    );

    await page.goto(`${baseUrl}/?surface=admin&adminView=overview`, { waitUntil: 'networkidle' });
    await page.locator('.admin-shell').waitFor({ state: 'visible' });

    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(metrics.scrollWidth <= metrics.viewport + 1, `${engineName}: horizontal overflow`);

    results.push({ engine: engineName, routes: ['today', 'knowledge', 'admin'], ...metrics });
    await context.close();
  } finally {
    await browser.close();
  }
}

await writeFile(
  path.join(artifactDirectory, 'cross-browser-smoke-results.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(
  `Cross-browser smoke passed Chromium, Firefox and WebKit (${String(results.length)} engines).`,
);
