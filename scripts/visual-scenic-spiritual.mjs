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

const scenarios = [
  {
    name: 'scenic-1080-en-midnight-artwork',
    width: 1920,
    height: 1080,
    locale: 'en',
    appTheme: 'dark',
    displayTheme: 'midnight',
    artworkEnabled: true,
    now: Date.parse('2026-08-21T03:05:00.000Z'),
    mosqueName: 'Masjid Al Noor Sydney',
  },
  {
    name: 'scenic-1080-ar-sandstone-plain-long-name',
    width: 1920,
    height: 1080,
    locale: 'ar',
    appTheme: 'light',
    displayTheme: 'sandstone',
    artworkEnabled: false,
    now: Date.parse('2026-08-21T06:05:00.000Z'),
    mosqueName: 'مسجد ومركز النور الإسلامي والمجتمعي في سيدني لخدمة العائلات والطلاب',
  },
  {
    name: 'scenic-4k-en-emerald-artwork-long-name',
    width: 3840,
    height: 2160,
    locale: 'en',
    appTheme: 'dark',
    displayTheme: 'emerald',
    artworkEnabled: true,
    now: Date.parse('2026-08-21T06:05:00.000Z'),
    mosqueName: 'SalahOS Central Islamic Community Mosque and Education Centre of Greater Sydney',
  },
  {
    name: 'scenic-4k-ar-classic-plain',
    width: 3840,
    height: 2160,
    locale: 'ar',
    appTheme: 'dark',
    displayTheme: 'classic',
    artworkEnabled: false,
    now: Date.parse('2026-08-21T08:05:00.000Z'),
    mosqueName: 'مسجد صلاح أو إس المركزي',
  },
];

function settingsFor(scenario) {
  return {
    version: 2,
    locale: scenario.locale,
    theme: scenario.appTheme,
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
      mosqueName: scenario.mosqueName,
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
          jumuahSessions: [
            { label: "Jumu'ah 1", khutbahLocalMinutes: 780, salahLocalMinutes: 800 },
            { label: "Jumu'ah 2", khutbahLocalMinutes: 840, salahLocalMinutes: 860 },
          ],
        },
      ],
    },
    notifications: {},
  };
}

async function seedScenario(page, scenario) {
  await page.addInitScript(
    ({ serializedSettings, displayTheme, now }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.smartDisplayTheme', displayTheme);

      const NativeDate = Date;
      class FrozenDate extends NativeDate {
        constructor(...args) {
          if (args.length === 0) {
            super(now);
          } else {
            super(...args);
          }
        }

        static now() {
          return now;
        }
      }

      Object.setPrototypeOf(FrozenDate, NativeDate);
      globalThis.Date = FrozenDate;
    },
    {
      serializedSettings: JSON.stringify(settingsFor(scenario)),
      displayTheme: scenario.displayTheme,
      now: scenario.now,
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
      const explicitlyClipsContent =
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

async function validateScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
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
    await seedScenario(page, scenario);
    const artworkQuery = scenario.artworkEnabled ? '' : '&artwork=off';
    await page.goto(`${baseUrl}/?mode=smart-display&template=scenic-spiritual${artworkQuery}`, {
      waitUntil: 'networkidle',
    });

    const root = page.locator('.smart-display');
    const board = page.locator('[data-prayer-board-template="scenic-spiritual"]');
    await root.waitFor({ state: 'visible' });
    await board.waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const state = await root.evaluate((element) => ({
      lang: element.getAttribute('lang'),
      dir: element.getAttribute('dir'),
      displayTheme: element.getAttribute('data-display-theme'),
      displayTemplate: element.getAttribute('data-display-template'),
      width: innerWidth,
      height: innerHeight,
    }));
    const expectedDirection = scenario.locale === 'ar' ? 'rtl' : 'ltr';
    if (state.lang !== scenario.locale || state.dir !== expectedDirection) {
      throw new Error(`${scenario.name} locale/direction mismatch: ${JSON.stringify(state)}`);
    }
    if (
      state.displayTheme !== scenario.displayTheme ||
      state.displayTemplate !== 'scenic-spiritual'
    ) {
      throw new Error(`${scenario.name} display selection mismatch: ${JSON.stringify(state)}`);
    }
    if (state.width !== scenario.width || state.height !== scenario.height) {
      throw new Error(`${scenario.name} viewport mismatch: ${JSON.stringify(state)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }
    if (externalRequests.length > 0) {
      throw new Error(
        `${scenario.name} made external requests: ${JSON.stringify(externalRequests)}`,
      );
    }

    const expectedArtworkMode = scenario.artworkEnabled ? 'scenic' : 'plain';
    const artworkMode = await board.getAttribute('data-artwork-mode');
    if (artworkMode !== expectedArtworkMode) {
      throw new Error(
        `${scenario.name} artwork mode mismatch: expected ${expectedArtworkMode}, got ${String(artworkMode)}`,
      );
    }

    const prayerRows = await page.locator('.scenic-spiritual-prayer-row').count();
    if (prayerRows !== 5) {
      throw new Error(`${scenario.name} expected 5 obligatory prayer rows, got ${prayerRows}`);
    }

    const otherBoards = await page
      .locator(
        '[data-prayer-board-template="heritage-classic"], [data-prayer-board-template="minimal-modern"], [data-prayer-board-template="bold-countdown-focus"], [data-prayer-board-template="structured-split-board"]',
      )
      .count();
    if (otherBoards !== 0) {
      throw new Error(`${scenario.name} unexpectedly rendered another prayer-board template`);
    }

    const jumuahSessions = await page.locator('.scenic-spiritual-board__jumuah article').count();
    if (jumuahSessions !== 2) {
      throw new Error(`${scenario.name} expected 2 Jumu'ah sessions, got ${jumuahSessions}`);
    }
    if ((await page.locator('[data-solar-event="sunset"]').count()) !== 1) {
      throw new Error(`${scenario.name} missing sunset module`);
    }

    const boardGeometry = await board.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
      };
    });
    if (
      boardGeometry.top < -2 ||
      boardGeometry.left < -2 ||
      boardGeometry.right > boardGeometry.viewportWidth + 2 ||
      boardGeometry.bottom > boardGeometry.viewportHeight + 2
    ) {
      throw new Error(`${scenario.name} board exceeds viewport: ${JSON.stringify(boardGeometry)}`);
    }
    if (boardGeometry.height < boardGeometry.viewportHeight * 0.9) {
      throw new Error(
        `${scenario.name} board under-fills viewport: ${JSON.stringify(boardGeometry)}`,
      );
    }

    const presentation = await board.evaluate((element) => {
      const before = getComputedStyle(element, '::before');
      const after = getComputedStyle(element, '::after');
      const focus = element.querySelector('.scenic-spiritual-board__focus');
      const schedule = element.querySelector('.scenic-spiritual-board__schedule');
      if (!(focus instanceof HTMLElement) || !(schedule instanceof HTMLElement)) return null;
      return {
        backgroundImage: before.backgroundImage,
        scrim: after.backgroundImage,
        focusBackground: getComputedStyle(focus).backgroundColor,
        scheduleBackground: getComputedStyle(schedule).backgroundColor,
      };
    });
    if (presentation === null) {
      throw new Error(`${scenario.name} missing Scenic readability regions`);
    }
    if (!presentation.scrim || presentation.scrim === 'none') {
      throw new Error(`${scenario.name} missing adaptive contrast scrim`);
    }
    if (
      presentation.focusBackground === 'transparent' ||
      presentation.focusBackground === 'rgba(0, 0, 0, 0)' ||
      presentation.scheduleBackground === 'transparent' ||
      presentation.scheduleBackground === 'rgba(0, 0, 0, 0)'
    ) {
      throw new Error(
        `${scenario.name} readability panels are transparent: ${JSON.stringify(presentation)}`,
      );
    }
    const hasScenicAsset = presentation.backgroundImage.includes('scenic-spiritual.svg');
    if (scenario.artworkEnabled !== hasScenicAsset) {
      throw new Error(
        `${scenario.name} artwork presentation mismatch: ${JSON.stringify(presentation)}`,
      );
    }

    const overflow = await findHorizontalOverflow(page);
    if (
      overflow.bodyScrollWidth > overflow.viewportWidth + 2 ||
      overflow.documentScrollWidth > overflow.viewportWidth + 2 ||
      overflow.offenders.length > 0
    ) {
      throw new Error(`${scenario.name} horizontal overflow: ${JSON.stringify(overflow)}`);
    }

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: false,
      animations: 'disabled',
    });

    return {
      name: scenario.name,
      status: 'passed',
      artworkMode,
      boardGeometry,
      presentation,
      overflow,
      externalRequests,
    };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

try {
  for (const scenario of scenarios) {
    try {
      results.push(await validateScenario(browser, scenario));
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
  path.join(artifactDirectory, 'scenic-spiritual-results.json'),
  `${JSON.stringify({ scenarios: results }, null, 2)}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Scenic Spiritual visual failures: ${JSON.stringify(failures)}`);
}

console.log(`Scenic Spiritual visual acceptance passed ${String(results.length)} scenarios.`);
