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

    const screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    assert((await screen.locator('.knowledge-card').count()) === 9, 'Expected nine offline entries');
    assert((await screen.locator('[data-knowledge-module="quran"]').count()) === 3, 'Qur’an module missing');
    assert((await screen.locator('[data-knowledge-module="hadith"]').count()) === 3, 'Hadith module missing');
    assert((await screen.locator('[data-knowledge-module="qa"]').count()) === 3, 'Q&A module missing');
    await screen.getByText('Sahih al-Bukhari').first().waitFor();
    await screen.getByText('Sahih').first().waitFor();
    await screen.getByText('Imam al-Nawawi').first().waitFor();

    await screen.locator('[data-knowledge-filter="hadith"]').click();
    assert((await screen.locator('.knowledge-card').count()) === 3, 'Hadith filter did not isolate entries');

    await screen.locator('[data-knowledge-filter="all"]').click();
    await screen.getByRole('searchbox').fill('travel');
    assert((await screen.locator('.knowledge-card').count()) === 1, 'Search did not narrow to travel Q&A');
    await screen.getByText('May an obligatory prayer be shortened while travelling?').waitFor();

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      navItems: document.querySelectorAll('.congregation-nav-item').length,
    }));
    assert(metrics.navItems === 6, 'Knowledge was not added as a first-class navigation item');
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Knowledge caused mobile horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage50-islamic-knowledge-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'knowledge-mobile', ...metrics });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 360, height: 780 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, 'ar');
    await page.goto(`${baseUrl}/?view=knowledge`, { waitUntil: 'networkidle' });

    const screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    await screen.getByText('المعرفة الإسلامية').waitFor();
    await screen.getByText('القرآن', { exact: true }).first().waitFor();

    const metrics = await page.evaluate(() => ({
      htmlDir: document.documentElement.dir,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(metrics.htmlDir === 'rtl', 'Arabic Knowledge fixture did not apply RTL');
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `RTL Knowledge caused horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage50-islamic-knowledge-rtl.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'knowledge-rtl', ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage50-islamic-knowledge-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 50 Islamic Knowledge acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
