import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);
const weatherEndpoint = 'https://api.open-meteo.com/v1/forecast';

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(playwrightModule).href);

function settings() {
  return {
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
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

function mobileBoardConfig(weatherEnabled) {
  return {
    version: 1,
    templateId: 'minimal-modern',
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: 'emerald',
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
      weather: weatherEnabled,
    },
    branding: { mosqueName: null, logo: null },
    background: { kind: 'builtin', artworkId: 'quiet-grid' },
  };
}

function weatherPayload() {
  return {
    version: 1,
    config: {
      version: 1,
      enabled: true,
      provider: 'open-meteo',
      latitude: -33.8688,
      longitude: 151.2093,
      locationLabel: 'Sydney',
    },
    cache: null,
  };
}

async function seed(page, weatherEnabled) {
  await page.addInitScript(
    ({ serializedSettings, serializedBoard, serializedWeather }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.mobilePrayerBoardDisplayConfig', serializedBoard);
      localStorage.setItem('salahos.prayerBoardWeather', serializedWeather);
    },
    {
      serializedSettings: JSON.stringify(settings()),
      serializedBoard: JSON.stringify(mobileBoardConfig(weatherEnabled)),
      serializedWeather: JSON.stringify(weatherPayload()),
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

async function validateEnabledWeather(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  let providerRequests = 0;

  await page.route(`${weatherEndpoint}**`, async (route) => {
    providerRequests += 1;
    const requestUrl = route.request().url();
    if (!requestUrl.includes('latitude=-33.8688') || !requestUrl.includes('longitude=151.2093')) {
      throw new Error(`Phone/Home weather used unexpected coordinates: ${requestUrl}`);
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          time: '2026-08-23T00:30',
          temperature_2m: 19.2,
          weather_code: 61,
        },
      }),
    });
  });

  try {
    await seed(page, true);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    const weather = page.locator('.mobile-prayer-theme-surface > .prayer-board-weather');
    await weather.waitFor({ state: 'visible' });
    const text = await weather.textContent();
    if (!text?.includes('19°C') || !text.includes('Rain')) {
      throw new Error(`Phone/Home weather did not render the configured provider response: ${text}`);
    }
    if (providerRequests < 1) throw new Error('Phone/Home weather provider was not contacted');
    if ((await page.locator('.today-prayer-row:not(.today-prayer-row--header)').count()) !== 5) {
      throw new Error('Phone/Home weather altered the five obligatory prayer rows');
    }
    await weather.scrollIntoViewIfNeeded();
    await capture(page, 'mobile-prayer-board-weather-ready-en');

    await page.goto(`${baseUrl}/?view=settings&settingsView=display-themes`, {
      waitUntil: 'networkidle',
    });
    const editor = page.locator('.settings-display-entry .prayer-board-weather-settings');
    await editor.waitFor({ state: 'visible' });
    if (!(await editor.locator('[data-weather-phone-home]').isChecked())) {
      throw new Error('Phone/Home weather opt-in was not reflected in Settings');
    }
    await editor.scrollIntoViewIfNeeded();
    await capture(page, 'mobile-prayer-board-weather-settings-en');

    return { providerRequests, fivePrayerRows: true, phoneHomeOptIn: true };
  } finally {
    await context.close();
  }
}

async function validateModuleOffNoRequest(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  let providerRequests = 0;

  await page.route(`${weatherEndpoint}**`, async (route) => {
    providerRequests += 1;
    await route.abort();
  });

  try {
    await seed(page, false);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    if (providerRequests !== 0) {
      throw new Error('Phone/Home weather contacted the provider while its module was disabled');
    }
    if ((await page.locator('.mobile-prayer-theme-surface > .prayer-board-weather').count()) !== 0) {
      throw new Error('Phone/Home weather rendered while its module was disabled');
    }
    if ((await page.locator('.today-prayer-row:not(.today-prayer-row--header)').count()) !== 5) {
      throw new Error('Disabled Phone/Home weather affected the five-prayer timetable');
    }
    return { moduleOffProviderRequests: providerRequests };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await validateEnabledWeather(browser),
    await validateModuleOffNoRequest(browser),
  ];
  await writeFile(
    path.join(artifactDirectory, 'mobile-prayer-board-weather-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Phone/Home weather visual acceptance passed: ${results.length} flows`);
} finally {
  await browser.close();
}