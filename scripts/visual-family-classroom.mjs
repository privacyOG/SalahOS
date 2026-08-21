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
    name: 'family-classroom-1080-en-emerald-hints',
    width: 1920,
    height: 1080,
    locale: 'en',
    appTheme: 'light',
    displayTheme: 'emerald',
    hintsEnabled: true,
    daylightEnabled: true,
    now: Date.parse('2026-08-21T03:05:00.000Z'),
    mosqueName: 'SalahOS Family and Learning Centre Sydney',
  },
  {
    name: 'family-classroom-1080-ar-sandstone-no-hints-long-name',
    width: 1920,
    height: 1080,
    locale: 'ar',
    appTheme: 'light',
    displayTheme: 'sandstone',
    hintsEnabled: false,
    daylightEnabled: true,
    now: Date.parse('2026-08-21T06:05:00.000Z'),
    mosqueName: 'مركز صلاح أو إس الإسلامي للعائلات والطلاب وتعليم الصلاة في سيدني',
  },
  {
    name: 'family-classroom-4k-en-midnight-no-daylight-long-name',
    width: 3840,
    height: 2160,
    locale: 'en',
    appTheme: 'dark',
    displayTheme: 'midnight',
    hintsEnabled: true,
    daylightEnabled: false,
    now: Date.parse('2026-08-21T06:05:00.000Z'),
    mosqueName: 'SalahOS Central Islamic Family Community School and Prayer Learning Centre of Greater Sydney',
  },
  {
    name: 'family-classroom-4k-ar-classic-hints',
    width: 3840,
    height: 2160,
    locale: 'ar',
    appTheme: 'dark',
    displayTheme: 'classic',
    hintsEnabled: true,
    daylightEnabled: true,
    now: Date.parse('2026-08-21T08:05:00.000Z'),
    mosqueName: 'مدرسة ومركز صلاح أو إس لتعليم الصلاة',
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
    const params = new URLSearchParams({
      mode: 'smart-display',
      template: 'family-classroom',
      hints: scenario.hintsEnabled ? 'on' : 'off',
      daylight: scenario.daylightEnabled ? 'on' : 'off',
    });
    await page.goto(`${baseUrl}/?${params.toString()}`, { waitUntil: 'networkidle' });

    const root = page.locator('.smart-display');
    const board = page.locator('[data-prayer-board-template="family-classroom"]');
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
      state.displayTemplate !== 'family-classroom'
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
      throw new Error(`${scenario.name} made external requests: ${JSON.stringify(externalRequests)}`);
    }

    const hintsMode = await board.getAttribute('data-educational-hints');
    const daylightMode = await board.getAttribute('data-daylight-cues');
    if (hintsMode !== (scenario.hintsEnabled ? 'on' : 'off')) {
      throw new Error(`${scenario.name} hints mode mismatch: ${String(hintsMode)}`);
    }
    if (daylightMode !== (scenario.daylightEnabled ? 'on' : 'off')) {
      throw new Error(`${scenario.name} daylight mode mismatch: ${String(daylightMode)}`);
    }

    const prayerRows = await page.locator('.family-classroom-prayer-row').count();
    if (prayerRows !== 5) {
      throw new Error(`${scenario.name} expected 5 obligatory prayer rows, got ${prayerRows}`);
    }
    if ((await page.locator('.family-classroom-prayer-row__start').count()) !== 5) {
      throw new Error(`${scenario.name} missing Start/Athan learning column`);
    }
    if ((await page.locator('.family-classroom-prayer-row__iqamah').count()) !== 5) {
      throw new Error(`${scenario.name} missing Iqamah learning column`);
    }
    if ((await page.locator('.family-classroom-icon').count()) < 4) {
      throw new Error(`${scenario.name} missing approachable line iconography`);
    }

    const learningPanelCount = await page.locator('.family-classroom-board__learning').count();
    if (learningPanelCount !== (scenario.hintsEnabled ? 1 : 0)) {
      throw new Error(`${scenario.name} educational hint visibility mismatch`);
    }
    const daylightCount = await page.locator('.family-classroom-board__daylight').count();
    if (daylightCount !== (scenario.daylightEnabled ? 1 : 0)) {
      throw new Error(`${scenario.name} daylight cue visibility mismatch`);
    }
    if (scenario.daylightEnabled && (await page.locator('[data-solar-event="sunset"]').count()) !== 1) {
      throw new Error(`${scenario.name} missing sunset cue`);
    }

    const otherBoards = await page
      .locator(
        '[data-prayer-board-template="heritage-classic"], [data-prayer-board-template="minimal-modern"], [data-prayer-board-template="bold-countdown-focus"], [data-prayer-board-template="structured-split-board"], [data-prayer-board-template="scenic-spiritual"]',
      )
      .count();
    if (otherBoards !== 0) {
      throw new Error(`${scenario.name} unexpectedly rendered another prayer-board template`);
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
      throw new Error(`${scenario.name} board under-fills viewport: ${JSON.stringify(boardGeometry)}`);
    }

    const columnPresentation = await page.evaluate(() => {
      const start = document.querySelector('.family-classroom-prayer-row__start');
      const iqamah = document.querySelector('.family-classroom-prayer-row__iqamah');
      if (!(start instanceof HTMLElement) || !(iqamah instanceof HTMLElement)) return null;
      return {
        startColor: getComputedStyle(start).color,
        iqamahColor: getComputedStyle(iqamah).color,
        startWeight: getComputedStyle(start).fontWeight,
        iqamahWeight: getComputedStyle(iqamah).fontWeight,
      };
    });
    if (columnPresentation === null || columnPresentation.startColor === columnPresentation.iqamahColor) {
      throw new Error(
        `${scenario.name} Start and Iqamah columns are not visually distinct: ${JSON.stringify(columnPresentation)}`,
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
      hintsMode,
      daylightMode,
      boardGeometry,
      columnPresentation,
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
  path.join(artifactDirectory, 'family-classroom-results.json'),
  `${JSON.stringify({ scenarios: results }, null, 2)}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Family & Classroom visual failures: ${JSON.stringify(failures)}`);
}

console.log(`Family & Classroom visual acceptance passed ${String(results.length)} scenarios.`);
