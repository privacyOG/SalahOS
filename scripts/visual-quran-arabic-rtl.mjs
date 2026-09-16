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
      localStorage.removeItem('salahos.quran-reading-preferences.v1');
    }, persistedSettings());

    await page.goto(`${baseUrl}/?view=knowledge&knowledgeView=quran`, { waitUntil: 'networkidle' });

    const picker = page.locator('[data-quran-quick-navigation]');
    await picker.waitFor({ state: 'visible' });
    await picker.locator('[data-quran-surah-select]').selectOption('2');

    const ayah = page.locator('[data-quran-offline-ayah="2:2"]');
    await ayah.waitFor({ state: 'visible' });
    const arabic = ayah.locator('.knowledge-card__arabic[lang="ar"][dir="rtl"]');
    await arabic.waitFor({ state: 'visible' });
    await arabic.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);

    const metrics = await arabic.evaluate((element) => {
      const style = getComputedStyle(element);
      const textNode = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0,
      );
      if (!textNode) throw new Error('Qur’an Arabic paragraph did not expose a text node');

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      const lines = new Map();
      for (const rect of rects) {
        const key = Math.round(rect.top);
        const existing = lines.get(key);
        lines.set(key, existing === undefined ? rect.right : Math.max(existing, rect.right));
      }

      const paragraphRect = element.getBoundingClientRect();
      const contentRight = paragraphRect.right - Number.parseFloat(style.paddingRight || '0');
      const lineRightEdges = [...lines.values()];
      return {
        direction: style.direction,
        textAlign: style.textAlign,
        textAlignLast: style.textAlignLast,
        lineCount: lineRightEdges.length,
        contentRight,
        lineRightEdges,
        rightEdgeDeltas: lineRightEdges.map((right) => Math.abs(contentRight - right)),
        paragraphWidth: paragraphRect.width,
        viewportWidth: innerWidth,
      };
    });

    assert(metrics.direction === 'rtl', `Arabic direction is ${metrics.direction}, expected rtl`);
    assert(
      metrics.textAlign === 'right',
      `Arabic text-align is ${metrics.textAlign}, expected right`,
    );
    assert(
      metrics.textAlignLast === 'right',
      `Arabic text-align-last is ${metrics.textAlignLast}, expected right`,
    );
    assert(metrics.lineCount >= 2, `Qur’an 2:2 did not wrap at ${String(viewport.width)}px`);
    assert(
      metrics.rightEdgeDeltas.every((delta) => delta <= 8),
      `Wrapped Arabic lines are not consistently right aligned: ${metrics.rightEdgeDeltas.join(', ')}`,
    );
    assert(
      metrics.paragraphWidth <= metrics.viewportWidth,
      `Arabic paragraph exceeds viewport: ${String(metrics.paragraphWidth)}px > ${String(metrics.viewportWidth)}px`,
    );

    await arabic.screenshot({
      path: path.join(artifactDirectory, `quran-arabic-rtl-2-2-${viewport.name}.png`),
      animations: 'disabled',
    });

    results.push({ viewport, ...metrics });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'quran-arabic-rtl-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(
    `Qur’an wrapped Arabic RTL acceptance passed ${String(results.length)} mobile viewports.`,
  );
} finally {
  await browser.close();
}
