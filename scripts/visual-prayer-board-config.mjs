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
const allowedOrigin = new URL(baseUrl).origin;

function settingsFor(locale) {
  return {
    version: 2,
    locale,
    theme: locale === 'ar' ? 'dark' : 'light',
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

function board(templateId, locale, mosqueName) {
  const artworkId = {
    'heritage-classic': 'geometric-heritage',
    'minimal-modern': 'quiet-grid',
    'bold-countdown-focus': 'countdown-field',
    'structured-split-board': 'structured-lines',
    'scenic-spiritual': 'scenic-gradient',
    'family-classroom': 'classroom-pattern',
  }[templateId];
  return {
    version: 1,
    templateId,
    primaryLocale: locale,
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: locale === 'ar' ? 'midnight' : 'neutral',
    moduleVisibility: {
      'current-time': true,
      dates: true,
      'next-prayer': true,
      countdown: true,
      'prayer-timetable': true,
      jumuah: true,
      'sunrise-sunset': true,
      'mosque-branding': true,
      announcements: false,
      weather: false,
    },
    branding: { mosqueName: { [locale]: mosqueName }, logo: null },
    background: { kind: 'builtin', artworkId },
  };
}

async function seed(page, locale, config) {
  await page.addInitScript(
    ({ serializedSettings, serializedConfig }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.prayerBoardDisplayConfig', serializedConfig);
    },
    {
      serializedSettings: JSON.stringify(settingsFor(locale)),
      serializedConfig: JSON.stringify(config),
    },
  );
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function overflowState(page) {
  return page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));
}

async function validateRuntime(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    try {
      if (new URL(url).origin !== allowedOrigin) externalRequests.push(url);
    } catch {
      externalRequests.push(url);
    }
  });

  try {
    const config = board(scenario.templateId, scenario.locale, scenario.mosqueName);
    await seed(page, scenario.locale, config);
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const root = page.locator('.smart-display');
    await root.waitFor({ state: 'visible' });

    if ((await root.getAttribute('data-display-template')) !== scenario.templateId) {
      throw new Error(`${scenario.name} did not consume persisted template configuration`);
    }
    if (
      (await page.locator(`[data-prayer-board-template="${scenario.templateId}"]`).count()) !== 1
    ) {
      throw new Error(`${scenario.name} did not render the persisted prayer-board template`);
    }
    if ((await page.locator('[data-prayer-name]').count()) < 5) {
      throw new Error(`${scenario.name} did not preserve the five-prayer timetable`);
    }
    const body = (await page.locator('body').textContent()) ?? '';
    if (!body.includes(scenario.mosqueName)) {
      throw new Error(`${scenario.name} did not render persisted mosque branding`);
    }
    if (
      scenario.locale === 'ar' &&
      (await page.evaluate(() => document.documentElement.dir)) !== 'rtl'
    ) {
      throw new Error('Arabic persisted display configuration did not render RTL');
    }

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.prayerBoardDisplayConfig');
      return raw === null ? null : JSON.parse(raw);
    });
    if (
      persisted?.templateId !== scenario.templateId ||
      persisted?.background?.kind !== 'builtin' ||
      typeof persisted?.background?.artworkId !== 'string'
    ) {
      throw new Error(
        `${scenario.name} persisted config was not retained: ${JSON.stringify(persisted)}`,
      );
    }
    for (const core of ['current-time', 'next-prayer', 'countdown', 'prayer-timetable']) {
      if (persisted.moduleVisibility?.[core] !== true) {
        throw new Error(`${scenario.name} core module ${core} was not visible`);
      }
    }

    const overflow = await overflowState(page);
    if (
      overflow.bodyScrollWidth > overflow.width + 2 ||
      overflow.documentScrollWidth > overflow.width + 2
    ) {
      throw new Error(`${scenario.name} display overflow: ${JSON.stringify(overflow)}`);
    }
    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);
    if (externalRequests.length > 0) {
      throw new Error(`${scenario.name} external requests: ${JSON.stringify(externalRequests)}`);
    }

    await capture(page, scenario.name);
    return {
      name: scenario.name,
      template: scenario.templateId,
      locale: scenario.locale,
      persisted: true,
    };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const scenario of [
    {
      name: 'prayer-board-config-runtime-en',
      templateId: 'minimal-modern',
      locale: 'en',
      mosqueName: 'Stage 23 Local Masjid',
    },
    {
      name: 'prayer-board-config-runtime-ar-rtl',
      templateId: 'family-classroom',
      locale: 'ar',
      mosqueName: 'مسجد المرحلة ٢٣',
    },
  ]) {
    results.push(await validateRuntime(browser, scenario));
  }
  await writeFile(
    path.join(artifactDirectory, 'prayer-board-config-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Prayer-board persisted configuration checks passed: ${results.length} flows`);
} finally {
  await browser.close();
}
