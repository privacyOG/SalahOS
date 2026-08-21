import { writeFile } from 'node:fs/promises';
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

const scenarios = [
  {
    name: 'family-scale-4k-en',
    locale: 'en',
    displayTheme: 'midnight',
    hintsEnabled: true,
    now: Date.parse('2026-08-21T06:05:00.000Z'),
    mosqueName:
      'SalahOS Central Islamic Family Community School and Prayer Learning Centre of Greater Sydney',
  },
  {
    name: 'family-scale-4k-ar',
    locale: 'ar',
    displayTheme: 'classic',
    hintsEnabled: true,
    now: Date.parse('2026-08-21T08:05:00.000Z'),
    mosqueName: 'مدرسة ومركز صلاح أو إس لتعليم الصلاة',
  },
];

function settingsFor(scenario) {
  return {
    version: 2,
    locale: scenario.locale,
    theme: 'dark',
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

function assertMinimum(name, value, minimum) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${name} expected >= ${minimum}px, got ${String(value)}px`);
  }
}

async function validateScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  try {
    await seedScenario(page, scenario);
    const params = new URLSearchParams({
      mode: 'smart-display',
      template: 'family-classroom',
      hints: scenario.hintsEnabled ? 'on' : 'off',
      daylight: 'on',
    });
    await page.goto(`${baseUrl}/?${params.toString()}`, { waitUntil: 'networkidle' });

    const board = page.locator('[data-prayer-board-template="family-classroom"]');
    await board.waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const metrics = await board.evaluate((element) => {
      const numericFontSize = (selector) => {
        const node = element.querySelector(selector);
        return node instanceof HTMLElement ? Number.parseFloat(getComputedStyle(node).fontSize) : 0;
      };

      return {
        clockPx: numericFontSize('.family-classroom-board__clock > strong'),
        nextPrayerPx: numericFontSize('.family-classroom-board__next > strong'),
        countdownPx: numericFontSize('.family-classroom-board__countdown > strong'),
        prayerNamePx: numericFontSize('.family-classroom-prayer-row__name strong'),
        prayerTimePx: numericFontSize('.family-classroom-prayer-row__time'),
      };
    });

    assertMinimum(`${scenario.name} clock`, metrics.clockPx, 180);
    assertMinimum(`${scenario.name} next prayer`, metrics.nextPrayerPx, 100);
    assertMinimum(`${scenario.name} countdown`, metrics.countdownPx, 100);
    assertMinimum(`${scenario.name} prayer name`, metrics.prayerNamePx, 36);
    assertMinimum(`${scenario.name} prayer time`, metrics.prayerTimePx, 34);

    return { name: scenario.name, status: 'passed', metrics };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

try {
  for (const scenario of scenarios) {
    try {
      const result = await validateScenario(browser, scenario);
      results.push(result);
      console.log(`PASS ${scenario.name}: ${JSON.stringify(result.metrics)}`);
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
  path.join(artifactDirectory, 'family-classroom-scale-results.json'),
  `${JSON.stringify({ scenarios: results }, null, 2)}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Family & Classroom 4K scale failures: ${JSON.stringify(failures)}`);
}

console.log(`Family & Classroom 4K readability passed ${String(results.length)} scenarios.`);
