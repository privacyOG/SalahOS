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

const viewports = [
  { name: 'phone-320x568', width: 320, height: 568 },
  { name: 'phone-360x780', width: 360, height: 780 },
  { name: 'phone-390x844', width: 390, height: 844 },
  { name: 'phone-430x932', width: 430, height: 932 },
  { name: 'landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
];
const locales = ['en', 'ar'];
const themes = ['light', 'dark', 'system'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function settings(locale, theme) {
  return {
    version: 2,
    locale,
    theme,
    palette: 'salah-classic',
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
    (persisted) => {
      localStorage.setItem('salahos.settings', JSON.stringify(persisted));
    },
    settings(locale, theme),
  );
}

async function pageMetrics(page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    bodyWidth: document.body.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    effectiveTheme: document.documentElement.dataset.theme ?? null,
  }));
}

async function keySurfaceOverflow(page) {
  return page.evaluate(() => {
    const selectors = [
      '.congregation-shell',
      '.congregation-shell-content',
      '.congregation-nav',
      '.today-screen',
      '.today-next',
      '.today-schedule',
      '.today-prayer-table',
    ];
    return selectors.flatMap((selector) =>
      [...document.querySelectorAll(selector)]
        .filter((element) => element instanceof HTMLElement)
        .map((element) => ({
          selector,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }))
        .filter((entry) => entry.scrollWidth > entry.clientWidth + 2),
    );
  });
}

async function navigationState(page) {
  return page.locator('.congregation-nav-item').evaluateAll((buttons) =>
    buttons.map((button) => {
      if (!(button instanceof HTMLElement))
        throw new Error('Navigation button is not an HTMLElement');
      const label = button.querySelector('.congregation-nav-label');
      const rect = button.getBoundingClientRect();
      const labelRect = label?.getBoundingClientRect();
      const style = getComputedStyle(button);
      return {
        id: button.dataset.navigationId ?? '',
        text: label?.textContent?.trim() ?? '',
        width: rect.width,
        height: rect.height,
        visible:
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0,
        labelWidth: labelRect?.width ?? 0,
        labelHeight: labelRect?.height ?? 0,
      };
    }),
  );
}

function assertViewportState(name, metrics, expected) {
  assert(
    metrics.documentWidth <= metrics.innerWidth + 2 && metrics.bodyWidth <= metrics.innerWidth + 2,
    `${name} horizontal page overflow: ${JSON.stringify(metrics)}`,
  );
  assert(metrics.lang === expected.locale, `${name} language mismatch: ${metrics.lang}`);
  assert(metrics.dir === expected.dir, `${name} direction mismatch: ${metrics.dir}`);
  assert(
    metrics.effectiveTheme === expected.effectiveTheme,
    `${name} effective theme mismatch: ${String(metrics.effectiveTheme)} !== ${expected.effectiveTheme}`,
  );
}

function assertNavigation(name, navigation) {
  assert(navigation.length === 7, `${name} expected seven primary navigation items`);
  for (const item of navigation) {
    assert(item.id.length > 0, `${name} navigation item is missing a stable id`);
    assert(item.text.length > 0, `${name} navigation item ${item.id} has no visible label`);
    assert(item.visible, `${name} navigation item ${item.id} is not visible`);
    assert(
      item.width >= 44 && item.height >= 44,
      `${name} navigation item ${item.id} is below 44px`,
    );
    assert(
      item.labelWidth > 0 && item.labelHeight > 0,
      `${name} navigation label ${item.id} is clipped away`,
    );
  }
}

async function runMatrixScenario(browser, viewport, locale, theme, index) {
  const systemDark = index % 2 === 0;
  const effectiveTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: theme === 'system' && systemDark ? 'dark' : 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const name = `${viewport.name}-${locale}-${theme}`;
  try {
    await seed(page, locale, theme);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });
    await page.locator('.congregation-nav').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    const metrics = await pageMetrics(page);
    assertViewportState(name, metrics, {
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      effectiveTheme,
    });
    const overflow = await keySurfaceOverflow(page);
    assert(
      overflow.length === 0,
      `${name} internal horizontal clipping: ${JSON.stringify(overflow)}`,
    );
    const navigation = await navigationState(page);
    assertNavigation(name, navigation);

    if (theme === 'system' && locale === 'ar') {
      await page.screenshot({
        path: path.join(artifactDirectory, `v160-responsive-${viewport.name}-ar-system.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    return { name, metrics, navigationTargets: navigation.length };
  } finally {
    await context.close();
  }
}

async function runTextScaleScenario(browser, viewport, locale) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const name = `text-200-${viewport.name}-${locale}`;
  try {
    await seed(page, locale, 'system');
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.waitForTimeout(50);

    const metrics = await pageMetrics(page);
    assertViewportState(name, metrics, {
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      effectiveTheme: 'dark',
    });
    const overflow = await keySurfaceOverflow(page);
    assert(
      overflow.length === 0,
      `${name} internal horizontal clipping: ${JSON.stringify(overflow)}`,
    );
    const navigation = await navigationState(page);
    assertNavigation(name, navigation);
    const heading = page.locator('#today-next-prayer');
    await heading.waitFor({ state: 'visible' });

    await page.screenshot({
      path: path.join(artifactDirectory, `v160-responsive-${name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name, metrics, navigationTargets: navigation.length };
  } finally {
    await context.close();
  }
}

async function runKeyboardBackScenario(browser, locale) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const name = `keyboard-back-${locale}`;
  try {
    await seed(page, locale, 'light');
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });

    const calendarButton = page.locator('[data-navigation-id="calendar"]');
    await calendarButton.focus();
    const focus = await calendarButton.evaluate((button) => {
      const style = getComputedStyle(button);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });
    assert(
      (focus.outlineStyle !== 'none' && Number.parseFloat(focus.outlineWidth) >= 2) ||
        focus.boxShadow !== 'none',
      `${name} keyboard focus is not visibly indicated`,
    );
    await page.keyboard.press('Enter');
    await page.locator('.prayer-calendar').waitFor({ state: 'visible' });
    assert(
      (await page.locator('.congregation-shell').getAttribute('data-destination')) === 'calendar',
      `${name} keyboard activation did not navigate to Calendar`,
    );

    await page.goBack({ waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });
    assert(
      (await page.locator('.congregation-shell').getAttribute('data-destination')) === 'today',
      `${name} browser Back did not restore Today`,
    );
    return { name, focus };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const matrix = [];
const textScale = [];
const keyboardBack = [];

try {
  let index = 0;
  for (const viewport of viewports) {
    for (const locale of locales) {
      for (const theme of themes) {
        matrix.push(await runMatrixScenario(browser, viewport, locale, theme, index));
        index += 1;
      }
    }
  }

  textScale.push(await runTextScaleScenario(browser, viewports[0], 'en'));
  textScale.push(await runTextScaleScenario(browser, viewports[4], 'ar'));
  keyboardBack.push(await runKeyboardBackScenario(browser, 'en'));
  keyboardBack.push(await runKeyboardBackScenario(browser, 'ar'));
} finally {
  await browser.close();
}

const results = { matrix, textScale, keyboardBack };
await writeFile(
  path.join(artifactDirectory, 'v160-responsive-matrix-results.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(
  `V1.6.0 responsive acceptance passed: ${String(matrix.length)} matrix scenarios, ${String(textScale.length)} 200% text scenarios and ${String(keyboardBack.length)} keyboard/back scenarios.`,
);
