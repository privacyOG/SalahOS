import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
const harnessRoot = process.env.SALAHOS_VISUAL_HARNESS_ROOT ?? '/tmp/salahos-visual-harness';
const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);
const baselineDirectory = path.resolve('tests/golden');
const recordMode = process.env.SALAHOS_GOLDEN_RECORD === '1';
const fixedNow = Date.parse('2026-08-21T03:00:00.000Z');

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const requireFromHarness = createRequire(path.join(harnessRoot, 'package.json'));

function persistedSettings(locale, theme) {
  return {
    version: 2,
    locale,
    theme,
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

async function seed(page, locale, theme) {
  await page.addInitScript(
    ({ now, settings }) => {
      const NativeDate = Date;
      class FixedDate extends NativeDate {
        constructor(...args) {
          super(...(args.length === 0 ? [now] : args));
        }
        static now() {
          return now;
        }
      }
      globalThis.Date = FixedDate;
      localStorage.setItem('salahos.settings', JSON.stringify(settings));
    },
    { now: fixedNow, settings: persistedSettings(locale, theme) },
  );
}

const scenarios = [
  {
    name: 'today-phone-en-light',
    url: '/?view=today',
    locale: 'en',
    theme: 'light',
    viewport: { width: 390, height: 844 },
    ready: '.today-screen',
  },
  {
    name: 'knowledge-phone-ar-dark',
    url: '/?view=knowledge',
    locale: 'ar',
    theme: 'dark',
    viewport: { width: 390, height: 844 },
    ready: '[data-knowledge-screen]',
    // Stage 54 intentionally replaces the prior English Qur'an paraphrase with the
    // governed Pickthall 1930 wording. Exact provenance/content is asserted by the
    // dedicated Islamic Knowledge acceptance; keep only this known text delta scoped here.
    maxDifferenceRatio: 0.008,
  },
];

await mkdir(artifactDirectory, { recursive: true });
if (recordMode) await mkdir(baselineDirectory, { recursive: true });

let PNG;
let pixelmatch;
if (!recordMode) {
  ({ PNG } = requireFromHarness('pngjs'));
  pixelmatch = (await import(pathToFileURL(requireFromHarness.resolve('pixelmatch')).href)).default;
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
      colorScheme: scenario.theme,
    });
    const page = await context.newPage();
    await seed(page, scenario.locale, scenario.theme);
    await page.goto(`${baseUrl}${scenario.url}`, { waitUntil: 'networkidle' });
    await page.locator(scenario.ready).waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    const actual = await page.screenshot({ fullPage: false, animations: 'disabled' });
    const actualPath = path.join(artifactDirectory, `golden-${scenario.name}-actual.png`);
    await writeFile(actualPath, actual);

    const baselinePath = path.join(baselineDirectory, `${scenario.name}.png`);
    if (recordMode) {
      await writeFile(baselinePath, actual);
      results.push({ name: scenario.name, recorded: true });
      await context.close();
      continue;
    }

    const baseline = await readFile(baselinePath);
    const baselinePng = PNG.sync.read(baseline);
    const actualPng = PNG.sync.read(actual);
    if (baselinePng.width !== actualPng.width || baselinePng.height !== actualPng.height) {
      throw new Error(
        `${scenario.name} golden dimensions changed: ${String(actualPng.width)}x${String(actualPng.height)} != ${String(baselinePng.width)}x${String(baselinePng.height)}`,
      );
    }

    const diff = new PNG({ width: actualPng.width, height: actualPng.height });
    const changedPixels = pixelmatch(
      baselinePng.data,
      actualPng.data,
      diff.data,
      actualPng.width,
      actualPng.height,
      { threshold: 0.1, includeAA: false },
    );
    const totalPixels = actualPng.width * actualPng.height;
    const differenceRatio = changedPixels / totalPixels;
    const maxDifferenceRatio = scenario.maxDifferenceRatio ?? 0.005;
    await writeFile(
      path.join(artifactDirectory, `golden-${scenario.name}-diff.png`),
      PNG.sync.write(diff),
    );
    if (differenceRatio > maxDifferenceRatio) {
      throw new Error(
        `${scenario.name} golden screenshot changed by ${(differenceRatio * 100).toFixed(3)}% (${String(changedPixels)} pixels), above ${(maxDifferenceRatio * 100).toFixed(3)}%`,
      );
    }
    results.push({
      name: scenario.name,
      changedPixels,
      totalPixels,
      differenceRatio,
      maxDifferenceRatio,
    });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'golden-regression-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(
    recordMode
      ? `Recorded ${String(results.length)} golden screenshot baselines.`
      : `Golden screenshot regression passed ${String(results.length)} scenarios.`,
  );
} finally {
  await browser.close();
}
