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
      (await screen.locator('[data-knowledge-curated-size]').getAttribute('data-knowledge-curated-size')) ===
        '9',
      'Governed Knowledge catalogue size is not nine entries',
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
    await page.waitForFunction(() =>
      document.querySelector('[data-knowledge-experience]')?.getAttribute('data-knowledge-view') ===
      'hadith',
    );
    screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    assert(
      (await screen.locator('.knowledge-card').count()) === 3 &&
        (await screen.locator('[data-knowledge-module="hadith"]').count()) === 3,
      'Hadith section did not expose the three governed entries',
    );
    assert(
      (await screen.locator('[data-hadith-arabic]').count()) === 3 &&
        (await screen.locator('[data-hadith-arabic-scope="partial-matn"]').count()) === 3,
      'Hadith Arabic excerpts are missing or not labelled as partial matn',
    );
    assert(
      (await screen.locator('[data-hadith-book]').count()) === 3 &&
        (await screen.locator('[data-hadith-chapter]').count()) === 3 &&
        (await screen.locator('[data-hadith-isnad]').count()) === 3,
      'Hadith book/chapter/isnad metadata is incomplete',
    );
    assert(
      (await screen.locator('[data-hadith-full-text]').count()) === 3,
      'Reviewed full-text Hadith links are missing',
    );
    await screen.getByText('Sahih al-Bukhari').first().waitFor();
    await screen.getByText('Sahih').first().waitFor();
    await screen.getByText('Imam al-Bukhari').first().waitFor();
    await screen.locator('[data-hadith-topic="intention"]').click();
    assert(
      (await screen.locator('[data-knowledge-module="hadith"]').count()) === 1,
      'Hadith topic navigation did not isolate the intention entry',
    );
    await screen.getByRole('searchbox').fill('');
    await screen.locator('[data-hadith-related] button').first().click();
    assert(
      (await screen.locator('[data-knowledge-module="hadith"]').count()) === 1,
      'Related Hadith navigation did not isolate its target',
    );
    await screen.getByRole('searchbox').fill('');

    await experience.locator('[data-knowledge-view-select="quran"]').click();
    const reader = page.locator('[data-quran-offline-reader]');
    await reader.waitFor({ state: 'visible' });
    await reader.getByText('114 surahs · 6,236 ayat', { exact: false }).waitFor();
    assert(
      (await experience.getAttribute('data-knowledge-view')) === 'quran',
      'Qur’an segment did not activate the complete offline reader',
    );
    await reader.locator('[data-quran-offline-search]').fill('20:14');
    const curatedAyah = reader.locator('[data-quran-offline-ayah="20:14"]');
    await curatedAyah.waitFor({ state: 'visible' });
    await curatedAyah.getByText('Tafsir al-Jalalayn', { exact: true }).waitFor();

    const visibleNavigation = page.locator('.congregation-nav > .congregation-nav-item:visible');
    const visibleNavigationIds = await visibleNavigation.evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-navigation-id')),
    );
    assert(
      visibleNavigationIds.length === 6 && visibleNavigationIds.includes('knowledge'),
      `Knowledge was not retained in the six-item visible primary navigation: ${JSON.stringify(visibleNavigationIds)}`,
    );

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Knowledge caused mobile horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage56-hadith-fiqh-expansion-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'segmented-knowledge-mobile', visibleNavigationIds, ...metrics });
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

    const experience = page.locator('[data-knowledge-experience]');
    const screen = page.locator('[data-knowledge-screen]');
    await screen.waitFor({ state: 'visible' });
    await screen.getByText('المعرفة الإسلامية').waitFor();
    await experience.locator('[data-knowledge-view-select="quran"]').click();
    const reader = page.locator('[data-quran-offline-reader]');
    await reader.waitFor({ state: 'visible' });
    await reader.getByText('القرآن الكامل دون اتصال').waitFor();
    await reader.locator('[data-quran-font-select]').selectOption('amiri-quran');
    await reader.locator('[data-quran-size-select]').selectOption('large');

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
      path: path.join(artifactDirectory, 'stage56-hadith-fiqh-expansion-rtl.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'segmented-knowledge-rtl', ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage56-hadith-fiqh-expansion-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 56 Hadith and Fiqh acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
