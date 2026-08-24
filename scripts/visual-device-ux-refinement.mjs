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
const fixedNow = Date.parse('2026-08-21T03:00:00.000Z');

const mosqueNames = {
  en: 'SalahOS Community Masjid and Learning Centre for Families and Visitors',
  ar: 'مسجد ومركز صلاح أو إس المجتمعي للتعليم وخدمة العائلات والزوار',
};

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
    prayerSourceMode: 'local-mosque',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: {
      mosqueName: mosqueNames[locale],
      days: [
        {
          date: '2026-08-21',
          prayers: {
            fajr: { startLocalMinutes: 300, iqamah: { kind: 'fixed', localMinutes: 330 } },
            dhuhr: { startLocalMinutes: 780, iqamah: { kind: 'fixed', localMinutes: 810 } },
            asr: { startLocalMinutes: 930, iqamah: { kind: 'fixed', localMinutes: 960 } },
            maghrib: { startLocalMinutes: 1080, iqamah: { kind: 'fixed', localMinutes: 1090 } },
            isha: { startLocalMinutes: 1170, iqamah: { kind: 'fixed', localMinutes: 1200 } },
          },
        },
      ],
    },
    notifications: {},
  };
}

function boardConfigFor(locale) {
  return {
    version: 1,
    templateId: 'heritage-classic',
    primaryLocale: locale,
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: 'jewel',
  };
}

async function seed(page, locale) {
  await page.addInitScript(
    ({ now, settings, boardConfig }) => {
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
      localStorage.setItem('salahos.mobilePrayerBoardDisplayConfig', JSON.stringify(boardConfig));
    },
    { now: fixedNow, settings: settingsFor(locale), boardConfig: boardConfigFor(locale) },
  );
}

function assertNoHorizontalOverflow(metrics, name) {
  if (metrics.bodyWidth > metrics.viewportWidth + 2 || metrics.documentWidth > metrics.viewportWidth + 2) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function phoneMetrics(page) {
  return page.evaluate(() => {
    const navigation = document.querySelector('.congregation-nav');
    const content = document.querySelector('.congregation-shell-content');
    const navigationRect = navigation?.getBoundingClientRect();
    const contentRect = content?.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      navPosition: navigation === null ? '' : getComputedStyle(navigation).position,
      navTop: navigationRect?.top ?? -1,
      navBottom: navigationRect?.bottom ?? -1,
      contentBottom: contentRect?.bottom ?? -1,
      contentOverflowY: content === null ? '' : getComputedStyle(content).overflowY,
      contentScrollHeight: content?.scrollHeight ?? 0,
      contentClientHeight: content?.clientHeight ?? 0,
      navigationTargets: [...document.querySelectorAll('.congregation-nav-item')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
      quickTargets: [...document.querySelectorAll('.today-quick-links a')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
      prayerRows: document.querySelectorAll(
        '.today-prayer-row:not(.today-prayer-row--header):not(.is-supplementary)',
      ).length,
      prayerTableRole: document.querySelector('.today-prayer-table')?.getAttribute('role') ?? '',
    };
  });
}

function assertPhoneMetrics(metrics, name) {
  assertNoHorizontalOverflow(metrics, name);
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
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
  return target.evaluate((element) => {
    const targetRect = element.getBoundingClientRect();
    const navRect = document.querySelector('.congregation-nav')?.getBoundingClientRect();
    if (navRect === undefined) return false;
    return targetRect.bottom <= navRect.top + 1 && targetRect.top >= -1;
  });
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function validatePhone(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await seed(page, scenario.locale);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    const metrics = await phoneMetrics(page);
    assertPhoneMetrics(metrics, scenario.name);

    if (!(await reachableAboveNavigation(page, '.today-prayer-row[data-prayer="isha"]'))) {
      throw new Error(`${scenario.name} Isha row is not reachable above primary navigation`);
    }
    if (!(await reachableAboveNavigation(page, '.today-provenance'))) {
      throw new Error(`${scenario.name} provenance content is not reachable above primary navigation`);
    }

    await capture(page, scenario.name);
    return { name: scenario.name, ...metrics };
  } finally {
    await context.close();
  }
}

async function validateTablet(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await seed(page, scenario.locale);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      navPosition: getComputedStyle(document.querySelector('.congregation-nav')).position,
      navHeight: document.querySelector('.congregation-nav')?.getBoundingClientRect().height ?? 0,
      viewportHeight: window.innerHeight,
    }));
    assertNoHorizontalOverflow(metrics, scenario.name);
    if (metrics.navPosition !== 'sticky') {
      throw new Error(`${scenario.name} desktop/tablet navigation is not sticky`);
    }
    if (metrics.navHeight < metrics.viewportHeight - 1) {
      throw new Error(`${scenario.name} navigation rail does not span the viewport`);
    }
    await capture(page, scenario.name);
    return { name: scenario.name, ...metrics };
  } finally {
    await context.close();
  }
}

async function validateNavigation(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await seed(page, 'en');
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    const content = page.locator('.congregation-shell-content');
    await content.evaluate((element) => {
      element.scrollTop = 500;
    });
    await page.getByRole('button', { name: 'Mosques', exact: true }).click();
    await page.locator('[data-route="mosques"]').waitFor({ state: 'visible' });
    const scrollTop = await content.evaluate((element) => element.scrollTop);
    if (scrollTop !== 0) {
      throw new Error(`Navigation did not reset the internal shell scroll position: ${scrollTop}`);
    }
    const params = new URLSearchParams(new URL(page.url()).search);
    if (params.get('view') !== 'mosques') {
      throw new Error(`Navigation did not update the reloadable route: ${page.url()}`);
    }
    return { name: 'stage43-navigation-reset', scrollTop };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const scenario of [
    { name: 'stage43-phone-360-en', locale: 'en', viewport: { width: 360, height: 780 } },
    { name: 'stage43-phone-390-ar', locale: 'ar', viewport: { width: 390, height: 844 } },
  ]) {
    results.push(await validatePhone(browser, scenario));
  }
  results.push(
    await validateTablet(browser, {
      name: 'stage43-tablet-1024-en',
      locale: 'en',
      viewport: { width: 1024, height: 1366 },
    }),
  );
  results.push(await validateNavigation(browser));

  await writeFile(
    path.join(artifactDirectory, 'stage43-device-ux-refinement-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 43 device UX refinement acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
