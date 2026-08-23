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
const fixedNow = Date.parse('2026-08-23T05:30:00.000Z');

function settings(locale, theme = 'light') {
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
    ({ persistedSettings, now }) => {
      localStorage.setItem('salahos.settings', persistedSettings);
      const NativeDate = Date;
      class FrozenDate extends NativeDate {
        constructor(...args) {
          if (args.length === 0) super(now);
          else super(...args);
        }
        static now() {
          return now;
        }
      }
      Object.setPrototypeOf(FrozenDate, NativeDate);
      globalThis.Date = FrozenDate;
    },
    { persistedSettings: JSON.stringify(settings(locale, theme)), now: fixedNow },
  );
}

async function horizontalOverflow(page) {
  return page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    bodyWidth: document.body.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
}

function assertNoHorizontalOverflow(name, overflow) {
  if (
    overflow.bodyWidth > overflow.viewportWidth + 2 ||
    overflow.documentWidth > overflow.viewportWidth + 2
  ) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function phoneMetrics(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.congregation-nav');
    const content = document.querySelector('.congregation-shell-content');
    const prayerTable = document.querySelector('.today-prayer-table');
    if (!(nav instanceof HTMLElement) || !(content instanceof HTMLElement)) {
      throw new Error('congregation shell navigation/content missing');
    }
    if (!(prayerTable instanceof HTMLElement)) {
      throw new Error('Today prayer timetable missing');
    }

    const navStyle = getComputedStyle(nav);
    const navRect = nav.getBoundingClientRect();
    const contentStyle = getComputedStyle(content);
    const navigationTargets = [...nav.querySelectorAll('button')].map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, label: element.textContent?.trim() ?? '' };
    });
    const quickTargets = [...document.querySelectorAll('.today-quick-actions a')].map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, label: element.textContent?.trim() ?? '' };
    });
    const prayerRows = prayerTable.querySelectorAll(
      '.today-prayer-row:not(.today-prayer-row--header)',
    );

    return {
      navPosition: navStyle.position,
      navBottom: Math.round(navRect.bottom),
      viewportHeight: innerHeight,
      navHeight: navRect.height,
      contentBottomPadding: Number.parseFloat(contentStyle.paddingBottom),
      navigationTargets,
      quickTargets,
      prayerRows: prayerRows.length,
      prayerTableRole: prayerTable.getAttribute('role'),
    };
  });
}

function assertPhoneMetrics(name, metrics) {
  if (metrics.navPosition !== 'fixed') {
    throw new Error(`${name} primary navigation is not fixed: ${metrics.navPosition}`);
  }
  if (Math.abs(metrics.navBottom - metrics.viewportHeight) > 1) {
    throw new Error(`${name} primary navigation is not pinned to the viewport bottom`);
  }
  if (metrics.contentBottomPadding + 1 < metrics.navHeight) {
    throw new Error(
      `${name} content reserve ${String(metrics.contentBottomPadding)}px is smaller than nav ${String(metrics.navHeight)}px`,
    );
  }
  if (metrics.navigationTargets.length !== 5) {
    throw new Error(`${name} expected five primary navigation targets`);
  }
  for (const target of [...metrics.navigationTargets, ...metrics.quickTargets]) {
    if (target.width < 44 || target.height < 44) {
      throw new Error(`${name} touch target below 44px: ${JSON.stringify(target)}`);
    }
  }
  if (metrics.prayerRows !== 5 || metrics.prayerTableRole !== 'table') {
    throw new Error(
      `${name} prayer schedule is not one scan-friendly five-prayer table: ${JSON.stringify(metrics)}`,
    );
  }
}

async function validatePhone(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await seed(page, scenario.locale, scenario.theme);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('.today-prayer-table').waitFor({ state: 'visible' });
    if ((scenario.fontScale ?? 1) !== 1) {
      const expectedScale = scenario.fontScale ?? 1;
      await page.evaluate(
        (fontSize) => {
          document.documentElement.style.setProperty('font-size', fontSize, 'important');
        },
        `${String(expectedScale * 100)}%`,
      );
      const rootFontSize = await page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      );
      const expectedRootFontSize = 16 * expectedScale;
      if (Math.abs(rootFontSize - expectedRootFontSize) > 0.5) {
        throw new Error(
          `${scenario.name} enlarged-text fixture inactive: expected ${String(expectedRootFontSize)}px root, got ${String(rootFontSize)}px`,
        );
      }
    }
    assertNoHorizontalOverflow(scenario.name, await horizontalOverflow(page));
    const metrics = await phoneMetrics(page);
    assertPhoneMetrics(scenario.name, metrics);
    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name: scenario.name, ...metrics };
  } finally {
    await context.close();
  }
}

async function validateWide(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, scenario.locale, scenario.theme);
    await page.goto(`${baseUrl}/?view=${scenario.view}`, { waitUntil: 'networkidle' });
    await page.locator('.congregation-shell').waitFor({ state: 'visible' });
    assertNoHorizontalOverflow(scenario.name, await horizontalOverflow(page));
    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.congregation-shell');
      const nav = document.querySelector('.congregation-nav');
      const content = document.querySelector('.congregation-shell-content');
      if (
        !(shell instanceof HTMLElement) ||
        !(nav instanceof HTMLElement) ||
        !(content instanceof HTMLElement)
      ) {
        throw new Error('wide congregation shell missing');
      }
      const shellColumns = getComputedStyle(shell).gridTemplateColumns;
      const navStyle = getComputedStyle(nav);
      const contentRect = content.getBoundingClientRect();
      const readableBlocks = [...content.querySelectorAll('p')]
        .map((element) => element.getBoundingClientRect().width)
        .filter((width) => width > 0);
      return {
        shellColumns,
        navPosition: navStyle.position,
        contentWidth: contentRect.width,
        viewportWidth: innerWidth,
        widestParagraph: readableBlocks.length > 0 ? Math.max(...readableBlocks) : 0,
      };
    });
    if (metrics.navPosition !== 'sticky') {
      throw new Error(
        `${scenario.name} expected a sticky rail/sidebar, got ${metrics.navPosition}`,
      );
    }
    if (!metrics.shellColumns.includes('px') || metrics.contentWidth >= metrics.viewportWidth) {
      throw new Error(`${scenario.name} did not reserve deliberate navigation/content columns`);
    }
    if (metrics.widestParagraph > 900) {
      throw new Error(
        `${scenario.name} paragraph line length stretched excessively: ${metrics.widestParagraph}px`,
      );
    }
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name: scenario.name, ...metrics };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const phones = [];
  for (const scenario of [
    { name: 'stage25-phone-320-en', width: 320, height: 720, locale: 'en', theme: 'light' },
    {
      name: 'stage25-phone-390-ar-large-text',
      width: 390,
      height: 844,
      locale: 'ar',
      theme: 'dark',
      fontScale: 1.25,
    },
    { name: 'stage25-phone-430-tr', width: 430, height: 932, locale: 'tr', theme: 'light' },
    { name: 'stage25-phone-430-id', width: 430, height: 932, locale: 'id', theme: 'dark' },
  ]) {
    phones.push(await validatePhone(browser, scenario));
  }

  const wide = [];
  for (const scenario of [
    {
      name: 'stage25-tablet-1024-ar-community',
      width: 1024,
      height: 1366,
      locale: 'ar',
      theme: 'dark',
      view: 'community',
    },
    {
      name: 'stage25-desktop-1440-en-qiblah',
      width: 1440,
      height: 1000,
      locale: 'en',
      theme: 'light',
      view: 'qiblah',
    },
    {
      name: 'stage25-desktop-1600-en-today',
      width: 1600,
      height: 1000,
      locale: 'en',
      theme: 'dark',
      view: 'today',
    },
  ]) {
    wide.push(await validateWide(browser, scenario));
  }

  await writeFile(
    path.join(artifactDirectory, 'stage25-device-ux-results.json'),
    `${JSON.stringify({ phones, wide }, null, 2)}\n`,
  );
  console.log(
    `Stage 25 phone/tablet/desktop device UX acceptance passed: ${String(phones.length + wide.length)} scenarios.`,
  );
} finally {
  await browser.close();
}
