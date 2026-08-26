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
await mkdir(artifactDirectory, { recursive: true });

function settings(locale = 'en') {
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

async function seed(page, locale = 'en') {
  await page.addInitScript((stored) => {
    localStorage.setItem('salahos.settings', JSON.stringify(stored));
  }, settings(locale));
}

const browser = await chromium.launch({ headless: true });
const results = {};
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await seed(page);
  await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
  await page.locator('.today-next').waitFor({ state: 'visible' });

  const visibleNavItems = page.locator('.congregation-nav > .congregation-nav-item:visible');
  if ((await visibleNavItems.count()) !== 5) {
    throw new Error(
      `Expected 5 visible mobile navigation items, got ${String(await visibleNavItems.count())}`,
    );
  }
  const primaryNavLabels = await visibleNavItems
    .locator('.congregation-nav-label')
    .allTextContents();
  const expectedPrimaryNavLabels = ['Today', 'Mosques', 'Qiblah', 'Knowledge', 'Settings'];
  if (JSON.stringify(primaryNavLabels) !== JSON.stringify(expectedPrimaryNavLabels)) {
    throw new Error(`Unexpected mobile primary navigation: ${primaryNavLabels.join(', ')}`);
  }
  const hierarchy = await page.evaluate(() => {
    const hero = document.querySelector('.today-next');
    const local = document.querySelector('.today-local-context');
    const schedule = document.querySelector('.today-schedule');
    if (!hero || !local || !schedule) return null;
    const position = hero.compareDocumentPosition(local);
    const localPosition = local.compareDocumentPosition(schedule);
    return {
      heroBeforeLocal: Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING),
      localBeforeSchedule: Boolean(localPosition & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  });
  if (hierarchy?.heroBeforeLocal !== true || hierarchy.localBeforeSchedule !== true) {
    throw new Error(
      'Today hierarchy must be next prayer → local context/weather → prayer schedule',
    );
  }
  await page.locator('[data-current-prayer]').waitFor({ state: 'visible' });
  await page.locator('.today-location-confidence').waitFor({ state: 'visible' });
  const secondary = page.locator('.today-secondary-context');
  if (await secondary.getAttribute('open')) {
    throw new Error('Secondary Today context must use progressive disclosure by default');
  }
  await secondary.locator('summary').click();
  await page.locator('.today-quick-actions').waitFor({ state: 'visible' });
  await page
    .locator('.congregation-nav > .congregation-nav-item[data-navigation-id=\"settings\"]')
    .click();
  await page.locator('.settings-category-grid').waitFor({ state: 'visible' });
  const categories = page.locator('.settings-category-card');
  if ((await categories.count()) !== 7) {
    throw new Error(`Expected 7 Settings categories, got ${String(await categories.count())}`);
  }
  const categoryLabels = await categories.locator('strong').allTextContents();
  const expected = [
    'Location',
    'Prayer settings',
    'Adhan',
    'Display',
    'Mosques',
    'Privacy & data',
    'Advanced',
  ];
  if (JSON.stringify(categoryLabels) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected Settings category order: ${JSON.stringify(categoryLabels)}`);
  }

  await page.goto(`${baseUrl}/?view=settings&settingsView=appearance`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('heading', { name: 'Display', exact: true }).waitFor({ state: 'visible' });

  await page.screenshot({
    path: path.join(artifactDirectory, 'stage57-product-ux-phone.png'),
    fullPage: true,
  });
  results.mobile = { visibleNavigationItems: 5, settingsCategories: categoryLabels };
  await context.close();

  const arabicContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const arabicPage = await arabicContext.newPage();
  await seed(arabicPage, 'ar');
  await arabicPage.goto(`${baseUrl}/?view=settings`, { waitUntil: 'networkidle' });
  await arabicPage.locator('.settings-category-grid').waitFor({ state: 'visible' });
  if ((await arabicPage.locator('.settings-category-card').count()) !== 7) {
    throw new Error('Arabic Settings must retain the seven canonical groups');
  }
  if ((await arabicPage.locator('html').getAttribute('dir')) !== 'rtl') {
    throw new Error('Arabic Stage 8 Settings must remain RTL');
  }
  results.arabic = { direction: 'rtl', settingsCategories: 7 };
  await arabicContext.close();

  await writeFile(
    path.join(artifactDirectory, 'stage57-product-ux-results.json'),
    `${JSON.stringify(results, null, 2)}
`,
  );
  console.log('Stage 57 product UX acceptance passed.');
} finally {
  await browser.close();
}
