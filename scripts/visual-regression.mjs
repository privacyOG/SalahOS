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

const fixedNow = Date.parse('2026-08-17T05:30:00.000Z');

function settingsFor(locale, theme) {
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
      coordinates: {
        latitude: -33.8688,
        longitude: 151.2093,
      },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

const applicationScenarios = [
  { name: 'phone-portrait-en-light', width: 390, height: 844, locale: 'en', theme: 'light' },
  { name: 'phone-portrait-ar-dark', width: 390, height: 844, locale: 'ar', theme: 'dark' },
  { name: 'phone-landscape-en-dark', width: 844, height: 390, locale: 'en', theme: 'dark' },
  { name: 'tablet-en-light', width: 1024, height: 1366, locale: 'en', theme: 'light' },
  { name: 'tablet-ar-dark', width: 1024, height: 1366, locale: 'ar', theme: 'dark' },
  { name: 'kiosk-1080-en-dark', width: 1920, height: 1080, locale: 'en', theme: 'dark' },
  { name: 'kiosk-1080-ar-light', width: 1920, height: 1080, locale: 'ar', theme: 'light' },
  { name: 'large-4k-en-dark', width: 3840, height: 2160, locale: 'en', theme: 'dark' },
  {
    name: 'phone-large-text-ar-dark',
    width: 390,
    height: 844,
    locale: 'ar',
    theme: 'dark',
    url: '?view=settings',
    fontScale: 1.25,
    openSettings: true,
  },
  {
    name: 'phone-settings-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    url: '?view=settings',
    readySelector: '.settings-category-grid',
  },
  {
    name: 'phone-settings-appearance-ar-dark',
    width: 390,
    height: 844,
    locale: 'ar',
    theme: 'dark',
    url: '?view=settings&settingsView=appearance',
    readySelector: '.settings-focus-panel',
  },
  {
    name: 'tablet-settings-prayer-en-light',
    width: 1024,
    height: 1366,
    locale: 'en',
    theme: 'light',
    url: '?view=settings&settingsView=prayer',
    readySelector: '.settings-focus-panel',
  },
  {
    name: 'phone-mosques-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    url: '?view=mosques',
    readySelector: '.mosque-profiles-panel',
  },
  {
    name: 'phone-qiblah-en-dark',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'dark',
    url: '?view=qiblah',
    readySelector: '.qibla-finder',
  },
  {
    name: 'tablet-community-ar-dark',
    width: 1024,
    height: 1366,
    locale: 'ar',
    theme: 'dark',
    url: '?view=community',
    readySelector: '.community-updates-panel',
  },
  {
    name: 'desktop-admin-en-light',
    width: 1440,
    height: 1000,
    locale: 'en',
    theme: 'light',
    url: '?surface=admin',
    readySelector: '.admin-shell',
  },
];

const touchDisplayScenarios = [
  {
    name: 'touch-5-portrait-en',
    width: 720,
    height: 1280,
    url: '?fixture=touch-display-2&display=5&orientation=portrait&locale=en',
    locale: 'en',
  },
  {
    name: 'touch-7-portrait-ar',
    width: 720,
    height: 1280,
    url: '?fixture=touch-display-2&display=7&orientation=portrait&locale=ar',
    locale: 'ar',
  },
  {
    name: 'touch-10-portrait-en',
    width: 1200,
    height: 1920,
    url: '?fixture=touch-display-2&display=10&orientation=portrait&locale=en',
    locale: 'en',
  },
  {
    name: 'touch-7-landscape-en',
    width: 1280,
    height: 720,
    url: '?fixture=touch-display-2&display=7&orientation=landscape&locale=en',
    locale: 'en',
  },
  {
    name: 'touch-10-landscape-ar',
    width: 1920,
    height: 1200,
    url: '?fixture=touch-display-2&display=10&orientation=landscape&locale=ar',
    locale: 'ar',
  },
];

function expectedDirection(locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

async function seedApplication(page, locale, theme) {
  await page.addInitScript(
    ({ serializedSettings, frozenNow }) => {
      localStorage.setItem('salahos.settings', serializedSettings);

      const NativeDate = Date;
      class FrozenDate extends NativeDate {
        constructor(...args) {
          if (args.length === 0) {
            super(frozenNow);
          } else {
            super(...args);
          }
        }

        static now() {
          return frozenNow;
        }
      }

      Object.setPrototypeOf(FrozenDate, NativeDate);
      globalThis.Date = FrozenDate;
    },
    {
      serializedSettings: JSON.stringify(settingsFor(locale, theme)),
      frozenNow: fixedNow,
    },
  );
}

async function findHorizontalOverflow(page) {
  return page.evaluate(() => {
    const tolerance = 2;
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = [];

    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const outsideViewport = rect.left < -tolerance || rect.right > viewportWidth + tolerance;
      const isFormControl =
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLButtonElement;
      const explicitlyClipsContent =
        !isFormControl &&
        element.clientWidth > 0 &&
        element.scrollWidth > element.clientWidth + tolerance &&
        (style.overflowX === 'hidden' || style.overflowX === 'clip');

      if (!outsideViewport && !explicitlyClipsContent) continue;

      offenders.push({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: style.overflowX,
      });

      if (offenders.length >= 12) break;
    }

    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth,
      offenders,
    };
  });
}

function assertNoHorizontalOverflow(name, overflow) {
  if (
    overflow.bodyScrollWidth > overflow.viewportWidth + 2 ||
    overflow.documentScrollWidth > overflow.viewportWidth + 2 ||
    overflow.offenders.length > 0
  ) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function validateApplicationScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await seedApplication(page, scenario.locale, scenario.theme);
    const targetUrl = scenario.url ? `${baseUrl}/${scenario.url}` : baseUrl;
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.locator(scenario.readySelector ?? '.app-shell').waitFor({ state: 'visible' });

    if (scenario.fontScale) {
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${String(scale * 100)}%`;
      }, scenario.fontScale);
    }

    if (scenario.openSettings) {
      await page.locator('.settings-panel').evaluate((element) => {
        element.open = true;
      });
    }

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const documentState = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      theme: document.documentElement.dataset.theme ?? null,
      width: innerWidth,
      height: innerHeight,
    }));

    if (documentState.lang !== scenario.locale) {
      throw new Error(
        `${scenario.name} expected lang=${scenario.locale}, got ${documentState.lang}`,
      );
    }
    if (documentState.dir !== expectedDirection(scenario.locale)) {
      throw new Error(
        `${scenario.name} expected dir=${expectedDirection(scenario.locale)}, got ${documentState.dir}`,
      );
    }
    if (documentState.theme !== scenario.theme) {
      throw new Error(
        `${scenario.name} expected theme=${scenario.theme}, got ${documentState.theme}`,
      );
    }
    if (documentState.width !== scenario.width || documentState.height !== scenario.height) {
      throw new Error(`${scenario.name} viewport mismatch: ${JSON.stringify(documentState)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }

    const overflow = await findHorizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    return { name: scenario.name, status: 'passed', overflow };
  } finally {
    await context.close();
  }
}

async function validateTouchDisplayScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/${scenario.url}`, { waitUntil: 'networkidle' });
    const fixture = page.locator('.touch-display-fixture');
    await fixture.waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    const fixtureState = await fixture.evaluate((element) => ({
      lang: element.getAttribute('lang'),
      dir: element.getAttribute('dir'),
      viewport: element.getAttribute('data-viewport'),
      width: innerWidth,
      height: innerHeight,
    }));

    const expectedViewport = `${String(scenario.width)}x${String(scenario.height)}`;
    if (fixtureState.lang !== scenario.locale) {
      throw new Error(
        `${scenario.name} expected fixture lang=${scenario.locale}, got ${fixtureState.lang}`,
      );
    }
    if (fixtureState.dir !== expectedDirection(scenario.locale)) {
      throw new Error(
        `${scenario.name} expected fixture dir=${expectedDirection(scenario.locale)}, got ${fixtureState.dir}`,
      );
    }
    if (fixtureState.viewport !== expectedViewport) {
      throw new Error(
        `${scenario.name} expected data-viewport=${expectedViewport}, got ${fixtureState.viewport}`,
      );
    }
    if (fixtureState.width !== scenario.width || fixtureState.height !== scenario.height) {
      throw new Error(`${scenario.name} viewport mismatch: ${JSON.stringify(fixtureState)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }

    const overflow = await findHorizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    return { name: scenario.name, status: 'passed', overflow };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

try {
  for (const scenario of applicationScenarios) {
    try {
      results.push(await validateApplicationScenario(browser, scenario));
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: scenario.name, message });
      results.push({ name: scenario.name, status: 'failed', message });
      console.error(`FAIL ${scenario.name}: ${message}`);
    }
  }

  for (const scenario of touchDisplayScenarios) {
    try {
      results.push(await validateTouchDisplayScenario(browser, scenario));
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: scenario.name, message });
      results.push({ name: scenario.name, status: 'failed', message });
      console.error(`FAIL ${scenario.name}: ${message}`);
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'results.json'),
  `${JSON.stringify(
    {
      generatedAt: new Date(fixedNow).toISOString(),
      baseUrl,
      scenarios: results,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Visual regression failures: ${JSON.stringify(failures)}`);
}

console.log(`Visual regression passed ${String(results.length)} scenarios.`);
