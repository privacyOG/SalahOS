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

async function seed(page, locale = 'en') {
  await page.addInitScript((settings) => {
    localStorage.setItem('salahos.settings', JSON.stringify(settings));
  }, persistedSettings(locale));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    await page.goto(`${baseUrl}/?view=knowledge`, { waitUntil: 'networkidle' });

    const experience = page.locator('[data-knowledge-experience]');
    await experience.waitFor({ state: 'visible' });
    assert(
      (await experience.getAttribute('data-knowledge-view')) === 'library',
      'Knowledge did not open on the Library section',
    );

    let screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    assert(
      (await screen
        .locator('[data-knowledge-curated-size]')
        .getAttribute('data-knowledge-curated-size')) === '3',
      'Governed Library scope size is not three entries',
    );
    assert(
      (await screen.locator('.knowledge-card').count()) === 3 &&
        (await screen.locator('[data-knowledge-module="qa"]').count()) === 3,
      'Library section did not expose the three governed Q&A/Fiqh entries',
    );
    assert(
      (await screen.locator('[data-knowledge-module="hadith"]').count()) === 0,
      'Hadith entries leaked into the segmented Library section',
    );
    await screen.locator('[data-scholar-disclaimer]').waitFor();
    await screen
      .getByText('Classical Hanafi, Maliki, Shafi‘i and Hanbali sources')
      .first()
      .waitFor();
    await screen.getByText('al-Hidayah', { exact: false }).first().waitFor();

    await screen.locator('[data-knowledge-filter="fiqh"]').click();
    assert(
      (await screen.locator('[data-knowledge-content-type="fiqh"]').count()) === 3,
      'First-class Fiqh filter did not isolate the governed Fiqh entries',
    );
    assert(
      (await screen.locator('[data-fiqh-madhhab]').count()) === 12,
      'Four-madhhab Fiqh views are incomplete',
    );

    await screen.locator('[data-knowledge-filter="all"]').click();
    await screen.getByRole('searchbox').fill('madhhab');
    assert(
      (await screen.locator('.knowledge-card').count()) === 3,
      'Madhhab-aware search did not retain all governed fiqh entries',
    );
    await screen.getByRole('searchbox').fill('travel');
    assert(
      (await screen.locator('.knowledge-card').count()) === 1,
      'Search did not narrow to travel Q&A',
    );
    await screen.getByText('May an obligatory prayer be shortened while travelling?').waitFor();

    await experience.locator('[data-knowledge-view-select="hadith"]').click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-knowledge-experience]')
          ?.getAttribute('data-knowledge-view') === 'hadith',
    );
    screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    assert(
      (await screen.locator('.knowledge-card').count()) === 3 &&
        (await screen.locator('[data-knowledge-module="hadith"]').count()) === 3,
      'Hadith section did not expose the three governed entries',
    );
    await screen.locator('[data-knowledge-module="hadith"]').first().click();
    await screen.locator('[data-hadith-metadata]').first().waitFor();
    await screen.locator('[data-hadith-arabic]').first().waitFor();
    await screen.locator('[data-hadith-full-text]').first().waitFor();
    await screen.locator('[data-hadith-topics]').first().waitFor();
    await screen.locator('[data-hadith-related]').first().waitFor();

    const libraryScreenshot = path.join(artifactDirectory, 'islamic-knowledge-library.png');
    await page.screenshot({ path: libraryScreenshot, fullPage: true });
    results.push({ scenario: 'library-hadith', screenshot: libraryScreenshot });

    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, 'ar');
    await page.goto(`${baseUrl}/?view=knowledge`, { waitUntil: 'networkidle' });

    const experience = page.locator('[data-knowledge-experience]');
    await experience.waitFor({ state: 'visible' });
    assert((await page.locator('html').getAttribute('dir')) === 'rtl', 'Arabic Knowledge is not RTL');
    await experience.locator('[data-knowledge-view-select="hadith"]').click();
    let screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    assert(
      (await screen.locator('[data-hadith-arabic]').count()) === 3,
      'Arabic Hadith view did not retain governed entries',
    );

    await experience.locator('[data-knowledge-view-select="library"]').click();
    screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    await screen.locator('[data-knowledge-filter="fiqh"]').click();
    assert(
      (await screen.locator('[data-fiqh-madhhab]').count()) === 12,
      'Arabic Fiqh view lost four-madhhab detail',
    );

    const arabicScreenshot = path.join(artifactDirectory, 'islamic-knowledge-arabic.png');
    await page.screenshot({ path: arabicScreenshot, fullPage: true });
    results.push({ scenario: 'arabic-rtl', screenshot: arabicScreenshot });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'islamic-knowledge-summary.json'),
  `${JSON.stringify({ results }, null, 2)}\n`,
);

console.log('Stage 56 Islamic Knowledge visual acceptance passed.');
