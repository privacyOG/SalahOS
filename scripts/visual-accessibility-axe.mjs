import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
const harnessRoot = process.env.SALAHOS_VISUAL_HARNESS_ROOT ?? '/tmp/salahos-visual-harness';
const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const requireFromHarness = createRequire(path.join(harnessRoot, 'package.json'));
const axePath = requireFromHarness.resolve('axe-core/axe.min.js');

function settings(locale = 'en', theme = 'light') {
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
  await page.addInitScript((persisted) => {
    localStorage.setItem('salahos.settings', JSON.stringify(persisted));
  }, settings(locale, theme));
}

async function runAxe(page, scenario) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const axe = globalThis.axe;
    return axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
    });
  });
  const blocking = result.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  if (blocking.length > 0) {
    throw new Error(
      `${scenario.name} has blocking axe violations: ${blocking
        .map((violation) => `${violation.id}(${String(violation.nodes.length)})`)
        .join(', ')}`,
    );
  }
  return {
    name: scenario.name,
    violations: result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
  };
}

async function assertViewportContainment(page, scenario) {
  const metrics = await page.evaluate(() => {
    const escaped = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.position === 'fixed' && style.visibility === 'hidden') return false;
        return rect.width > 0 && (rect.left < -2 || rect.right > window.innerWidth + 2);
      })
      .slice(0, 10)
      .map((element) => ({
        tag: element.tagName,
        className: element.getAttribute('class') ?? '',
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }));
    return {
      dir: document.documentElement.dir,
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      escaped,
    };
  });
  if (scenario.locale === 'ar' && metrics.dir !== 'rtl') {
    throw new Error(`${scenario.name} did not apply document RTL direction`);
  }
  if (metrics.scrollWidth > metrics.viewport + 1 || metrics.escaped.length > 0) {
    throw new Error(`${scenario.name} viewport containment failed: ${JSON.stringify(metrics)}`);
  }
  return metrics;
}

const scenarios = [
  { name: 'axe-today-en', url: '/?view=today', ready: '.today-screen', locale: 'en', theme: 'light' },
  {
    name: 'axe-knowledge-ar',
    url: '/?view=knowledge',
    ready: '[data-knowledge-screen]',
    locale: 'ar',
    theme: 'dark',
  },
  {
    name: 'axe-settings-ar',
    url: '/?view=settings',
    ready: '.settings-screen',
    locale: 'ar',
    theme: 'dark',
  },
];

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, scenario.locale, scenario.theme);
    await page.goto(`${baseUrl}${scenario.url}`, { waitUntil: 'networkidle' });
    await page.locator(scenario.ready).waitFor({ state: 'visible' });
    const containment = await assertViewportContainment(page, scenario);
    const axe = await runAxe(page, scenario);
    results.push({ ...axe, containment });
    await context.close();
  }
  await writeFile(
    path.join(artifactDirectory, 'axe-accessibility-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Axe WCAG and RTL/container acceptance passed ${String(results.length)} scenarios.`);
} finally {
  await browser.close();
}
