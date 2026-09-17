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

function persistedSettings() {
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

function assertInsideViewport(metrics, label) {
  assert(
    metrics.left >= -1,
    `${label} begins outside the mobile viewport: ${String(metrics.left)}px`,
  );
  assert(
    metrics.right <= metrics.innerWidth + 1,
    `${label} extends beyond the mobile viewport: ${String(metrics.right)}px > ${String(metrics.innerWidth)}px`,
  );
  assert(
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `${label} has internal horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.clientWidth)}px`,
  );
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of [
    { width: 390, height: 844, name: 'phone-390' },
    { width: 320, height: 568, name: 'phone-320' },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.addInitScript((settings) => {
      localStorage.setItem('salahos.settings', JSON.stringify(settings));
      localStorage.removeItem('salahos.quran-reading-preferences.v1');
    }, persistedSettings());

    await page.goto(`${baseUrl}/?view=knowledge&knowledgeView=quran`, { waitUntil: 'networkidle' });

    const experience = page.locator('[data-knowledge-experience]');
    await experience.waitFor({ state: 'visible' });
    const reader = page.locator('[data-quran-offline-reader]');
    await reader.waitFor({ state: 'visible' });
    const picker = page.locator('[data-quran-quick-navigation]');
    await picker.waitFor({ state: 'visible' });

    const surahSelect = picker.locator('[data-quran-surah-select]');
    const ayahSelect = picker.locator('[data-quran-ayah-select]');
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-quran-surah-select] option').length === 114;
    });
    assert(
      (await surahSelect.locator('option').count()) === 114,
      'Quick Qur’an navigation did not expose all 114 surahs',
    );

    await picker.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactDirectory, `stage56-quran-navigation-${viewport.name}.png`),
      animations: 'disabled',
    });

    await surahSelect.selectOption('2');
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-quran-ayah-select] option').length === 286;
    });
    assert(
      (await ayahSelect.locator('option').count()) === 286,
      'Selecting Al-Baqarah did not populate all 286 ayat',
    );

    await ayahSelect.selectOption('2:255');
    const ayatAlKursi = reader.locator('[data-quran-offline-ayah="2:255"]');
    await ayatAlKursi.waitFor({ state: 'visible' });
    const translation = ayatAlKursi.locator('[data-quran-offline-translation]');
    await translation.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      return (
        document
          .querySelector('[data-quran-offline-ayah="2:255"] [data-quran-offline-translation]')
          ?.getAttribute('data-quran-visible-reference') === '2:255'
      );
    });
    assert(
      (await translation.getAttribute('data-quran-visible-reference')) === '2:255',
      'English translation did not expose its canonical verse number',
    );
    const visibleReference = await translation.evaluate(
      (element) => getComputedStyle(element, '::before').content,
    );
    assert(
      visibleReference.includes('2:255'),
      `English translation verse number is not visibly rendered: ${visibleReference}`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, `stage56-quran-verse-reference-${viewport.name}.png`),
      animations: 'disabled',
    });

    const metrics = await page.evaluate(() => {
      const measure = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
        const rect = element.getBoundingClientRect();
        return {
          selector,
          left: rect.left,
          right: rect.right,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          innerWidth: window.innerWidth,
        };
      };
      return {
        innerWidth: window.innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        segments: measure('.knowledge-experience__segments'),
        picker: measure('[data-quran-quick-navigation]'),
        reader: measure('[data-quran-offline-reader]'),
      };
    });

    assert(
      metrics.documentScrollWidth <= metrics.innerWidth + 1,
      `Qur’an Knowledge view caused document horizontal overflow: ${String(metrics.documentScrollWidth)}px > ${String(metrics.innerWidth)}px`,
    );
    assertInsideViewport(metrics.segments, 'Knowledge section navigation');
    assertInsideViewport(metrics.picker, 'Qur’an Surah/Ayah picker');
    assertInsideViewport(metrics.reader, 'Qur’an reader');

    results.push({ viewport, metrics, visibleReference });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage56-quran-navigation-ux-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log('Stage 56 Qur’an navigation UX acceptance passed.');
} finally {
  await browser.close();
}
