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
    assert(
      (await screen.locator('.knowledge-card').count()) === 9,
      'Expected nine offline entries',
    );
    assert(
      (await screen.locator('[data-knowledge-module="quran"]').count()) === 3,
      'Qur’an module missing',
    );
    assert(
      (await screen.locator('[data-knowledge-module="hadith"]').count()) === 3,
      'Hadith module missing',
    );
    assert(
      (await screen.locator('[data-knowledge-module="qa"]').count()) === 3,
      'Q&A module missing',
    );

    await screen.getByText('M. M. Pickthall (1930)', { exact: false }).first().waitFor();
    await screen.getByText('Sahih al-Bukhari').first().waitFor();
    await screen.getByText('Sahih').first().waitFor();
    await screen.getByText('Imam al-Bukhari').first().waitFor();
    await screen
      .getByText('Classical Hanafi, Maliki, Shafi‘i and Hanbali sources')
      .first()
      .waitFor();
    await screen.getByText('al-Hidayah', { exact: false }).first().waitFor();

    await screen.locator('[data-knowledge-filter="quran"]').click();
    await screen.locator('[data-quran-reading-controls]').waitFor();
    assert(
      (await screen.locator('[data-quran-tafsir]').count()) === 3,
      'Qur’an tafsir summaries are not visible',
    );
    await screen.getByText('Tafsir al-Jalalayn', { exact: true }).first().waitFor();

    await screen.getByRole('searchbox').fill('humility');
    assert(
      (await screen.locator('[data-knowledge-module="quran"]').count()) === 1,
      'Qur’an topic search did not isolate the expected ayah',
    );
    await screen.getByRole('searchbox').fill('');

    const firstAyah = screen.locator('[data-quran-ayah-id]').first();
    await firstAyah.locator('[data-quran-bookmark]').click();
    assert(
      (await firstAyah.getAttribute('data-quran-bookmarked')) === 'true',
      'Qur’an bookmark state did not update',
    );
    await firstAyah.locator('[data-quran-last-read]').click();

    await screen.locator('[data-quran-translation-mode]').selectOption('none');
    assert(
      (await screen.locator('[data-quran-translation]').count()) === 0,
      'Arabic-only mode still rendered the translation',
    );
    await screen.locator('[data-quran-size-select]').selectOption('xlarge');
    assert(
      (await firstAyah.locator('[data-quran-scale]').getAttribute('data-quran-scale')) === 'xlarge',
      'Qur’an Arabic font scale did not update',
    );

    const persistedReader = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('salahos.quran-reading-preferences.v1') ?? '{}'),
    );
    assert(
      persistedReader.bookmarkedAyahIds?.includes('quran-prayer-remembrance'),
      'Qur’an bookmark did not persist',
    );
    assert(
      persistedReader.lastReadAyahId === 'quran-prayer-remembrance',
      'Qur’an last-read position did not persist',
    );
    assert(persistedReader.translationMode === 'none', 'Qur’an translation mode did not persist');
    assert(persistedReader.fontScale === 'xlarge', 'Qur’an font scale did not persist');

    await firstAyah.locator('[data-quran-related] button').first().click();
    assert(
      (await screen.locator('[data-knowledge-module="quran"]').count()) === 1,
      'Related ayah navigation did not isolate the selected ayah',
    );
    await screen.getByRole('searchbox').fill('');

    await screen.locator('[data-quran-bookmarks-only]').click();
    assert(
      (await screen.locator('[data-knowledge-module="quran"]').count()) === 1,
      'Bookmark-only mode did not isolate bookmarked ayat',
    );
    await screen.locator('[data-quran-bookmarks-only]').click();

    await screen.locator('[data-knowledge-filter="hadith"]').click();
    assert(
      (await screen.locator('.knowledge-card').count()) === 3,
      'Hadith filter did not isolate entries',
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
      path: path.join(artifactDirectory, 'stage55-quran-expansion-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'quran-expansion-mobile', ...metrics });
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
    await screen.locator('[data-knowledge-filter="quran"]').click();
    await screen.locator('[data-quran-reading-controls]').waitFor();
    await screen.getByText('إعدادات قراءة القرآن').waitFor();
    await screen.locator('[data-quran-font-select]').selectOption('traditional');
    await screen.locator('[data-quran-size-select]').selectOption('large');

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
      path: path.join(artifactDirectory, 'stage55-quran-expansion-rtl.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'quran-expansion-rtl', ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage55-quran-expansion-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 55 Quran expansion acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
