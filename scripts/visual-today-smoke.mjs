import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(path.resolve(playwrightModule)).href);
const fixedNow = Date.parse('2026-08-17T05:30:00.000Z');
const settings = {
  version: 2,
  locale: 'en',
  theme: 'light',
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

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];

page.on('pageerror', (error) => {
  pageErrors.push(error.stack ?? error.message);
});
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

try {
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
      serializedSettings: JSON.stringify(settings),
      frozenNow: fixedNow,
    },
  );

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(250);

  const state = await page.evaluate(() => {
    const root = document.querySelector('#root');
    return {
      url: location.href,
      rootChildCount: root?.childElementCount ?? -1,
      rootText: root?.textContent?.slice(0, 1_000) ?? null,
      rootHtml: root?.innerHTML.slice(0, 2_000) ?? null,
      appShellCount: document.querySelectorAll('.app-shell').length,
      todayScreenCount: document.querySelectorAll('.today-screen').length,
      bodyText: document.body.textContent?.slice(0, 1_000) ?? null,
    };
  });

  if (pageErrors.length > 0) {
    throw new Error(`Today page errors: ${pageErrors.join(' | ')}`);
  }
  if (state.appShellCount !== 1 || state.todayScreenCount !== 1) {
    throw new Error(
      `Today did not render the expected shell: ${JSON.stringify({ state, consoleErrors })}`,
    );
  }

  console.log(`Today render smoke passed: ${JSON.stringify(state)}`);
} finally {
  await context.close();
  await browser.close();
}
