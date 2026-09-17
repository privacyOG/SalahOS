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
    }, persistedSettings());

    await page.goto(`${baseUrl}/?view=knowledge&knowledgeView=hadith`, { waitUntil: 'networkidle' });
    const library = page.locator('[data-hadith-library]');
    await library.waitFor({ state: 'visible' });

    const scholarSelect = library.locator('[data-hadith-scholar-select]');
    const collectionSelect = library.locator('[data-hadith-collection-select]');
    const search = library.locator('[data-hadith-library-search]');

    const scholarLabels = await scholarSelect.locator('option').allTextContents();
    assert(scholarLabels.includes('Imam al-Nawawi'), 'Nawawi is missing from scholar navigation');
    assert(scholarLabels.includes('Imam al-Bukhari'), 'al-Bukhari is missing from scholar navigation');
    assert(scholarLabels.includes('Imam Muslim'), 'Muslim is missing from scholar navigation');

    await scholarSelect.selectOption({ label: 'Imam al-Nawawi' });
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-hadith-library-entry]').length === 42;
    });
    assert(
      (await library.locator('[data-hadith-library-entry]').count()) === 42,
      'Selecting Imam al-Nawawi did not expose all 42 supplied entries',
    );

    const nawawiCollection = library.locator('[data-hadith-collection-select] option').filter({
      hasText: 'The Forty Nawawi Hadiths',
    });
    assert((await nawawiCollection.count()) === 1, 'Nawawi collection is missing from collection menu');
    await collectionSelect.selectOption('nawawi-forty');

    await search.fill('intentions');
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-hadith-library-entry]').length === 1;
    });
    const matched = library.locator('[data-hadith-library-entry]');
    assert((await matched.getAttribute('data-hadith-library-entry')) === 'nawawi-01', 'Intentions search did not locate the first Nawawi hadith');

    await search.fill('');
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-hadith-library-entry]').length === 42;
    });

    const hadith29 = library.locator('[data-hadith-library-entry="nawawi-29"]');
    await hadith29.locator('summary').click();
    const arabic = hadith29.locator('[data-hadith-library-arabic]').first();
    await arabic.waitFor({ state: 'visible' });
    await arabic.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);

    const arabicMetrics = await arabic.evaluate((element) => {
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      const lines = new Map();
      for (const rect of rects) {
        const key = Math.round(rect.top);
        const current = lines.get(key);
        lines.set(key, current === undefined ? rect.right : Math.max(current, rect.right));
      }
      const paragraphRect = element.getBoundingClientRect();
      const contentRight = paragraphRect.right - Number.parseFloat(style.paddingRight || '0');
      const lineRightEdges = [...lines.values()];
      return {
        direction: style.direction,
        textAlign: style.textAlign,
        textAlignLast: style.textAlignLast,
        lineCount: lineRightEdges.length,
        rightEdgeDeltas: lineRightEdges.map((right) => Math.abs(contentRight - right)),
        right: paragraphRect.right,
        left: paragraphRect.left,
        viewportWidth: innerWidth,
      };
    });

    assert(arabicMetrics.direction === 'rtl', `Arabic direction is ${arabicMetrics.direction}, expected rtl`);
    assert(arabicMetrics.textAlign === 'right', `Arabic text-align is ${arabicMetrics.textAlign}, expected right`);
    assert(arabicMetrics.textAlignLast === 'right', `Arabic text-align-last is ${arabicMetrics.textAlignLast}, expected right`);
    assert(arabicMetrics.lineCount >= 2, `Arabic acceptance text did not wrap at ${String(viewport.width)}px`);
    assert(
      arabicMetrics.rightEdgeDeltas.every((delta) => delta <= 8),
      `Wrapped Arabic lines are not consistently right-aligned: ${arabicMetrics.rightEdgeDeltas.join(', ')}`,
    );

    const layout = await page.evaluate(() => {
      const root = document.querySelector('[data-hadith-library]');
      if (!(root instanceof HTMLElement)) throw new Error('Hadith library root missing');
      const rect = root.getBoundingClientRect();
      return {
        innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        rootLeft: rect.left,
        rootRight: rect.right,
        rootScrollWidth: root.scrollWidth,
        rootClientWidth: root.clientWidth,
      };
    });
    assert(layout.rootLeft >= -1, `Hadith library begins outside viewport: ${String(layout.rootLeft)}px`);
    assert(layout.rootRight <= layout.innerWidth + 1, `Hadith library exceeds viewport: ${String(layout.rootRight)}px`);
    assert(layout.rootScrollWidth <= layout.rootClientWidth + 1, 'Hadith library has internal horizontal overflow');
    assert(layout.documentScrollWidth <= layout.innerWidth + 1, 'Hadith library causes document horizontal overflow');

    await page.screenshot({
      path: path.join(artifactDirectory, `stage57-hadith-library-${viewport.name}.png`),
      animations: 'disabled',
      fullPage: true,
    });
    await arabic.screenshot({
      path: path.join(artifactDirectory, `stage57-hadith-arabic-rtl-${viewport.name}.png`),
      animations: 'disabled',
    });

    results.push({ viewport, scholarLabels, arabicMetrics, layout });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'stage57-hadith-library-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log('Stage 57 Hadith scholar/collection library acceptance passed.');
} finally {
  await browser.close();
}
