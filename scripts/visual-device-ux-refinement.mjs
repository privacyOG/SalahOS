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
    const contentRect = content.getBoundingClientRect();
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
      navTop: navRect.top,
      navBottom: navRect.bottom,
      viewportHeight: innerHeight,
      navHeight: navRect.height,
      contentTop: contentRect.top,
      contentBottom: contentRect.bottom,
      contentOverflowY: contentStyle.overflowY,
      contentClientHeight: content.clientHeight,
      contentScrollHeight: content.scrollHeight,
      navigationTargets,
      quickTargets,
      prayerRows: prayerRows.length,
      prayerTableRole: prayerTable.getAttribute('role'),
    };
  });
}

function assertPhoneMetrics(name, metrics) {
  if (metrics.navPosition !== 'relative') {
    throw new Error(
      `${name} primary navigation does not participate in shell layout: ${metrics.navPosition}`,
    );
  }
  if (Math.abs(metrics.navBottom - metrics.viewportHeight) > 1) {
    throw new Error(`${name} primary navigation is not pinned to the viewport bottom`);
  }
  if (Math.abs(metrics.contentBottom - metrics.navTop) > 1) {
    throw new Error(
      `${name} content/nav boundary is not contiguous: ${JSON.stringify({
        contentBottom: metrics.contentBottom,
        navTop: metrics.navTop,
      })}`,
    );
  }
  if (!['auto', 'scroll'].includes(metrics.contentOverflowY)) {
    throw new Error(`${name} content is not vertically scrollable: ${metrics.contentOverflowY}`);
  }
  if (metrics.contentScrollHeight <= metrics.contentClientHeight) {
    throw new Error(`${name} expected the Today surface to exercise the mobile scroll container`);
  }
  if (metrics.navigationTargets.length !== 6) {
    throw new Error(`${name} expected six primary navigation targets`);
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

async function reachableAboveNavigation(page, selector) {
  const target = page.locator(selector).last();
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))),
  );
  return target.evaluate((element) => {
    const nav = document.querySelector('.congregation-nav');
    const content = document.querySelector('.congregation-shell-content');
    if (!(nav instanceof HTMLElement) || !(content instanceof HTMLElement)) {
      throw new Error('congregation shell navigation/content missing');
    }
    const rect = element.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      visibleTop: contentRect.top,
      visibleBottom: Math.min(contentRect.bottom, navRect.top),
    };
  });
}

function assertReachable(name, label, metrics) {
  if (metrics.top < metrics.visibleTop - 1 || metrics.bottom > metrics.visibleBottom + 1) {
    throw new Error(
      `${name} ${label} cannot be fully reached above navigation: ${JSON.stringify(metrics)}`,
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
    const fontScale = scenario.fontScale ?? 1;
    if (fontScale !== 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setEmulatedOSTextScale', { scale: fontScale });
    }
    await seed(page, scenario.locale, scenario.theme);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('.today-prayer-table').waitFor({ state: 'visible' });
    assertNoHorizontalOverflow(scenario.name, await horizontalOverflow(page));
    const metrics = await phoneMetrics(page);
    assertPhoneMetrics(scenario.name, metrics);

    const ishaReachability = await reachableAboveNavigation(
      page,
      '.today-prayer-row:not(.today-prayer-row--header)',
    );
    assertReachable(scenario.name, 'Isha row', ishaReachability);
    const footerReachability = await reachableAboveNavigation(page, '.today-provenance');
    assertReachable(scenario.name, 'trailing provenance', footerReachability);

    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);
    await page.locator('.congregation-shell-content').evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return {
      name: scenario.name,
      fontScale,
      ...metrics,
      ishaReachability,
      footerReachability,
    };
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
    { name: 'stage43-phone-360-en', width: 360, height: 780, locale: 'en', theme: 'light' },
    { name: 'stage43-phone-390-en', width: 390, height: 844, locale: 'en', theme: 'light' },
    {
      name: 'stage43-phone-390-ar-large-text',
      width: 390,
      height: 844,
      locale: 'ar',
      theme: 'dark',
      fontScale: 1.25,
    },
    { name: 'stage25-phone-320-en', width: 320, height: 720, locale: 'en', theme: 'light' },
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
    path.join(artifactDirectory, 'stage43-device-ux-results.json'),
    `${JSON.stringify({ phones, wide }, null, 2)}\n`,
  );
  console.log(
    `Stage 43 phone/tablet/desktop device UX acceptance passed: ${String(phones.length + wide.length)} scenarios.`,
  );
} finally {
  await browser.close();
}
