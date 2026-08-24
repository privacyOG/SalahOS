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
    window.__stage49Playbacks = [];
    HTMLMediaElement.prototype.play = function play() {
      window.__stage49Playbacks.push({ src: this.src, volume: this.volume });
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {};
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
    await page.goto(`${baseUrl}/?view=settings&settingsView=notifications`, {
      waitUntil: 'networkidle',
    });

    const library = page.locator('.adhan-audio-library');
    await library.waitFor({ state: 'visible' });
    assert(
      (await library.locator('[data-adhan-source]').count()) === 2,
      'Adhan library did not expose both packaged recordings',
    );
    await library.getByText('CC0-1.0').waitFor();
    await library.getByText('CC-BY-3.0').waitFor();

    await library
      .getByRole('button', { name: 'Preview: Fajr Adhan — Malmö Mosque' })
      .click();
    const preview = await page.evaluate(() => window.__stage49Playbacks.at(-1) ?? null);
    assert(
      preview?.src.endsWith('/audio/adhan/fajr-malmo.mp3') === true,
      'Fajr packaged preview did not resolve to the bundled MP3',
    );
    assert(Math.abs(preview.volume - 0.85) < 0.001, 'Default preview volume was not 85%');

    await library.locator('[data-adhan-prayer="fajr"]').selectOption('fajr-malmo');
    await library.getByTestId('adhan-volume').fill('62');
    await library.getByTestId('adhan-notification-only').check();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.adhanAudioPreferences');
      return raw === null ? null : JSON.parse(raw);
    });
    assert(stored !== null, 'Adhan library preferences were not persisted');
    assert(
      stored.prayerSelections.fajr === 'fajr-malmo',
      'Fajr per-prayer source override was not persisted',
    );
    assert(stored.volumePercent === 62, 'Adhan playback volume was not persisted');
    assert(stored.notificationOnly === true, 'Notification-only mode was not persisted');

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `Adhan library caused mobile horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage49-adhan-audio-library-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'mobile-library-selection', preview, stored, ...metrics });
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
    await page.goto(`${baseUrl}/?view=settings&settingsView=notifications`, {
      waitUntil: 'networkidle',
    });

    const library = page.locator('.adhan-audio-library');
    await library.waitFor({ state: 'visible' });
    await library.getByText('مكتبة أصوات الأذان').waitFor();
    await library.getByText('إشعار فقط').waitFor();

    const metrics = await page.evaluate(() => {
      const libraryElement = document.querySelector('.adhan-audio-library');
      const rect = libraryElement?.getBoundingClientRect();
      return {
        htmlDir: document.documentElement.dir,
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        libraryLeft: rect?.left ?? -1,
        libraryRight: rect?.right ?? -1,
      };
    });
    assert(metrics.htmlDir === 'rtl', 'Arabic Adhan library fixture did not apply RTL');
    assert(
      metrics.scrollWidth <= metrics.innerWidth + 1,
      `RTL Adhan library caused horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );
    assert(
      metrics.libraryLeft >= -1 && metrics.libraryRight <= metrics.innerWidth + 1,
      'RTL Adhan library escaped the mobile viewport',
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'stage49-adhan-audio-library-rtl.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'rtl-mobile-library', ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage49-adhan-audio-library-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 49 Adhan audio library acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
